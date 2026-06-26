"""Build the inlined data file (viewer/data.js) for the World Cup 2026 web viewer.

Run from the repo root:

    PYTHONPATH=src python viewer/build_data.py

Produces ``viewer/data.js`` containing ``window.WC_DATA = {...}`` so the viewer
works by simply opening index.html in a browser (no server needed).
"""

from __future__ import annotations

import csv
import json
import math
from collections import defaultdict
from pathlib import Path

import random
from collections import Counter
from dataclasses import replace
from datetime import datetime, timedelta, timezone

from playerelo import (
    EloConfig,
    EloMatchModel,
    WorldCup2026Simulator,
    load_group_schedule_csv,
    load_played_group_matches_csv,
    load_teams_csv,
    simulate_world_cup_2026,
    update_elo_pair,
    win_probability,
)
from playerelo.elo import expected_goals
from playerelo.world_cup_2026 import (
    GROUPS,
    ROUND_OF_32,
    STAGE_COLUMNS,
    MatchResult,
    TournamentRun,
    _qualified_positions,
    _record_knockout_stage_progress,
    _resolve_knockout_spec,
    third_place_assignment,
)

ROOT = Path(__file__).resolve().parent.parent
TEAMS_CSV = ROOT / "data" / "world_cup_2026_teams.csv"
SCHEDULE_CSV = ROOT / "data" / "world_cup_2026_schedule.csv"
PLAYED_CSV = ROOT / "data" / "world_cup_2026_played_results_as_of_2026-06-15.csv"
OUT = ROOT / "viewer" / "data.js"

# High-precision count for the authoritative current-state numbers
# (standings table, team pages, bracket, meetings) and the final snapshot.
SIMULATIONS = 100000
# Lighter count for each intermediate time-machine snapshot (one per match).
SNAPSHOT_SIMULATIONS = 40000
SEED = 42
# K-factor 100: exaggerated, dramatic Elo swings per match (eloratings uses ~60 for
# World Cup games). Applies to both the displayed match-by-match Elo progression and
# the in-simulation Elo updates.
CONFIG = EloConfig(rating_k_factor=100)


def load_schedule_rows() -> list[dict]:
    """Full schedule rows (group + knockout) with resolved names where known."""
    with SCHEDULE_CSV.open(newline="") as handle:
        return list(csv.DictReader(handle))


_KST_WEEKDAY = ["월", "화", "수", "목", "금", "토", "일"]


def to_kst(local_date: str, local_time: str, utc_offset) -> dict:
    """Convert a venue-local kickoff to Korea Standard Time (UTC+9).

    Returns {} when the inputs are incomplete/unparseable.
    """
    local_date = (local_date or "").strip()
    local_time = (local_time or "").strip()
    offset = str(utc_offset).strip() if utc_offset not in (None, "") else ""
    if not local_date or not local_time or offset == "":
        return {}
    try:
        dt = datetime.strptime(f"{local_date} {local_time}", "%Y-%m-%d %I:%M %p")
        kst = dt + timedelta(hours=9 - int(offset))
    except ValueError:
        return {}
    return {
        "kst_date": kst.strftime("%Y-%m-%d"),
        "kst_time": kst.strftime("%H:%M"),
        "kst_weekday": _KST_WEEKDAY[kst.weekday()],
    }


def poisson_pmf(rate: float, k: int) -> float:
    return math.exp(-rate) * rate ** k / math.factorial(k)


def match_outcome_probs(elo_a: float, elo_b: float, max_goals: int = 12) -> dict:
    """Analytic win/draw/loss probabilities from the Poisson scoring model."""
    rate_a, rate_b = expected_goals(elo_a, elo_b, CONFIG)
    pa = [poisson_pmf(rate_a, k) for k in range(max_goals + 1)]
    pb = [poisson_pmf(rate_b, k) for k in range(max_goals + 1)]
    win = draw = loss = 0.0
    for ga in range(max_goals + 1):
        for gb in range(max_goals + 1):
            p = pa[ga] * pb[gb]
            if ga > gb:
                win += p
            elif ga == gb:
                draw += p
            else:
                loss += p
    total = win + draw + loss
    return {
        "win": win / total,
        "draw": draw / total,
        "loss": loss / total,
        "xg_a": round(rate_a, 2),
        "xg_b": round(rate_b, 2),
        # Knockout (decisive) win prob, splitting draws by the tiebreak model.
        "win_decisive": win_probability(elo_a, elo_b, CONFIG.elo_scale),
    }


class TrackingSimulator(WorldCup2026Simulator):
    """Simulator that also records the Round-of-32 pairing of every run.

    Mirrors ``WorldCup2026Simulator.run_once`` but captures, for each R32 match,
    the two teams that meet so we can build per-team opponent distributions.
    """

    def run_once_tracked(self, rng):
        """Like run_once but returns every knockout match as
        (match_id, stage, team_a_name, team_b_name, winner_name)."""
        stage_teams = {stage: set() for stage in STAGE_COLUMNS}
        current_elos = {team.name: team.elo for team in self.teams}
        standings_by_group = self._simulate_group_stage(rng, current_elos)

        for group in GROUPS:
            stage_teams["group_winner"].add(standings_by_group[group][0].team.name)
            stage_teams["group_runner_up"].add(standings_by_group[group][1].team.name)
            stage_teams["reach_r32"].update(
                s.team.name for s in standings_by_group[group][:2]
            )

        third_groups = self._advancing_third_place_groups(standings_by_group, rng)
        for group in third_groups:
            third_team = standings_by_group[group][2].team
            stage_teams["advance_as_third"].add(third_team.name)
            stage_teams["reach_r32"].add(third_team.name)

        positions = _qualified_positions(standings_by_group, third_groups)
        third_assignment = third_place_assignment(third_groups)

        match_winners = {}
        match_losers = {}
        events = []
        for scheduled in self.knockout_schedule:
            team_a = _resolve_knockout_spec(
                scheduled.team_a_spec, positions, third_assignment,
                match_winners, match_losers, opposing_spec=scheduled.team_b_spec,
            )
            team_b = _resolve_knockout_spec(
                scheduled.team_b_spec, positions, third_assignment,
                match_winners, match_losers, opposing_spec=scheduled.team_a_spec,
            )
            winner, loser = self._play_knockout(team_a, team_b, rng, current_elos)
            match_winners[scheduled.match_id] = winner
            match_losers[scheduled.match_id] = loser
            _record_knockout_stage_progress(stage_teams, scheduled.stage, winner, loser)
            events.append(
                (scheduled.match_id, scheduled.stage, team_a.name, team_b.name, winner.name)
            )
        group_pos = {}
        for group in GROUPS:
            for idx, standing in enumerate(standings_by_group[group]):
                group_pos[standing.team.name] = idx + 1  # 1..4
        # 각 조 3위의 (팀, 승점, 진출여부) — 베스트 3위 레이스 집계용
        thirds = []
        third_set = set(third_groups)
        for group in GROUPS:
            third = standings_by_group[group][2]
            thirds.append((third.team.name, third.points, group in third_set))
        return events, group_pos, thirds


class MotivationTrackingSimulator(TrackingSimulator):
    """추적 시뮬레이터 + 동기(승점 상황) 보정.

    coast: 양 팀 모두 동기가 낮은(데드러버/안전 확보) 미진행 경기 → Elo 격차를 평균으로
           완전히 좁히고(우위 제거) 평균 득점도 ↓ (무승부↑·대량득점↓).
    half:  한 팀만 동기가 낮은 경기 → Elo 격차를 절반만 좁힘(강팀이 살살 하지만
           동기 있는 약팀은 끝까지 노림), 득점은 그대로.
    """

    def __init__(self, *args, coast=None, half=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.coast = coast or set()
        self.half = half or set()

    def _group_match_result(self, team_a, team_b, rng, current_elos):
        fixed = self.played_group_matches.get(frozenset((team_a.name, team_b.name)))
        if fixed is not None:
            return super()._group_match_result(team_a, team_b, rng, current_elos)
        key = frozenset((team_a.name, team_b.name))
        if key in self.coast:
            blend, goal_factor = 1.0, 0.72
        elif key in self.half:
            blend, goal_factor = 0.5, 1.0
        else:
            return super()._group_match_result(team_a, team_b, rng, current_elos)
        cfg = self.match_model.config
        ea, eb = current_elos[team_a.name], current_elos[team_b.name]
        avg = (ea + eb) / 2
        ea2 = ea + blend * (avg - ea)  # 우위 축소(blend=1이면 동일, 0.5면 절반)
        eb2 = eb + blend * (avg - eb)
        mean = cfg.mean_goals * goal_factor
        model = self.match_model if mean == cfg.mean_goals else EloMatchModel(replace(cfg, mean_goals=mean))
        score = model.simulate_regulation_score(ea2, eb2, rng)
        return MatchResult(team_a, team_b, score.goals_a, score.goals_b)


def compute_tracking(teams, group_schedule, played_subset, simulations, seed, motivation=None):
    """Single tracked Monte Carlo pass producing three knockout artifacts:

    - r32_opponents: per team, top-5 likely Round-of-32 opponents (conditional)
    - meetings: P(two teams meet) broken down by stage
    - bracket: per knockout match_id, the likely occupants of each side + winner
    """
    if motivation is not None:
        sim = MotivationTrackingSimulator(
            teams,
            match_model=EloMatchModel(CONFIG),
            played_group_matches=[e["match"] for e in played_subset],
            group_schedule=group_schedule,
            coast=motivation[0], half=motivation[1],
        )
    else:
        sim = TrackingSimulator(
            teams,
            match_model=EloMatchModel(CONFIG),
            played_group_matches=[e["match"] for e in played_subset],
            group_schedule=group_schedule,
        )
    rng = random.Random(seed)
    opp_counts = {t.name: Counter() for t in teams}
    reach_counts = Counter()
    meet = defaultdict(Counter)   # (a,b) sorted -> stage -> count
    meet_total = Counter()
    bracket = {}                  # match_id -> {a,b,w Counters, stage, n}
    pos_counts = {t.name: Counter() for t in teams}  # team -> finishing position 1..4
    third_cnt = Counter()       # team -> # times finished 3rd
    third_adv = Counter()       # team -> # times advanced as best-3rd
    third_pts = Counter()       # team -> sum of points when finishing 3rd

    for _ in range(simulations):
        events, group_pos, thirds = sim.run_once_tracked(rng)
        for name, pos in group_pos.items():
            pos_counts[name][pos] += 1
        for name, pts, advanced in thirds:
            third_cnt[name] += 1
            third_pts[name] += pts
            if advanced:
                third_adv[name] += 1
        for mid, stage, a, b, w in events:
            br = bracket.get(mid)
            if br is None:
                br = bracket[mid] = {"a": Counter(), "b": Counter(), "w": Counter(),
                                     "stage": stage, "n": 0}
            br["a"][a] += 1
            br["b"][b] += 1
            br["w"][w] += 1
            br["n"] += 1
            key = (a, b) if a < b else (b, a)
            meet[key][stage] += 1
            meet_total[key] += 1
            if stage == "round_of_32":
                opp_counts[a][b] += 1
                opp_counts[b][a] += 1
                reach_counts[a] += 1
                reach_counts[b] += 1

    # r32 opponents (conditional on reaching R32)
    r32_opponents = {}
    for t in teams:
        total = reach_counts[t.name]
        r32_opponents[t.name] = (
            [{"team": o, "prob": round(c / total, 4)} for o, c in opp_counts[t.name].most_common(5)]
            if total else []
        )

    # pairwise meeting probabilities (drop pairs that almost never meet)
    meetings = {}
    for key, total in meet_total.items():
        p = total / simulations
        if p < 0.003:
            continue
        a, b = key
        meetings[f"{a}|{b}"] = {
            "total": round(p, 4),
            "stages": {st: round(c / simulations, 4) for st, c in meet[key].items()},
        }

    # bracket projection
    bracket_out = {}
    for mid, br in bracket.items():
        n = br["n"]
        bracket_out[str(mid)] = {
            "stage": br["stage"],
            "a": [{"team": t, "prob": round(c / n, 4)} for t, c in br["a"].most_common(4)],
            "b": [{"team": t, "prob": round(c / n, 4)} for t, c in br["b"].most_common(4)],
            "winner": [{"team": t, "prob": round(c / n, 4)} for t, c in br["w"].most_common(3)],
        }

    # group finishing-position probabilities (1st..4th)
    group_positions = {}
    for t in teams:
        c = pos_counts[t.name]
        group_positions[t.name] = {
            "p1": round(c[1] / simulations, 4),
            "p2": round(c[2] / simulations, 4),
            "p3": round(c[3] / simulations, 4),
            "p4": round(c[4] / simulations, 4),
        }

    # 베스트 3위 레이스: 3위 가능성이 있는 팀들의 3위확률/진출확률/예상 3위승점
    third_race = {}
    for t in teams:
        tc = third_cnt[t.name]
        if tc == 0:
            continue
        third_race[t.name] = {
            "group": t.group,
            "p3": round(tc / simulations, 4),                  # 조 3위로 마칠 확률
            "p_advance": round(third_adv[t.name] / simulations, 4),  # 베스트 3위로 진출할 확률
            "cond_advance": round(third_adv[t.name] / tc, 4),  # 3위일 때 진출 조건부 확률
            "exp_points_if_3rd": round(third_pts[t.name] / tc, 2),   # 3위로 마칠 때 평균 승점
        }

    return r32_opponents, meetings, bracket_out, group_positions, third_race


def main() -> None:
    teams = load_teams_csv(TEAMS_CSV)
    schedule_rows = load_schedule_rows()
    group_schedule = load_group_schedule_csv(SCHEDULE_CSV)
    knockout_schedule = None  # only group games played so far; keep sim on group schedule
    played = load_played_group_matches_csv(PLAYED_CSV)

    team_by_name = {t.name: t for t in teams}
    base_elo = {t.name: t.elo for t in teams}

    # --- Map played results to their scheduled match/date via team names ---
    sched_by_pair: dict[frozenset, dict] = {}
    for row in schedule_rows:
        a, b = row.get("team_a", "").strip(), row.get("team_b", "").strip()
        if a and b:
            sched_by_pair[frozenset((a, b))] = row

    played_with_meta = []
    for m in played:
        meta = sched_by_pair.get(frozenset((m.team_a, m.team_b)), {})
        kst = to_kst(meta.get("local_date"), meta.get("local_time"), meta.get("utc_offset"))
        played_with_meta.append(
            {
                "match": m,
                "match_id": int(meta.get("match_id", 0) or 0),
                "date": meta.get("local_date", "").strip(),
                "time": meta.get("local_time", "").strip(),
                "group": meta.get("group", "").strip(),
                "kst": kst,
            }
        )
    # Chronological order by ACTUAL kickoff time in KST (match_id is not time-ordered).
    played_with_meta.sort(key=lambda x: (
        x["kst"].get("kst_date") or x["date"],
        x["kst"].get("kst_time") or x["time"],
        x["match_id"],
    ))

    # --- Deterministic Elo progression from actual results ---
    live_elo = dict(base_elo)
    elo_matches = []  # per played match with before/after elo
    for entry in played_with_meta:
        m = entry["match"]
        ea, eb = live_elo[m.team_a], live_elo[m.team_b]
        na, nb = update_elo_pair(
            ea,
            eb,
            m.goals_a,
            m.goals_b,
            k_factor=CONFIG.rating_k_factor,
            scale=CONFIG.elo_scale,
            margin_weight=CONFIG.rating_margin_weight,
        )
        live_elo[m.team_a], live_elo[m.team_b] = na, nb
        elo_matches.append(
            {
                "date": entry["date"],
                "kst_date": entry["kst"].get("kst_date", entry["date"]),
                "kst_time": entry["kst"].get("kst_time", ""),
                "group": entry["group"],
                "team_a": m.team_a,
                "team_b": m.team_b,
                "goals_a": m.goals_a,
                "goals_b": m.goals_b,
                "elo_a_before": round(ea, 1),
                "elo_b_before": round(eb, 1),
                "elo_a_after": round(na, 1),
                "elo_b_after": round(nb, 1),
                "delta_a": round(na - ea, 1),
                "delta_b": round(nb - eb, 1),
            }
        )

    # Per-team current elo and total observed change.
    current_elo = dict(live_elo)

    # --- Snapshots: probability evolution, grouped by KST kickoff time ---
    # 같은 시각(KST 킥오프)에 열린 경기들은 하나의 타임라인 스냅샷으로 함께 반영한다.
    snapshots = []  # each: {label, date, played_count, last_match, matches, teams}

    def run_snapshot(label, date, played_subset, matches, sims):
        probs = simulate_world_cup_2026(
            teams,
            simulations=sims,
            seed=SEED,
            elo_config=CONFIG,
            played_group_matches=[e["match"] for e in played_subset],
            group_schedule=group_schedule,
            knockout_schedule=knockout_schedule,
            show_progress=False,
        )
        team_data = {}
        for p in probs:
            row = p.to_row()
            team_data[p.team] = {
                "champion": row["champion"],
                "reach_final": row["reach_final"],
                "reach_sf": row["reach_sf"],
                "reach_qf": row["reach_qf"],
                "reach_r16": row["reach_r16"],
                "reach_r32": row["reach_r32"],
                "avg_final_elo": row["avg_final_elo"],
                "avg_elo_change": row["avg_elo_change"],
            }
        snapshots.append(
            {
                "label": label,
                "date": date,
                "played_count": len(played_subset),
                "last_match": matches[-1] if matches else None,
                "matches": matches or [],
                "teams": team_data,
            }
        )

    def time_key(e):
        return (e["kst"].get("kst_date") or e["date"], e["kst"].get("kst_time") or e.get("time", ""))

    # 킥오프 시각이 같은(연속된) 경기끼리 그룹화 (played_with_meta는 이미 KST 시각순 정렬).
    time_groups = []
    for e in played_with_meta:
        if time_groups and time_key(e) == time_key(time_groups[-1][-1]):
            time_groups[-1].append(e)
        else:
            time_groups.append([e])

    print(f"Running pre-tournament snapshot ({SNAPSHOT_SIMULATIONS} sims)...")
    run_snapshot("개막 전", "", [], None, SNAPSHOT_SIMULATIONS)
    cum = 0
    for gi, grp in enumerate(time_groups):
        cum += len(grp)
        subset = played_with_meta[:cum]
        matches = [{
            "team_a": e["match"].team_a, "team_b": e["match"].team_b,
            "goals_a": e["match"].goals_a, "goals_b": e["match"].goals_b,
            "group": e["group"],
            "kst_date": e["kst"].get("kst_date", e["date"]),
            "kst_time": e["kst"].get("kst_time", ""),
        } for e in grp]
        last = grp[-1]
        # The final (current) state gets the high-precision simulation count.
        sims = SIMULATIONS if gi == len(time_groups) - 1 else SNAPSHOT_SIMULATIONS
        desc = " · ".join(f"{m['team_a']} {m['goals_a']}-{m['goals_b']} {m['team_b']}" for m in matches)
        print(f"Running snapshot {gi + 1}/{len(time_groups)} "
              f"(KST {matches[0]['kst_date']} {matches[0]['kst_time']}, {len(grp)}경기: {desc}, {sims} sims)...")
        run_snapshot(f"{cum}경기", last["date"], subset, matches, sims)

    # Latest snapshot (full current state, high precision) drives the table.
    latest = snapshots[-1]

    # --- Team table ---
    team_table = []
    for t in teams:
        ld = latest["teams"].get(t.name, {})
        team_table.append(
            {
                "team": t.name,
                "group": t.group,
                "confederation": t.confederation,
                "continent": t.continent,
                "fifa_rank": t.fifa_rank,
                "base_elo": round(base_elo[t.name], 1),
                "current_elo": round(current_elo[t.name], 1),
                "elo_change_actual": round(current_elo[t.name] - base_elo[t.name], 1),
                "titles": t.world_cup_titles,
                "best_result": t.best_world_cup_result,
                "champion": ld.get("champion", 0.0),
                "reach_final": ld.get("reach_final", 0.0),
                "reach_sf": ld.get("reach_sf", 0.0),
                "reach_qf": ld.get("reach_qf", 0.0),
                "reach_r16": ld.get("reach_r16", 0.0),
                "reach_r32": ld.get("reach_r32", 0.0),
            }
        )
    team_table.sort(key=lambda r: r["champion"], reverse=True)

    # --- Next matchups (upcoming group games, using current elo) ---
    played_pairs = {frozenset((e["match"].team_a, e["match"].team_b)) for e in played_with_meta}
    next_matches = []
    for row in schedule_rows:
        stage = row.get("stage", "").strip()
        a, b = row.get("team_a", "").strip(), row.get("team_b", "").strip()
        if stage != "group" or not a or not b:
            continue
        if frozenset((a, b)) in played_pairs:
            continue
        ea, eb = current_elo.get(a), current_elo.get(b)
        if ea is None or eb is None:
            continue
        probs = match_outcome_probs(ea, eb)
        kst = to_kst(row.get("local_date"), row.get("local_time"), row.get("utc_offset"))
        next_matches.append(
            {
                "match_id": int(row.get("match_id", 0) or 0),
                "date": row.get("local_date", "").strip(),
                "time": row.get("local_time", "").strip(),
                "kst_date": kst.get("kst_date", ""),
                "kst_time": kst.get("kst_time", ""),
                "kst_weekday": kst.get("kst_weekday", ""),
                "group": row.get("group", "").strip(),
                "team_a": a,
                "team_b": b,
                "conf_a": team_by_name[a].confederation if a in team_by_name else "",
                "conf_b": team_by_name[b].confederation if b in team_by_name else "",
                "elo_a": round(ea, 1),
                "elo_b": round(eb, 1),
                "p_win_a": round(probs["win"], 4),
                "p_draw": round(probs["draw"], 4),
                "p_win_b": round(probs["loss"], 4),
                "xg_a": probs["xg_a"],
                "xg_b": probs["xg_b"],
            }
        )
    next_matches.sort(key=lambda r: (r.get("kst_date") or r["date"], r.get("kst_time") or "", r["match_id"]))

    # --- Continental analysis ---
    conf_teams = defaultdict(list)
    for t in teams:
        conf_teams[t.confederation].append(t)

    total_base_elo = sum(base_elo.values())
    conf_analysis = []
    for conf, members in conf_teams.items():
        names = [t.name for t in members]
        n = len(members)
        champ_sum = sum(latest["teams"].get(nm, {}).get("champion", 0.0) for nm in names)
        final_sum = sum(latest["teams"].get(nm, {}).get("reach_final", 0.0) for nm in names)
        r16_sum = sum(latest["teams"].get(nm, {}).get("reach_r16", 0.0) for nm in names)
        r32_sum = sum(latest["teams"].get(nm, {}).get("reach_r32", 0.0) for nm in names)
        base_sum = sum(base_elo[nm] for nm in names)
        elo_change = sum(current_elo[nm] - base_elo[nm] for nm in names)
        conf_analysis.append(
            {
                "confederation": conf,
                "teams": n,
                "alloc_share": round(n / len(teams), 4),
                "avg_base_elo": round(base_sum / n, 1),
                "strength_share": round(base_sum / total_base_elo, 4),
                "champion_share": round(champ_sum, 4),
                "final_share": round(final_sum / 2.0, 4),  # 2 finalists
                "exp_r16": round(r16_sum, 2),  # expected # reaching R16
                "exp_r32": round(r32_sum, 2),  # expected # reaching R32
                "elo_change_total": round(elo_change, 1),
                "elo_change_avg": round(elo_change / n, 2),
            }
        )
    conf_analysis.sort(key=lambda r: r["champion_share"], reverse=True)

    # --- Current group standings (from actual results) ---
    group_standings = {}
    for g in GROUPS:
        rows = {t.name: {
            "team": t.name, "elo": round(current_elo[t.name], 1),
            "played": 0, "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0, "pts": 0,
        } for t in teams if t.group == g}
        group_standings[g] = rows
    for e in played_with_meta:
        m = e["match"]
        g = e["group"] or team_by_name[m.team_a].group
        ra, rb = group_standings[g][m.team_a], group_standings[g][m.team_b]
        ra["played"] += 1; rb["played"] += 1
        ra["gf"] += m.goals_a; ra["ga"] += m.goals_b
        rb["gf"] += m.goals_b; rb["ga"] += m.goals_a
        if m.goals_a > m.goals_b:
            ra["w"] += 1; ra["pts"] += 3; rb["l"] += 1
        elif m.goals_a < m.goals_b:
            rb["w"] += 1; rb["pts"] += 3; ra["l"] += 1
        else:
            ra["d"] += 1; rb["d"] += 1; ra["pts"] += 1; rb["pts"] += 1
    group_standings = {
        g: sorted(
            rows.values(),
            key=lambda r: (-r["pts"], -(r["gf"] - r["ga"]), -r["gf"], -r["elo"]),
        )
        for g, rows in group_standings.items()
    }
    for g, rows in group_standings.items():
        for r in rows:
            r["gd"] = r["gf"] - r["ga"]

    # --- Per-team fixtures (group stage) ---
    played_score = {}
    for e in played_with_meta:
        m = e["match"]
        played_score[frozenset((m.team_a, m.team_b))] = (m.team_a, m.goals_a, m.goals_b)
    team_fixtures = {t.name: [] for t in teams}
    for row in schedule_rows:
        if row.get("stage", "").strip() != "group":
            continue
        a, b = row.get("team_a", "").strip(), row.get("team_b", "").strip()
        if not a or not b:
            continue
        rec = played_score.get(frozenset((a, b)))
        kst = to_kst(row.get("local_date"), row.get("local_time"), row.get("utc_offset"))
        for me, opp in ((a, b), (b, a)):
            fixture = {
                "date": row.get("local_date", "").strip(),
                "time": row.get("local_time", "").strip(),
                "kst_date": kst.get("kst_date", ""),
                "kst_time": kst.get("kst_time", ""),
                "kst_weekday": kst.get("kst_weekday", ""),
                "group": row.get("group", "").strip(),
                "opponent": opp,
                "played": rec is not None,
            }
            if rec is not None:
                home, ga, gb = rec
                gf_me, gf_opp = (ga, gb) if home == me else (gb, ga)
                fixture["gf"] = gf_me
                fixture["ga"] = gf_opp
                fixture["result"] = "W" if gf_me > gf_opp else "L" if gf_me < gf_opp else "D"
            team_fixtures[me].append(fixture)
    for name in team_fixtures:
        team_fixtures[name].sort(key=lambda f: (f.get("kst_date") or f["date"], f.get("kst_time") or f["time"]))

    # --- Knockout tracking: R32 opponents + meetings + bracket (latest state) ---
    print("Running knockout tracking (R32 opponents, meetings, bracket, group positions)...")
    r32_opponents, meetings, bracket, group_positions, third_race = compute_tracking(
        teams, group_schedule, played_with_meta, SIMULATIONS, SEED
    )

    # --- 동기(승점 상황) 보정: 남은 최종전의 데드러버/안전팀 경기 분류 후 별도 시뮬 ---
    coast_set, half_set = set(), set()
    played_pairs_now = {frozenset((e["match"].team_a, e["match"].team_b)) for e in played_with_meta}
    for g, rows in group_standings.items():
        if all(r["played"] >= 3 for r in rows):
            continue  # 이미 끝난 조
        pts = sorted((r["pts"] for r in rows), reverse=True)
        p2, p3 = pts[1], pts[2]
        rankpos = {r["team"]: i for i, r in enumerate(rows)}  # rows는 정렬돼 있음
        def settled(r):
            safe = rankpos[r["team"]] <= 1 and r["pts"] >= p3 + 2   # 무승부면 top2 거의 확보
            dead = r["pts"] + 3 <= p2                                # 이겨도 현재 2위 승점 못 넘음
            return safe or dead
        stt = {r["team"]: settled(r) for r in rows}
        # 이 조의 미진행 경기(최종전 2개) 분류
        for row in schedule_rows:
            if row.get("stage", "").strip() != "group" or row.get("group", "").strip() != g:
                continue
            a, b = row.get("team_a", "").strip(), row.get("team_b", "").strip()
            if not a or not b or frozenset((a, b)) in played_pairs_now:
                continue
            n = int(stt.get(a, False)) + int(stt.get(b, False))
            if n == 2:
                coast_set.add(frozenset((a, b)))
            elif n == 1:
                half_set.add(frozenset((a, b)))
    print(f"Running motivation-adjusted tracking (coast={len(coast_set)}, half={len(half_set)})...")
    _, _, _, group_positions_adj, third_race_adj = compute_tracking(
        teams, group_schedule, played_with_meta, SIMULATIONS, SEED,
        motivation=(coast_set, half_set),
    )

    # --- Per-team page payload ---
    table_by_name = {r["team"]: r for r in team_table}
    team_pages = {}
    for t in teams:
        tr = table_by_name[t.name]
        team_pages[t.name] = {
            "team": t.name,
            "group": t.group,
            "confederation": t.confederation,
            "fifa_rank": t.fifa_rank,
            "base_elo": tr["base_elo"],
            "current_elo": tr["current_elo"],
            "elo_change_actual": tr["elo_change_actual"],
            "titles": t.world_cup_titles,
            "best_result": t.best_world_cup_result,
            "best_years": t.best_world_cup_years,
            "probs": {
                "reach_r32": tr["reach_r32"], "reach_r16": tr["reach_r16"],
                "reach_qf": tr["reach_qf"], "reach_sf": tr["reach_sf"],
                "reach_final": tr["reach_final"], "champion": tr["champion"],
            },
            "group_pos": group_positions[t.name],
            "fixtures": team_fixtures[t.name],
            "r32_opponents": r32_opponents[t.name],
        }

    # --- Per-group page payload (positions + full fixtures with probs) ---
    group_pages = {}
    for g in GROUPS:
        fixtures = []
        for row in schedule_rows:
            if row.get("stage", "").strip() != "group" or row.get("group", "").strip() != g:
                continue
            a, b = row.get("team_a", "").strip(), row.get("team_b", "").strip()
            if not a or not b:
                continue
            rec = played_score.get(frozenset((a, b)))
            kst = to_kst(row.get("local_date"), row.get("local_time"), row.get("utc_offset"))
            fx = {
                "date": row.get("local_date", "").strip(),
                "time": row.get("local_time", "").strip(),
                "kst_date": kst.get("kst_date", ""),
                "kst_time": kst.get("kst_time", ""),
                "kst_weekday": kst.get("kst_weekday", ""),
                "team_a": a, "team_b": b,
                "played": rec is not None,
            }
            if rec is not None:
                home, ga, gb = rec
                fx["goals_a"], fx["goals_b"] = (ga, gb) if home == a else (gb, ga)
            else:
                probs = match_outcome_probs(current_elo[a], current_elo[b])
                fx["p_win_a"] = round(probs["win"], 4)
                fx["p_draw"] = round(probs["draw"], 4)
                fx["p_win_b"] = round(probs["loss"], 4)
                fx["xg_a"], fx["xg_b"] = probs["xg_a"], probs["xg_b"]
            fixtures.append(fx)
        fixtures.sort(key=lambda f: (f.get("kst_date") or f["date"], f.get("kst_time") or f["time"]))
        group_pages[g] = {
            "group": g,
            "positions": {t.name: group_positions[t.name] for t in teams if t.group == g},
            "fixtures": fixtures,
        }

    data = {
        "generated": datetime.now(timezone.utc)
        .astimezone(timezone(timedelta(hours=9)))
        .strftime("%Y-%m-%d %H:%M KST"),
        "simulations": SIMULATIONS,
        "played_count": len(played_with_meta),
        "elo_matches": elo_matches,
        "snapshots": snapshots,
        "team_table": team_table,
        "next_matches": next_matches[:24],
        "conf_analysis": conf_analysis,
        "group_standings": group_standings,
        "team_pages": team_pages,
        "group_pages": group_pages,
        "third_race": third_race,
        "third_race_adj": third_race_adj,
        "meetings": meetings,
        "bracket": bracket,
        "totals": {
            "teams": len(teams),
            "groups": 12,
            "total_matches": sum(1 for r in schedule_rows if r.get("match_id", "").strip().isdigit()),
        },
    }

    OUT.write_text("window.WC_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
