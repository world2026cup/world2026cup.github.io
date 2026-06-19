/* global Chart, WC_DATA */
const D = window.WC_DATA;

// =================== i18n ===================
const LANG = (localStorage.getItem("wc_lang") === "en") ? "en" : "ko";
document.documentElement.lang = LANG;
const T = {
  ko: {
    "title": "2026 월드컵 Elo 시뮬레이션 뷰어", "h1.wc": "월드컵", "h1.sim": "Elo 시뮬레이터",
    "tab.standings": "🏆 순위 & 우승확률", "tab.elo": "📈 일별 Elo 변화", "tab.evolution": "🎢 우승확률 추이",
    "tab.groups": "📊 조별 현황", "tab.next": "🔮 다음 매치업", "tab.matchup": "🥊 매치업 파인더",
    "tab.bracket": "🗺️ 대진표", "tab.continent": "🌍 대륙별 분석",
    "standings.h2": "전체 순위", "standings.hint": "우승 확률 순 · 막대는 라운드별 진출 확률",
    "th.team": "팀", "th.title": "우승", "th.chg": "변화", "th.grp": "조", "th.conf": "연맹",
    "th.prog": "라운드별 진출 확률 (32강→우승)",
    "elo.h2": "경기별 Elo 변화", "elo.hint": "진행된 경기에서 실제로 움직인 Elo",
    "elo.movers": "📊 최대 변동 (경기별)", "elo.log": "🗓️ 경기 로그",
    "evo.h2": "우승 확률 추이", "evo.hint": "개막 전부터 날짜별 시뮬레이션 스냅샷", "evo.tm": "🎢 타임머신",
    "play": "▶ 재생", "pause": "⏸ 정지",
    "metric.champion": "우승", "metric.final": "결승 진출", "metric.r16": "16강",
    "evo.risers": "📈 최근 상승", "evo.risers.hint": "직전 경기 대비 우승확률", "evo.fallers": "📉 최근 하락",
    "mu.h2": "매치업 파인더", "mu.hint": "두 팀이 토너먼트에서 만날 확률",
    "bk.h2": "예상 대진표", "bk.hint": "예상 승자가 다음 라운드로 올라감 · 팀을 누르면 경로 강조",
    "bk.note": "32강 예상 참가팀을 고른 뒤, 각 경기의 <b>승</b> 표시 팀이 다음 라운드로 진출합니다. %는 해당 자리에 오를 확률입니다.",
    "next.h2": "다음 매치업", "next.hint": "현재 Elo 기준 승·무·패 확률 (Poisson 모델)",
    "cont.h2": "대륙(연맹)별 분석", "cont.hint": "팀 배정 vs 실제 성적",
    "cont.share": "배정 점유율 vs 전력 점유율 vs 우승확률 점유율",
    "cont.note": "각 연맹이 가진 <b>참가 팀 비율</b>, 시작 Elo 합으로 본 <b>전력 비율</b>, 시뮬레이션 <b>우승확률 합</b>을 비교합니다. 우승확률이 배정·전력보다 높으면 <b>오버퍼폼</b>. <b>타임머신</b>으로 우승확률 점유율의 시점별 변화를 볼 수 있어요.",
    "cont.eloChg": "연맹별 누적 Elo 변화 (실제 경기)",
    "cont.summary": "요약 표", "cont.summary.hint": "위 타임머신 슬라이더로 시점 변경 · 평균 Elo는 해당 시점 현재값",
    "th.conf2": "연맹", "th.teams": "팀", "th.avgElo": "평균 Elo", "th.titleSum": "우승확률합", "th.expR16": "기대 16강수", "th.dElo": "Elo변화",
    "cont.pts": "조별리그 승점", "cont.pts.hint": "실제 경기 결과 기준", "pts.total": "총 승점", "pts.avg": "평균 승점 (경기당)",
    "axis.title": "우승 확률 (%)", "axis.prob": "확률 (%)", "axis.eloChg": "Elo 변화", "axis.share": "점유율 (%)",
    "axis.eloSum": "Elo 변화 합", "axis.ptsTotal": "총 승점", "axis.ptsAvg": "경기당 평균 승점",
    "win.tip": "우승", "noChange": "변동 없음", "match.hash": "경기", "draw": "무", "expGoals": "예상 득점",
    "addTeam": "➕ 팀 추가", "pickTwo": "서로 다른 두 팀을 선택하세요.",
    "meetLow": "만날 확률 < 0.3% · 사실상 만나기 어렵습니다.", "meetTotal": "토너먼트에서 만날 확률",
    "backStand": "← 전체 순위로", "funnelTitle": "🎯 라운드별 진출 확률",
    "oppTitle": "🥊 32강 예상 상대 Top 5", "oppHint": "32강 진출 시 조건부 확률", "noR32": "32강 진출 시나리오가 없습니다.",
    "posTitle": "순위 확률", "viewGroup": "전체 현황 보기 →", "standingsTitle": "현재 순위",
    "fixturesTitle": "🗓️ 경기 결과 & 향후 일정", "kstNote": "시간은 한국 시간(KST)",
    "scheduled": "예정", "done": "완료", "res.W": "승", "res.L": "패", "res.D": "무",
    "groupNotFound": "조를 찾을 수 없습니다.", "gpStandings": "순위 & 조별 순위 확률", "gpStandingsHint": "셀 = 1·2·3·4위 확률",
    "fullSched": "🗓️ 전체 일정 & 남은 경기", "fullSchedHint": "한국 시간(KST) · 미진행 경기는 승·무·패 확률",
    "beforeKO": "개막 전 · 경기 없음", "noMatch": "경기 없음",
    "share.alloc": "배정 점유율", "share.strength": "전력 점유율(Elo)", "share.titleODDS": "우승확률 점유율",
    "th.rank": "순위", "th.played": "경기", "th.wdl": "승무패", "th.gd": "득실", "th.gddiff": "골득실차", "th.pts": "승점", "th.elo": "Elo",
    "posCol": "순위 확률 (1·2·3·4위)",
    "pos.1": "1위", "pos.2": "2위", "pos.3": "3위", "pos.4": "4위",
    "st.r32": "32강", "st.r16": "16강", "st.qf": "8강", "st.sf": "4강", "st.final": "결승", "st.tp": "3·4위전", "st.win": "우승",
    "best.Champions": "우승", "best.Runners-up": "준우승", "best.Third place": "3위", "best.Fourth place": "4위",
    "best.Quarter-finals": "8강", "best.Round of 16": "16강", "best.Group stage": "조별리그", "best.No previous appearances": "본선 첫 출전",
  },
  en: {
    "title": "2026 World Cup Elo Simulator", "h1.wc": "World Cup", "h1.sim": "Elo Simulator",
    "tab.standings": "🏆 Standings & Title odds", "tab.elo": "📈 Daily Elo change", "tab.evolution": "🎢 Title-odds timeline",
    "tab.groups": "📊 Groups", "tab.next": "🔮 Next matches", "tab.matchup": "🥊 Matchup finder",
    "tab.bracket": "🗺️ Bracket", "tab.continent": "🌍 Confederations",
    "standings.h2": "Full standings", "standings.hint": "by title odds · bars = round-by-round advance odds",
    "th.team": "Team", "th.title": "Title", "th.chg": "Δ", "th.grp": "Grp", "th.conf": "Conf",
    "th.prog": "Round-by-round advance odds (R32→Win)",
    "elo.h2": "Elo change by match", "elo.hint": "actual Elo moved in played matches",
    "elo.movers": "📊 Biggest movers (by match)", "elo.log": "🗓️ Match log",
    "evo.h2": "Title-odds timeline", "evo.hint": "simulation snapshots from before kickoff", "evo.tm": "🎢 Time machine",
    "play": "▶ Play", "pause": "⏸ Pause",
    "metric.champion": "Champion", "metric.final": "Reach final", "metric.r16": "Reach R16",
    "evo.risers": "📈 Biggest risers", "evo.risers.hint": "title odds vs previous match", "evo.fallers": "📉 Biggest fallers",
    "mu.h2": "Matchup finder", "mu.hint": "odds two teams meet in the tournament",
    "bk.h2": "Projected bracket", "bk.hint": "projected winner advances · click a team to highlight its path",
    "bk.note": "Each match's <b>W</b> team advances to the next round. % is the chance of reaching that slot.",
    "next.h2": "Next matches", "next.hint": "win/draw/loss odds from current Elo (Poisson model)",
    "cont.h2": "Confederation analysis", "cont.hint": "team allocation vs actual performance",
    "cont.share": "Allocation vs strength vs title-odds share",
    "cont.note": "Compares each confederation's <b>share of teams</b>, <b>strength share</b> (sum of starting Elo), and <b>sum of title odds</b>. If title odds exceed allocation/strength, it's <b>overperforming</b>. Use the <b>time machine</b> to see title-odds share over time.",
    "cont.eloChg": "Cumulative Elo change by confederation (played)",
    "cont.summary": "Summary table", "cont.summary.hint": "use the time-machine slider above · avg Elo is current at that point",
    "th.conf2": "Conf", "th.teams": "Teams", "th.avgElo": "Avg Elo", "th.titleSum": "Title odds", "th.expR16": "Exp. R16", "th.dElo": "ΔElo",
    "cont.pts": "Group points", "cont.pts.hint": "from actual results", "pts.total": "Total points", "pts.avg": "Avg points (per game)",
    "axis.title": "Title odds (%)", "axis.prob": "Probability (%)", "axis.eloChg": "Elo change", "axis.share": "Share (%)",
    "axis.eloSum": "Cumulative Elo Δ", "axis.ptsTotal": "Total points", "axis.ptsAvg": "Avg points per game",
    "win.tip": "Win", "noChange": "No change", "match.hash": "Match", "draw": "Draw", "expGoals": "Exp. goals",
    "addTeam": "➕ Add team", "pickTwo": "Pick two different teams.",
    "meetLow": "Meet odds < 0.3% · effectively won't meet.", "meetTotal": "Odds of meeting in the tournament",
    "backStand": "← Back to standings", "funnelTitle": "🎯 Round-by-round advance odds",
    "oppTitle": "🥊 Likely R32 opponents (Top 5)", "oppHint": "conditional on reaching R32", "noR32": "No R32 scenarios.",
    "posTitle": "finish odds", "viewGroup": "View full group →", "standingsTitle": "standings",
    "fixturesTitle": "🗓️ Results & schedule", "kstNote": "times in KST",
    "scheduled": "Upcoming", "done": "Done", "res.W": "W", "res.L": "L", "res.D": "D",
    "groupNotFound": "Group not found.", "gpStandings": "Standings & finish odds", "gpStandingsHint": "cells = 1st·2nd·3rd·4th odds",
    "fullSched": "🗓️ Full schedule", "fullSchedHint": "KST · upcoming matches show W/D/L odds",
    "beforeKO": "Before kickoff · no matches", "noMatch": "no matches",
    "share.alloc": "Allocation", "share.strength": "Strength (Elo)", "share.titleODDS": "Title odds",
    "th.rank": "#", "th.played": "P", "th.wdl": "W-D-L", "th.gd": "GF:GA", "th.gddiff": "GD", "th.pts": "Pts", "th.elo": "Elo",
    "posCol": "Finish odds (1·2·3·4)",
    "pos.1": "1st", "pos.2": "2nd", "pos.3": "3rd", "pos.4": "4th",
    "st.r32": "R32", "st.r16": "R16", "st.qf": "QF", "st.sf": "SF", "st.final": "Final", "st.tp": "3rd-place", "st.win": "Win",
    "best.Champions": "Champions", "best.Runners-up": "Runners-up", "best.Third place": "Third place", "best.Fourth place": "Fourth place",
    "best.Quarter-finals": "Quarter-finals", "best.Round of 16": "Round of 16", "best.Group stage": "Group stage", "best.No previous appearances": "No previous appearances",
  },
};
const t = (k) => (T[LANG][k] !== undefined ? T[LANG][k] : (T.ko[k] !== undefined ? T.ko[k] : k));
const WD_EN = { "월": "Mon", "화": "Tue", "수": "Wed", "목": "Thu", "금": "Fri", "토": "Sat", "일": "Sun" };
const weekdayL = (wd) => (LANG === "en" ? (WD_EN[wd] || wd) : wd);
const groupName = (g) => (LANG === "en" ? `Group ${g}` : `${g}조`);

const CONF_COLOR = {
  UEFA: "#4f8cff", CONMEBOL: "#ffd166", CAF: "#3ddc97",
  AFC: "#ef6f6c", CONCACAF: "#b388ff", OFC: "#ff9f6e",
};
const confColor = (c) => CONF_COLOR[c] || "#8a93a3";
const CONF_KO = { UEFA: "유럽", CONMEBOL: "남미", CONCACAF: "북중미", CAF: "아프리카", AFC: "아시아", OFC: "오세아니아" };
const CONF_EN = { UEFA: "Europe", CONMEBOL: "South America", CONCACAF: "North America", CAF: "Africa", AFC: "Asia", OFC: "Oceania" };
const confLabel = (code) => `${(LANG === "en" ? CONF_EN : CONF_KO)[code] || code}(${code})`;
const bestResult = (s) => t("best." + s) || s;
const pct = (x) => (x * 100).toFixed(1) + "%";
const pct0 = (x) => Math.round(x * 100) + "%";

// 팀명 → 한국어/영어/국기 헬퍼
const TI = window.TEAM_INFO || {};
const teamKo = (name) => (TI[name] ? TI[name].ko : name);
const teamName = (name) => (LANG === "en" ? name : teamKo(name)); // 표시용 팀명 (언어별)
// 국기: 윈도우에서 이모지가 안 보이므로 flagcdn 이미지로 렌더 (HTML 컨텍스트 전용).
const flagImg = (name) => {
  const iso = TI[name] && TI[name].iso;
  return iso ? `<img class="flag-img" src="https://flagcdn.com/h40/${iso}.png" alt="" loading="lazy">` : "";
};
const teamFlag = flagImg; // HTML에서 ${teamFlag(name)} 호출부가 모두 이미지로 동작
const teamFlagEmoji = (name) => (TI[name] ? TI[name].flag : ""); // textContent 등 비-HTML 컨텍스트용
const teamLabel = (name) => `${teamFlag(name)} ${teamName(name)}`.trim(); // HTML 전용 (img + 한글)
// 국가 대표색 (그래프·막대용). 없으면 연맹색 폴백.
const teamColor = (name) => (TI[name] && TI[name].c) || confColor((D.team_pages[name] || {}).confederation);
const teamColor2 = (name) => (TI[name] && TI[name].c2) || teamColor(name);
const DRAW_COLOR = "#7a8290"; // 무승부용 중립색 (초록/빨강 대신)
const DRAW_GRAD = "linear-gradient(90deg, #5b6675, #8a93a3)";

// 한국 시간(KST) 표기 헬퍼. 데이터가 kst_* 필드를 주면 사용, 없으면 원본 폴백.
function kstDateTime(o) {
  if (o && o.kst_date) {
    const wd = o.kst_weekday ? `(${o.kst_weekday})` : "";
    return `${o.kst_date} ${wd} ${o.kst_time || ""}`.replace(/\s+/g, " ").trim();
  }
  return `${(o && o.date) || ""} ${(o && o.time) || ""}`.trim();
}
function kstDateOnly(o) {
  if (o && o.kst_date) return `${o.kst_date}${o.kst_weekday ? " (" + o.kst_weekday + ")" : ""}`;
  return (o && o.date) || "";
}

Chart.defaults.color = "#93a1b3";
Chart.defaults.font.family = "-apple-system, 'Segoe UI', sans-serif";
Chart.defaults.borderColor = "#2b333f";
// 데이터라벨 플러그인: 전역 등록하되 기본은 끔(차트별로 켬)
if (window.ChartDataLabels) {
  Chart.register(window.ChartDataLabels);
  Chart.defaults.plugins = Chart.defaults.plugins || {};
  Chart.defaults.plugins.datalabels = { display: false }; // 기본 끔, 차트별로 켬
}

// 색 음영 (p>0 밝게, p<0 어둡게)
function shade(hex, p) {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const n = parseInt(full, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = p < 0 ? 0 : 255, a = Math.abs(p);
  r = Math.round((t - r) * a) + r;
  g = Math.round((t - g) * a) + g;
  b = Math.round((t - b) * a) + b;
  return `rgb(${r},${g},${b})`;
}
// 캔버스 그라데이션 (차트용). 차트영역 준비 전이면 단색 폴백.
function chartGrad(context, c1, c2, horizontal) {
  const chart = context.chart, area = chart.chartArea;
  if (!area) return c1;
  const g = horizontal
    ? chart.ctx.createLinearGradient(area.left, 0, area.right, 0)
    : chart.ctx.createLinearGradient(0, area.bottom, 0, area.top);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}
// CSS 그라데이션 (HTML 막대용) / 그라데이션 텍스트
const teamGradCss = (name) => `linear-gradient(90deg, ${teamColor2(name)}, ${teamColor(name)})`;
const gradText = (grad, text) =>
  `<span class="gradtxt" style="background-image:${grad}">${text}</span>`;

// ---- header / footer ----
document.getElementById("subline").textContent = LANG === "en"
  ? `${D.totals.teams} teams · ${D.totals.groups} groups · ${D.played_count} matches played · ${D.simulations.toLocaleString()} sims (generated ${D.generated})`
  : `${D.totals.teams}개국 · ${D.totals.groups}개조 · ${D.played_count}경기 완료 · 시뮬레이션 ${D.simulations.toLocaleString()}회 (데이터 생성 ${D.generated})`;
document.getElementById("footinfo").textContent = LANG === "en"
  ? `${D.snapshots.length} snapshots · ${D.next_matches.length} upcoming matches`
  : `스냅샷 ${D.snapshots.length}개 · 다음 경기 ${D.next_matches.length}개`;

// ---- tabs ----
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const rendered = {};
tabs.forEach((t) => t.addEventListener("click", () => {
  tabs.forEach((x) => x.classList.remove("active"));
  panels.forEach((x) => x.classList.remove("active"));
  const id = t.dataset.tab;
  if (id === "groups") { location.hash = "#group/A"; return; }
  t.classList.add("active");
  document.getElementById(id).classList.add("active");
  if (!rendered[id]) { (RENDER[id] || (() => {}))(); rendered[id] = true; }
}));

// =================== STANDINGS ===================
function rankMap(snapTeams, metric = "champion") {
  const names = Object.keys(snapTeams)
    .sort((a, b) => (snapTeams[b][metric] || 0) - (snapTeams[a][metric] || 0));
  const m = {};
  names.forEach((n, i) => { m[n] = i + 1; });
  return m;
}

function rankArrow(prev, cur) {
  if (prev == null) return "";
  const d = prev - cur; // positive = moved up
  if (d > 0) return `<span class="arr up">▲${d}</span>`;
  if (d < 0) return `<span class="arr down">▼${-d}</span>`;
  return `<span class="arr flat">–</span>`;
}

function renderStandings() {
  const t = D.team_table;
  const snaps = D.snapshots;
  const curRank = rankMap(snaps[snaps.length - 1].teams);
  const prevRank = snaps.length > 1 ? rankMap(snaps[snaps.length - 2].teams) : null;
  // podium
  const medals = ["🥇", "🥈", "🥉"];
  const order = [1, 0, 2]; // visual: 2nd, 1st, 3rd
  document.getElementById("podium").innerHTML = order.map((i) => {
    const r = t[i];
    return `<div class="pod ${i === 0 ? "p1" : ""}">
      <div class="medal">${medals[i]}</div>
      <div class="pflag">${teamFlag(r.team)}</div>
      <div class="pname">${teamName(r.team)}</div>
      <div class="pwin">${pct(r.champion)}</div>
      <div class="pmeta">${confLabel(r.confederation)} · Elo ${r.current_elo}</div>
    </div>`;
  }).join("");

  const tbody = document.querySelector("#standings-table tbody");
  tbody.innerHTML = t.map((r, i) => {
    const chg = r.elo_change_actual;
    const chgCls = chg > 0 ? "chg-pos" : chg < 0 ? "chg-neg" : "chg-zero";
    const chgTxt = (chg > 0 ? "+" : "") + chg.toFixed(1);
    return `<tr>
      <td class="rank">${i + 1} ${prevRank ? rankArrow(prevRank[r.team], curRank[r.team]) : ""}</td>
      <td><a class="team-link" href="#team/${encodeURIComponent(r.team)}"><span class="flag">${teamFlag(r.team)}</span> <b>${teamName(r.team)}</b></a></td>
      <td class="num pct">${gradText(teamGradCss(r.team), pct(r.champion))}</td>
      <td class="num">${r.current_elo}</td>
      <td class="num ${chgCls}">${chgTxt}</td>
      <td>${r.group}</td>
      <td><span style="color:${confColor(r.confederation)}">●</span> ${confLabel(r.confederation)}</td>
      <td>${progressionBar(r)}</td>
    </tr>`;
  }).join("");
}

const PROG_STAGES = [
  ["reach_r32", "st.r32", "#3a4a63"],
  ["reach_r16", "st.r16", "#3f7bd6"],
  ["reach_qf", "st.qf", "#2bb0b5"],
  ["reach_sf", "st.sf", "#3ddc97"],
  ["reach_final", "st.final", "#f5a623"],
  ["champion", "st.win", "#ffd166"],
];
function progressionBar(r) {
  // 라운드별 진출 확률 (왼→오: 32강→우승). 셀이 확률만큼 차오르고 정수 %를 표기.
  const cols = PROG_STAGES.map(([k, lblKey, c]) => {
    const lbl = t(lblKey);
    const p = Math.round(r[k] * 100);
    const h = Math.max(4, r[k] * 100);
    return `<span class="pcol" title="${lbl} ${p}%"><i class="fill" style="height:${h}%;background:${c}"></i><span class="lbl">${lbl}</span><span class="val">${p}%</span></span>`;
  }).join("");
  const tip = PROG_STAGES.map(([k, lblKey]) => `${t(lblKey)} ${pct0(r[k])}`).join(" · ");
  return `<div class="pgrid" title="${tip}">${cols}</div>`;
}

// =================== ELO ===================
let eloChart;
function renderElo() {
  const m = D.elo_matches;
  // biggest movers: take max |delta| side of each match, sort
  const movers = m.map((x) => {
    const aBig = Math.abs(x.delta_a) >= Math.abs(x.delta_b);
    return aBig
      ? { team: x.team_a, delta: x.delta_a, label: `${teamName(x.team_a)} ${x.goals_a}-${x.goals_b} ${teamName(x.team_b)}` }
      : { team: x.team_b, delta: x.delta_b, label: `${teamName(x.team_b)} ${x.goals_b}-${x.goals_a} ${teamName(x.team_a)}` };
  }).sort((a, b) => b.delta - a.delta);

  eloChart = new Chart(document.getElementById("eloMoversChart"), {
    type: "bar",
    data: {
      labels: movers.map((x) => teamName(x.team)),
      datasets: [{
        data: movers.map((x) => x.delta),
        borderRadius: 4,
        backgroundColor: (ctx) => {
          const base = ctx.raw >= 0 ? "#3ddc97" : "#ef6f6c";
          return chartGrad(ctx, shade(base, 0.28), base, true);
        },
      }],
    },
    options: {
      indexAxis: "y", maintainAspectRatio: false,
      layout: { padding: { left: 26, right: 26 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          title: (it) => movers[it[0].dataIndex].label,
          label: (it) => `Elo ${it.raw >= 0 ? "+" : ""}${it.raw}`,
        } },
        datalabels: {
          display: true, anchor: "end", align: "end", clamp: true,
          color: "#cdd6e2", font: { weight: 700, size: 11 },
          formatter: (v) => (v >= 0 ? "+" : "") + v,
        },
      },
      scales: { x: { title: { display: true, text: t("axis.eloChg") } } },
    },
  });

  // log grouped by day (KST)
  const byDay = {};
  m.forEach((x) => { (byDay[x.kst_date || x.date] ||= []).push(x); });
  const log = Object.keys(byDay).sort().map((day) => {
    const rows = byDay[day].map((x) => {
      const da = (x.delta_a >= 0 ? "+" : "") + x.delta_a;
      const db = (x.delta_b >= 0 ? "+" : "") + x.delta_b;
      const ca = x.delta_a >= 0 ? "chg-pos" : "chg-neg";
      const cb = x.delta_b >= 0 ? "chg-pos" : "chg-neg";
      return `<div class="elo-row">
        <span class="teams">${teamLabel(x.team_a)} <span class="score">${x.goals_a}–${x.goals_b}</span> ${teamLabel(x.team_b)}
          <span class="hint">(${groupName(x.group)})</span></span>
        <span class="delta"><span class="${ca}">${da}</span> / <span class="${cb}">${db}</span></span>
      </div>`;
    }).join("");
    return `<div class="elo-day">${day} (KST)</div>${rows}`;
  }).join("");
  document.getElementById("eloLog").innerHTML = log;
}

// =================== EVOLUTION ===================
let evoChart;
let evoMetric = "champion";
let evoTeams = null; // 라인차트에 표시할 팀 목록 (기본 Top 8)
function renderEvolution() {
  if (!evoTeams) {
    const last = D.snapshots[D.snapshots.length - 1].teams;
    evoTeams = Object.keys(last).sort((a, b) => last[b].champion - last[a].champion).slice(0, 8);
  }
  renderEvoPicker();
  buildEvoChart();
  renderMovers();
  setupSlider();
  document.querySelectorAll("#metricSeg button").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("#metricSeg button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      evoMetric = b.dataset.metric;
      buildEvoChart();
    }));
}

function renderEvoPicker() {
  const el = document.getElementById("evoTeamPicker");
  const chips = evoTeams.map((t) =>
    `<span class="tchip"><i class="tdot" style="background:${teamColor(t)}"></i>${teamFlag(t)} ${teamName(t)} <button class="tx" data-rm="${t}" title="${LANG === 'en' ? 'Remove' : '제거'}">✕</button></span>`
  ).join("");
  const remaining = D.team_table.map((r) => r.team)
    .filter((t) => !evoTeams.includes(t))
    .sort((a, b) => teamName(a).localeCompare(teamName(b), "ko"));
  const opts = remaining.map((t) => `<option value="${t}">${teamName(t)}</option>`).join("");
  el.innerHTML = chips +
    `<select class="team-add" id="evoAdd"><option value="">${t("addTeam")}</option>${opts}</select>`;
  el.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => {
    evoTeams = evoTeams.filter((x) => x !== b.dataset.rm);
    renderEvoPicker(); buildEvoChart();
  });
  const add = document.getElementById("evoAdd");
  if (add) add.onchange = (e) => {
    if (e.target.value && !evoTeams.includes(e.target.value)) {
      evoTeams.push(e.target.value);
      renderEvoPicker(); buildEvoChart();
    }
  };
}

function renderMovers() {
  const snaps = D.snapshots;
  if (snaps.length < 2) return;
  const cur = snaps[snaps.length - 1].teams;
  const prev = snaps[snaps.length - 2].teams;
  const deltas = Object.keys(cur).map((n) => ({
    team: n, delta: (cur[n].champion - prev[n].champion), now: cur[n].champion,
  })).filter((x) => Math.abs(x.delta) > 0.0005);
  const risers = [...deltas].sort((a, b) => b.delta - a.delta).slice(0, 6);
  const fallers = [...deltas].sort((a, b) => a.delta - b.delta).slice(0, 6);
  const row = (x) => {
    const sign = x.delta >= 0 ? "+" : "";
    const cls = x.delta >= 0 ? "chg-pos" : "chg-neg";
    return `<div class="mover-row">
      <span class="mv-team">${teamLink(x.team, `<span class="flag">${teamFlag(x.team)}</span> ${teamName(x.team)}`)}</span>
      <span class="mv-now">${pct(x.now)}</span>
      <span class="mv-delta ${cls}">${sign}${(x.delta * 100).toFixed(1)}p</span>
    </div>`;
  };
  document.getElementById("riserList").innerHTML = risers.map(row).join("") || `<p class='note'>${t("noChange")}</p>`;
  document.getElementById("fallerList").innerHTML = fallers.map(row).join("") || `<p class='note'>${t("noChange")}</p>`;
}

let snapBarChart, playTimer = null, snapBarTeams = [];
function setupSlider() {
  const slider = document.getElementById("snapSlider");
  const last = D.snapshots.length - 1;
  slider.max = last;
  slider.value = last;
  drawSnapBar(last);
  slider.oninput = () => { stopPlay(); drawSnapBar(+slider.value); };
  document.getElementById("playBtn").onclick = togglePlay;
}
function snapTitle(snap) {
  if (!snap.last_match) return t("beforeKO");
  const lm = snap.last_match;
  return `${snap.label} · ${kstDateOnly(lm)} · ${teamFlagEmoji(lm.team_a)} ${teamName(lm.team_a)} ${lm.goals_a}-${lm.goals_b} ${teamName(lm.team_b)} ${teamFlagEmoji(lm.team_b)}`;
}

function drawSnapBar(idx) {
  const snap = D.snapshots[idx];
  document.getElementById("sliderLabel").textContent = snapTitle(snap);
  const teams = snap.teams;
  const top = Object.keys(teams).sort((a, b) => teams[b].champion - teams[a].champion).slice(0, 10);
  const labels = top.map(teamName);
  const data = top.map((n) => +(teams[n].champion * 100).toFixed(2));
  snapBarTeams = top;
  if (!snapBarChart) {
    snapBarChart = new Chart(document.getElementById("snapBarChart"), {
      type: "bar",
      data: { labels, datasets: [{
        data, borderRadius: 4,
        backgroundColor: (ctx) => {
          const t = snapBarTeams[ctx.dataIndex];
          return t ? chartGrad(ctx, teamColor2(t), teamColor(t), true) : "#888";
        },
      }] },
      options: {
        indexAxis: "y", maintainAspectRatio: false,
        animation: { duration: 350 },
        layout: { padding: { right: 40 } },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (it) => `${t("win.tip")} ${it.raw}%` } },
          datalabels: {
            display: true, anchor: "end", align: "end", clamp: true,
            color: "#e7ecf3", font: { weight: 700, size: 11 },
            formatter: (v) => v + "%",
          },
        },
        scales: { x: { title: { display: true, text: t("axis.title") }, beginAtZero: true } },
      },
    });
  } else {
    snapBarChart.data.labels = labels;
    snapBarChart.data.datasets[0].data = data;
    snapBarChart.update();
  }
}
function togglePlay() {
  if (playTimer) { stopPlay(); return; }
  const slider = document.getElementById("snapSlider");
  document.getElementById("playBtn").textContent = t("pause");
  if (+slider.value >= +slider.max) slider.value = 0;
  drawSnapBar(+slider.value);
  playTimer = setInterval(() => {
    if (+slider.value >= +slider.max) { stopPlay(); return; }
    slider.value = +slider.value + 1;
    drawSnapBar(+slider.value);
  }, 750);
}
function stopPlay() {
  if (playTimer) { clearInterval(playTimer); playTimer = null; }
  document.getElementById("playBtn").textContent = t("play");
}
function buildEvoChart() {
  // 사용자가 선택한 팀들 (기본 Top 8)
  const top = evoTeams || [];
  const labels = D.snapshots.map((s) => s.label);
  const datasets = top.map((team) => ({
    label: teamName(team),
    team,
    data: D.snapshots.map((s) => +( (s.teams[team]?.[evoMetric] || 0) * 100).toFixed(2)),
    borderColor: (ctx) => chartGrad(ctx, teamColor2(team), teamColor(team), true),
    backgroundColor: (ctx) => chartGrad(ctx, teamColor2(team), teamColor(team), true),
    tension: 0.3, pointRadius: 3, borderWidth: 2.5,
  }));
  if (evoChart) evoChart.destroy();
  evoChart = new Chart(document.getElementById("evoChart"), {
    type: "line",
    data: { labels, datasets },
    options: {
      maintainAspectRatio: false,
      layout: { padding: { right: 52 } },
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: { callbacks: { label: (it) => `${it.dataset.label}: ${it.raw}%` } },
        datalabels: {
          display: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1,
          anchor: "end", align: "right", offset: 4, clamp: true,
          color: (ctx) => teamColor(ctx.dataset.team),
          font: { weight: 700, size: 11 },
          formatter: (v) => v + "%",
        },
      },
      scales: { y: { title: { display: true, text: t("axis.prob") }, beginAtZero: true } },
    },
  });
}

// =================== NEXT MATCHUPS ===================
function renderNext() {
  const el = document.getElementById("nextCards");
  el.innerHTML = D.next_matches.map((m) => {
    const w = (m.p_win_a * 100), d = (m.p_draw * 100), l = (m.p_win_b * 100);
    return `<div class="mcard">
      <div class="mhead"><span>${groupName(m.group)} · ${kstDateTime(m)} <span class="kst-tag">KST</span></span><span>${t("match.hash")} #${m.match_id}</span></div>
      <div class="teams-row">
        <div><div class="tname">${teamFlag(m.team_a)} ${teamName(m.team_a)}</div><div class="telo">${confLabel(m.conf_a)} · Elo ${m.elo_a}</div></div>
        <div style="color:var(--muted)">vs</div>
        <div style="text-align:right"><div class="tname">${teamName(m.team_b)} ${teamFlag(m.team_b)}</div><div class="telo">${confLabel(m.conf_b)} · Elo ${m.elo_b}</div></div>
      </div>
      <div class="wdl">
        <span style="width:${w}%;background:${teamGradCss(m.team_a)}"></span>
        <span style="width:${d}%;background:${DRAW_GRAD}"></span>
        <span style="width:${l}%;background:${teamGradCss(m.team_b)}"></span>
      </div>
      <div class="wdl-legend">
        <span style="color:${teamColor(m.team_a)}">${teamName(m.team_a)} ${w.toFixed(0)}%</span>
        <span>${t("draw")} ${d.toFixed(0)}%</span>
        <span style="color:${teamColor(m.team_b)}">${teamName(m.team_b)} ${l.toFixed(0)}%</span>
      </div>
      <div class="xg">${t("expGoals")} ${m.xg_a} – ${m.xg_b}</div>
    </div>`;
  }).join("");
}

// =================== CONTINENT ===================
let confShareChart, confPlayTimer = null;
function renderContinent() {
  const c = D.conf_analysis;
  const codes = c.map((x) => x.confederation);  // 집계용 원본 코드 (UEFA 등)
  const labels = codes.map(confLabel);          // 표시용 라벨 (유럽(UEFA) 등)
  // share comparison
  confShareChart = new Chart(document.getElementById("confShareChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: t("share.alloc"), data: c.map((x) => +(x.alloc_share * 100).toFixed(1)), backgroundColor: (ctx) => chartGrad(ctx, shade("#5b6b82", 0.3), "#5b6b82", false) },
        { label: t("share.strength"), data: c.map((x) => +(x.strength_share * 100).toFixed(1)), backgroundColor: (ctx) => chartGrad(ctx, shade("#4f8cff", 0.3), "#4f8cff", false) },
        { label: t("share.titleODDS"), data: c.map((x) => +(x.champion_share * 100).toFixed(1)), backgroundColor: (ctx) => chartGrad(ctx, shade("#3ddc97", 0.3), "#3ddc97", false) },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        tooltip: { callbacks: { label: (it) => `${it.dataset.label}: ${it.raw}%` } },
        datalabels: {
          display: true, anchor: "end", align: "end", color: "#e7ecf3", font: { weight: 700, size: 9 },
          formatter: (v) => v + "%",
        },
      },
      scales: { y: { title: { display: true, text: t("axis.share") }, beginAtZero: true } },
    },
  });

  new Chart(document.getElementById("confEloChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: t("axis.eloSum"),
        data: c.map((x) => x.elo_change_total),
        borderRadius: 4,
        backgroundColor: (ctx) => {
          const base = ctx.raw >= 0 ? "#3ddc97" : "#ef6f6c";
          return chartGrad(ctx, shade(base, 0.3), base, false);
        },
      }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true, anchor: "end", align: "end", clamp: true,
          color: "#cdd6e2", font: { weight: 700, size: 10 },
          formatter: (v) => (v > 0 ? "+" : "") + v,
        },
      },
      scales: { y: { title: { display: true, text: t("axis.eloSum") } } },
    },
  });

  setupContinentSlider(codes);
  setupConfPts(codes, labels);
}

// 연맹별 조별리그 승점 (총/평균) 차트
let confPtsChart, ptsMode = "total";
function confPointsData(codes, mode) {
  initContinentMaps();
  const total = {}, games = {};
  codes.forEach((cf) => { total[cf] = 0; games[cf] = 0; });
  for (const g in D.group_standings) {
    D.group_standings[g].forEach((r) => {
      const cf = TEAM_CONF[r.team];
      if (cf in total) { total[cf] += r.pts; games[cf] += r.played; }
    });
  }
  return codes.map((cf) => mode === "avg"
    ? +(games[cf] ? total[cf] / games[cf] : 0).toFixed(2)  // 경기당 평균 = 총승점 / 총경기수
    : total[cf]);
}
function drawConfPts(codes, labels) {
  const data = confPointsData(codes, ptsMode);
  const yTitle = ptsMode === "avg" ? t("axis.ptsAvg") : t("axis.ptsTotal");
  if (!confPtsChart) {
    confPtsChart = new Chart(document.getElementById("confPtsChart"), {
      type: "bar",
      data: { labels, datasets: [{
        data, borderRadius: 4,
        backgroundColor: (ctx) => chartGrad(ctx, shade(confColor(codes[ctx.dataIndex]), 0.3), confColor(codes[ctx.dataIndex]), false),
      }] },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: { display: true, anchor: "end", align: "end", color: "#e7ecf3", font: { weight: 700, size: 11 }, formatter: (v) => v },
        },
        scales: { y: { title: { display: true, text: yTitle }, beginAtZero: true } },
      },
    });
  } else {
    confPtsChart.data.datasets[0].data = data;
    confPtsChart.options.scales.y.title.text = yTitle;
    confPtsChart.update();
  }
}
function setupConfPts(codes, labels) {
  drawConfPts(codes, labels);
  document.querySelectorAll("#ptsSeg button").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("#ptsSeg button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      ptsMode = b.dataset.mode;
      drawConfPts(codes, labels);
    }));
}

// 연맹별 점유율의 시점별(스냅샷) 추이 — 타임머신 (전력 점유율 + 우승확률 점유율)
const TEAM_CONF = {}; // team -> confederation
let BASE_ELO = null;  // team -> 개막 전 Elo
function initContinentMaps() {
  if (BASE_ELO) return;
  BASE_ELO = {};
  D.team_table.forEach((r) => { TEAM_CONF[r.team] = r.confederation; BASE_ELO[r.team] = r.base_elo; });
}
// 스냅샷 idx 시점(=played_count 경기 반영)의 각 팀 현재 Elo를 elo_matches로 재구성
function currentEloAt(nGames) {
  const elo = Object.assign({}, BASE_ELO);
  for (let i = 0; i < nGames && i < D.elo_matches.length; i++) {
    const e = D.elo_matches[i];
    elo[e.team_a] = e.elo_a_after;
    elo[e.team_b] = e.elo_b_after;
  }
  return elo;
}
function continentChampShares(idx, confLabels) {
  initContinentMaps();
  const teams = D.snapshots[idx].teams;
  const sums = {};
  for (const n in teams) { const cf = TEAM_CONF[n]; sums[cf] = (sums[cf] || 0) + (teams[n].champion || 0); }
  return confLabels.map((cf) => +((sums[cf] || 0) * 100).toFixed(1));
}
function continentStrengthShares(idx, confLabels) {
  initContinentMaps();
  const elo = currentEloAt(D.snapshots[idx].played_count);
  const sums = {}; let total = 0;
  for (const n in elo) { const cf = TEAM_CONF[n]; sums[cf] = (sums[cf] || 0) + elo[n]; total += elo[n]; }
  return confLabels.map((cf) => +(((sums[cf] || 0) / total) * 100).toFixed(1));
}
function drawContinentSnap(idx, confLabels) {
  document.getElementById("confSliderLabel").textContent = snapTitle(D.snapshots[idx]);
  confShareChart.data.datasets[1].data = continentStrengthShares(idx, confLabels); // 전력 점유율(Elo)
  confShareChart.data.datasets[2].data = continentChampShares(idx, confLabels);    // 우승확률 점유율
  confShareChart.update();
  drawConfTable(idx, confLabels);
}
// 요약 표를 스냅샷 idx 시점 값으로 갱신 (팀 수 고정, 나머지는 시점별)
function drawConfTable(idx, codes) {
  initContinentMaps();
  const snap = D.snapshots[idx];
  const elo = currentEloAt(snap.played_count);
  const agg = {};
  codes.forEach((cf) => { agg[cf] = { teams: 0, eloSum: 0, baseSum: 0, champ: 0, r16: 0 }; });
  for (const t in BASE_ELO) {
    const cf = TEAM_CONF[t]; if (!agg[cf]) continue;
    agg[cf].teams++; agg[cf].eloSum += elo[t]; agg[cf].baseSum += BASE_ELO[t];
  }
  for (const t in snap.teams) {
    const cf = TEAM_CONF[t]; if (!agg[cf]) continue;
    agg[cf].champ += snap.teams[t].champion || 0;
    agg[cf].r16 += snap.teams[t].reach_r16 || 0;
  }
  document.querySelector("#confTable tbody").innerHTML = codes.map((cf) => {
    const a = agg[cf];
    const avgElo = Math.round(a.eloSum / a.teams);
    const chg = Math.round(a.eloSum - a.baseSum);
    const cls = chg > 0 ? "chg-pos" : chg < 0 ? "chg-neg" : "chg-zero";
    return `<tr>
      <td class="cell-team"><span style="color:${confColor(cf)}">●</span> <b>${confLabel(cf)}</b></td>
      <td class="num" data-label="${t('th.teams')}">${a.teams}</td>
      <td class="num" data-label="${t('th.avgElo')}">${avgElo}</td>
      <td class="num" data-label="${t('th.titleSum')}">${pct(a.champ)}</td>
      <td class="num" data-label="${t('th.expR16')}">${a.r16.toFixed(2)}</td>
      <td class="num ${cls}" data-label="${t('th.dElo')}">${(chg > 0 ? "+" : "") + chg}</td>
    </tr>`;
  }).join("");
}
function setupContinentSlider(confLabels) {
  const slider = document.getElementById("confSlider");
  const last = D.snapshots.length - 1;
  slider.max = last;
  slider.value = last;
  drawContinentSnap(last, confLabels);
  slider.oninput = () => { stopConfPlay(); drawContinentSnap(+slider.value, confLabels); };
  document.getElementById("confPlayBtn").onclick = () => toggleConfPlay(confLabels);
}
function toggleConfPlay(confLabels) {
  if (confPlayTimer) { stopConfPlay(); return; }
  const slider = document.getElementById("confSlider");
  document.getElementById("confPlayBtn").textContent = t("pause");
  if (+slider.value >= +slider.max) slider.value = 0;
  drawContinentSnap(+slider.value, confLabels);
  confPlayTimer = setInterval(() => {
    if (+slider.value >= +slider.max) { stopConfPlay(); return; }
    slider.value = +slider.value + 1;
    drawContinentSnap(+slider.value, confLabels);
  }, 750);
}
function stopConfPlay() {
  if (confPlayTimer) { clearInterval(confPlayTimer); confPlayTimer = null; }
  document.getElementById("confPlayBtn").textContent = t("play");
}

// =================== MATCHUP FINDER ===================
const STAGE_KEY = {
  round_of_32: "st.r32", round_of_16: "st.r16", quarterfinal: "st.qf",
  semifinal: "st.sf", final: "st.final", third_place: "st.tp",
};
const STAGE_ORDER = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final", "third_place"];

function renderMatchup() {
  const names = D.team_table.map((r) => r.team).sort((a, b) => teamName(a).localeCompare(teamName(b), "ko"));
  const opts = names.map((n) => `<option value="${n}">${teamName(n)}</option>`).join("");
  const selA = document.getElementById("teamA");
  const selB = document.getElementById("teamB");
  selA.innerHTML = opts;
  selB.innerHTML = opts;
  selA.value = "Spain";
  selB.value = "Argentina";
  const update = () => drawMatchup(selA.value, selB.value);
  selA.onchange = update;
  selB.onchange = update;
  update();
}

function drawMatchup(a, b) {
  const box = document.getElementById("matchupResult");
  if (a === b) { box.innerHTML = `<p class="note">${t("pickTwo")}</p>`; return; }
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  const rec = D.meetings[key];
  const head = `<div class="mu-head">
    <span class="mu-side">${teamLink(a, `<span class="flag">${teamFlag(a)}</span> <b>${teamName(a)}</b>`)}</span>
    <span class="vs-big">VS</span>
    <span class="mu-side">${teamLink(b, `<span class="flag">${teamFlag(b)}</span> <b>${teamName(b)}</b>`)}</span>
  </div>`;
  if (!rec) {
    box.innerHTML = head + `<p class="mu-total">${t("meetLow")}</p>`;
    return;
  }
  const maxStage = Math.max(...Object.values(rec.stages));
  const rows = STAGE_ORDER.filter((s) => rec.stages[s]).map((s) => {
    const p = rec.stages[s];
    return `<div class="mu-row">
      <span class="mu-stage">${t(STAGE_KEY[s])}</span>
      <div class="mu-bar"><span style="width:${(p / maxStage * 100).toFixed(1)}%"></span></div>
      <span class="mu-pct">${pct(p)}</span>
    </div>`;
  }).join("");
  box.innerHTML = head +
    `<p class="mu-total">${t("meetTotal")} <b>${pct(rec.total)}</b></p>` +
    `<div class="mu-stages">${rows}</div>`;
}

// =================== BRACKET ===================
const BRACKET_COLS = [
  { stage: "st.r32", ids: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] },
  { stage: "st.r16", ids: [89, 90, 93, 94, 91, 92, 95, 96] },
  { stage: "st.qf", ids: [97, 98, 99, 100] },
  { stage: "st.sf", ids: [101, 102] },
  { stage: "st.final", ids: [104] },
];
const BRACKET_PREVIOUS = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100], 104: [101, 102],
};
const BRACKET_STAGE_METRIC = {
  round_of_32: "reach_r16",
  round_of_16: "reach_qf",
  quarterfinal: "reach_sf",
  semifinal: "reach_final",
  final: "champion",
};
let bracketHL = null;
let projectedBracket = {}; // matchId -> {a, b, winner}; 승자가 다음 라운드로 올라가는 단일 예상 대진

function slotKey(id, side) {
  return `${id}|${side}`;
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return (candidates || []).filter((c) => {
    if (!c || !c.team || seen.has(c.team)) return false;
    seen.add(c.team);
    return true;
  });
}

function candidateProbability(candidates, team) {
  const found = (candidates || []).find((c) => c.team === team);
  return found ? found.prob : 0;
}

function teamRecord(name) {
  return D.team_table.find((r) => r.team === name) || {};
}

function fallbackWinnerScore(match, team) {
  const row = teamRecord(team);
  const metric = BRACKET_STAGE_METRIC[match.stage] || "champion";
  return row[metric] || row.champion || ((row.current_elo || row.base_elo || 0) / 10000);
}

function computeRoundOf32Assignment() {
  const slot = {};
  const used = new Set();
  const cands = [];

  BRACKET_COLS[0].ids.forEach((id) => {
    const m = D.bracket[String(id)];
    if (!m) return;
    ["a", "b"].forEach((side) => {
      uniqueCandidates(m[side]).forEach((c) => {
        cands.push({ prob: c.prob, mid: String(id), side, team: c.team });
      });
    });
  });

  cands.sort((x, y) => y.prob - x.prob);
  for (const c of cands) {
    const key = slotKey(c.mid, c.side);
    if (slot[key] || used.has(c.team)) continue;
    slot[key] = { team: c.team, prob: c.prob };
    used.add(c.team);
  }

  BRACKET_COLS[0].ids.forEach((id) => {
    const m = D.bracket[String(id)];
    ["a", "b"].forEach((side) => {
      const key = slotKey(id, side);
      if (slot[key]) return;
      const pick = uniqueCandidates(m[side]).find((c) => !used.has(c.team));
      if (pick) {
        slot[key] = { team: pick.team, prob: pick.prob };
        used.add(pick.team);
      }
    });
  });

  return slot;
}

function pickForMatchSide(id, side, pick) {
  if (!pick) return null;
  const m = D.bracket[String(id)];
  const prob = candidateProbability(m[side], pick.team);
  return { team: pick.team, prob: prob || pick.winProb || pick.prob || 0 };
}

function pickMatchWinner(match, aPick, bPick) {
  if (!aPick) return bPick;
  if (!bPick) return aPick;
  // 예상 두 팀이 실제로 맞붙으면 누가 이기나 = 현재 Elo 맞대결 (강한 팀이 진출).
  // (주변부 진출확률로 뽑으면 "그 자리에 올 확률"이 섞여 약팀이 강팀을 이긴 것처럼 보이는 착시 발생)
  const ea = teamRecord(aPick.team).current_elo ?? teamRecord(aPick.team).base_elo ?? 0;
  const eb = teamRecord(bPick.team).current_elo ?? teamRecord(bPick.team).base_elo ?? 0;
  return eb > ea ? bPick : aPick;
}

function computeProjectedBracket() {
  const projected = {};
  const r32 = computeRoundOf32Assignment();

  BRACKET_COLS[0].ids.forEach((id) => {
    const m = D.bracket[String(id)];
    const a = r32[slotKey(id, "a")];
    const b = r32[slotKey(id, "b")];
    projected[String(id)] = { a, b, winner: pickMatchWinner(m, a, b) };
  });

  BRACKET_COLS.slice(1).forEach((col) => {
    col.ids.forEach((id) => {
      const m = D.bracket[String(id)];
      const prev = BRACKET_PREVIOUS[id];
      const a = pickForMatchSide(id, "a", projected[String(prev[0])].winner);
      const b = pickForMatchSide(id, "b", projected[String(prev[1])].winner);
      projected[String(id)] = { a, b, winner: pickMatchWinner(m, a, b) };
    });
  });

  return projected;
}

function renderBracket() {
  projectedBracket = computeProjectedBracket();
  const wrap = document.getElementById("bracketWrap");
  wrap.innerHTML = BRACKET_COLS.map((col) => {
    const matches = col.ids.map((id) => bracketMatch(id)).join("");
    return `<div class="bk-col"><div class="bk-col-head">${t(col.stage)}</div>${matches}</div>`;
  }).join("");
  wrap.onclick = (e) => {
    const el = e.target.closest("[data-bkteam]");
    if (!el) return;
    const name = el.dataset.bkteam;
    bracketHL = bracketHL === name ? null : name;
    renderBracket();
  };
}

function bracketSide(pick, winnerName) {
  if (!pick) return `<div class="bk-team">-</div>`;
  const isWin = pick.team === winnerName;
  const isHL = bracketHL === pick.team;
  const prob = pick.prob || 0;
  const winTxt = LANG === "en" ? "Projected winner · " : "예상 승자 · ";
  return `<div class="bk-team ${isWin ? "win" : ""} ${isHL ? "hl" : ""}" data-bkteam="${pick.team}" title="${teamName(pick.team)} ${isWin ? winTxt : ""}${pct(prob)}">
    <span class="bk-flag">${teamFlag(pick.team)}</span>
    <span class="bk-name">${teamName(pick.team)}</span>
    <span class="bk-pct">${isWin ? t("res.W") + " " : ""}${pct0(prob)}</span>
  </div>`;
}

function bracketMatch(id) {
  const m = projectedBracket[String(id)];
  if (!m) return "";
  const aPick = m.a;
  const bPick = m.b;
  const winner = m.winner ? m.winner.team : "";
  return `<div class="bk-match">${bracketSide(aPick, winner)}${bracketSide(bPick, winner)}</div>`;
}

const RENDER = {
  standings: renderStandings, elo: renderElo, evolution: renderEvolution,
  next: renderNext, continent: renderContinent,
  matchup: renderMatchup, bracket: renderBracket,
};

// =================== TEAM PAGE (hash routing) ===================
const STAGE_LABELS = [
  ["reach_r32", "st.r32"], ["reach_r16", "st.r16"], ["reach_qf", "st.qf"],
  ["reach_sf", "st.sf"], ["reach_final", "st.final"], ["champion", "st.win"],
];

function teamLink(name, inner) {
  return `<a class="team-link" href="#team/${encodeURIComponent(name)}">${inner}</a>`;
}

const POS_SEGS = [["p1", "pos.1", "#3ddc97"], ["p2", "pos.2", "#4f8cff"], ["p3", "pos.3", "#f5a623"], ["p4", "pos.4", "#ef6f6c"]];
function posBar(gp) {
  if (!gp) return "";
  // 진출 확률과 동일한 셀 디자인 (라벨 좌상단 + 확률만큼 차오름 + %)
  const cells = POS_SEGS.map(([k, lblKey, c]) => {
    const lbl = t(lblKey);
    const p = Math.round((gp[k] || 0) * 100);
    const h = Math.max(4, (gp[k] || 0) * 100);
    return `<span class="pcol" title="${lbl} ${p}%"><i class="fill" style="height:${h}%;background:${c}"></i><span class="lbl">${lbl}</span><span class="val">${p}%</span></span>`;
  }).join("");
  return `<div class="pgrid">${cells}</div>`;
}

function renderTeamPage(name) {
  const tp = D.team_pages[name];
  const tv = document.getElementById("teamview");
  if (!tp) { tv.innerHTML = `<p>${LANG === "en" ? "Team not found." : "팀을 찾을 수 없습니다."}</p>`; return; }

  const chg = tp.elo_change_actual;
  const chgCls = chg > 0 ? "chg-pos" : chg < 0 ? "chg-neg" : "chg-zero";
  const chgTxt = (chg > 0 ? "+" : "") + chg.toFixed(1);

  // stage funnel
  const grad = `linear-gradient(90deg, ${teamColor2(name)}, ${teamColor(name)})`;
  const funnel = STAGE_LABELS.map(([k, lbl]) => {
    const p = tp.probs[k];
    return `<div class="funnel-row">
      <span class="funnel-lbl">${t(lbl)}</span>
      <div class="funnel-bar"><span style="width:${(p * 100).toFixed(1)}%;background:${grad}"></span></div>
      <span class="funnel-pct">${pct(p)}</span>
    </div>`;
  }).join("");

  // group standings
  const gs = D.group_standings[tp.group] || [];
  const gsRows = gs.map((r, i) => `<tr class="${r.team === name ? "me" : ""}">
    <td data-label="${t('th.rank')}">${i + 1}</td>
    <td class="cell-team">${teamLink(r.team, `<span class="flag">${teamFlag(r.team)}</span> ${teamName(r.team)}`)}</td>
    <td class="num" data-label="${t('th.played')}">${r.played}</td>
    <td class="num" data-label="${t('th.wdl')}">${r.w}-${r.d}-${r.l}</td>
    <td class="num" data-label="${t('th.gd')}">${r.gf}:${r.ga}</td>
    <td class="num" data-label="${t('th.gddiff')}">${r.gd > 0 ? "+" : ""}${r.gd}</td>
    <td class="num" data-label="${t('th.pts')}"><b>${r.pts}</b></td>
  </tr>`).join("");

  // fixtures
  const fx = tp.fixtures.map((f) => {
    let right;
    if (f.played) {
      const cls = f.result === "W" ? "chg-pos" : f.result === "L" ? "chg-neg" : "chg-zero";
      const tag = { W: t("res.W"), L: t("res.L"), D: t("res.D") }[f.result];
      right = `<span class="fx-score ${cls}">${f.gf} – ${f.ga} <b>${tag}</b></span>`;
    } else {
      right = `<span class="fx-up">${t("scheduled")}</span>`;
    }
    return `<div class="fx-row">
      <span class="fx-date">${kstDateTime(f)}</span>
      <span class="fx-opp">vs ${teamLink(f.opponent, `<span class="flag">${teamFlag(f.opponent)}</span> ${teamName(f.opponent)}`)}</span>
      ${right}
    </div>`;
  }).join("");

  // R32 opponents top 5
  const maxOpp = tp.r32_opponents.length ? tp.r32_opponents[0].prob : 1;
  const opps = tp.r32_opponents.length
    ? tp.r32_opponents.map((o) => `<div class="opp-row">
        <span class="opp-name">${teamLink(o.team, `<span class="flag">${teamFlag(o.team)}</span> ${teamName(o.team)}`)}</span>
        <div class="opp-bar"><span style="width:${(o.prob / maxOpp * 100).toFixed(1)}%;background:${teamGradCss(o.team)}"></span></div>
        <span class="opp-pct">${pct(o.prob)}</span>
      </div>`).join("")
    : `<p class="note">${t("noR32")}</p>`;

  const heroSub = LANG === "en" ? "" : ` <span class="hero-en">${name}</span>`;
  const fifaTxt = LANG === "en" ? `FIFA #${tp.fifa_rank ?? "-"}` : `FIFA ${tp.fifa_rank ?? "-"}위`;
  const eloTxt = LANG === "en" ? "Elo" : "현재 Elo";
  const titlesTxt = tp.titles ? (LANG === "en" ? ` · ${tp.titles} titles` : ` · 우승 ${tp.titles}회`) : "";
  const bestTxt = tp.best_result ? (LANG === "en" ? ` · Best: ${bestResult(tp.best_result)}` : ` · 최고성적 ${bestResult(tp.best_result)}`) : "";
  const winLbl = LANG === "en" ? "Title odds" : "우승 확률";
  const viewGroupTxt = LANG === "en" ? `View full Group ${tp.group} →` : `${tp.group}조 전체 현황 보기 →`;
  tv.innerHTML = `
    <a class="back" href="#">${t("backStand")}</a>
    <div class="team-hero">
      <div class="hero-flag">${teamFlag(name)}</div>
      <div>
        <h1 class="hero-name">${teamName(name)}${heroSub}</h1>
        <div class="hero-meta">
          ${groupName(tp.group)} · ${confLabel(tp.confederation)} · ${fifaTxt}
          · ${eloTxt} <b>${tp.current_elo}</b> <span class="${chgCls}">(${chgTxt})</span>
          ${titlesTxt}${bestTxt}
        </div>
      </div>
      <div class="hero-win">
        <div class="hero-win-pct">${gradText(grad, pct(tp.probs.champion))}</div>
        <div class="hero-win-lbl">${winLbl}</div>
      </div>
    </div>

    <div class="grid2">
      <div class="card"><h3>${t("funnelTitle")}</h3>${funnel}</div>
      <div class="card"><h3>${t("oppTitle")} <span class="hint">${t("oppHint")}</span></h3>${opps}</div>
    </div>

    <div class="card">
      <h3>🏅 ${groupName(tp.group)} ${t("posTitle")}</h3>
      ${posBar(tp.group_pos)}
      <a class="team-link gp-link" href="#group/${tp.group}">${viewGroupTxt}</a>
    </div>

    <div class="card">
      <h3>📋 ${groupName(tp.group)} ${t("standingsTitle")}</h3>
      <div class="table-scroll"><table class="gs-table rtable">
        <thead><tr><th>#</th><th>${t("th.team")}</th><th class="num">${t("th.played")}</th><th class="num">${t("th.wdl")}</th><th class="num">${t("th.gd")}</th><th class="num">${t("th.gddiff")}</th><th class="num">${t("th.pts")}</th></tr></thead>
        <tbody>${gsRows}</tbody>
      </table></div>
    </div>

    <div class="card">
      <h3>${t("fixturesTitle")} <span class="hint">${t("kstNote")}</span></h3>
      <div class="fx-list">${fx}</div>
    </div>
  `;
}

const ALL_GROUPS = "ABCDEFGHIJKL".split("");
function renderGroupPage(g) {
  const gp = D.group_pages[g];
  const gv = document.getElementById("groupview");
  if (!gp) { gv.innerHTML = `<p>${t("groupNotFound")}</p>`; return; }

  const selector = `<div class="group-nav">` +
    ALL_GROUPS.map((x) => `<a class="gnav ${x === g ? "active" : ""}" href="#group/${x}">${x}</a>`).join("") +
    `</div>`;

  // standings + position probabilities
  const standings = D.group_standings[g] || [];
  const rows = standings.map((r, i) => `<tr>
    <td data-label="${t('th.rank')}">${i + 1}</td>
    <td class="cell-team">${teamLink(r.team, `<span class="flag">${teamFlag(r.team)}</span> ${teamName(r.team)}`)}</td>
    <td class="num" data-label="${t('th.played')}">${r.played}</td>
    <td class="num" data-label="${t('th.wdl')}">${r.w}-${r.d}-${r.l}</td>
    <td class="num" data-label="${t('th.gd')}">${r.gf}:${r.ga}</td>
    <td class="num" data-label="${t('th.gddiff')}">${r.gd > 0 ? "+" : ""}${r.gd}</td>
    <td class="num" data-label="${t('th.pts')}"><b>${r.pts}</b></td>
    <td class="num" data-label="${t('th.elo')}">${r.elo}</td>
    <td class="pos-cell cell-full" data-label="${t('posCol')}">${posBar(gp.positions[r.team])}</td>
  </tr>`).join("");

  // fixtures
  const fx = gp.fixtures.map((f) => {
    const head = `<span class="gfx-date">${kstDateTime(f)}</span>`;
    const teams = `<span class="gfx-teams">${teamLink(f.team_a, `${teamFlag(f.team_a)} ${teamName(f.team_a)}`)}
      <b class="gfx-mid">${f.played ? `${f.goals_a} - ${f.goals_b}` : "vs"}</b>
      ${teamLink(f.team_b, `${teamName(f.team_b)} ${teamFlag(f.team_b)}`)}</span>`;
    let extra = "";
    if (f.played) {
      extra = `<span class="fx-up done">${t("done")}</span>`;
    } else {
      const w = f.p_win_a * 100, d = f.p_draw * 100, l = f.p_win_b * 100;
      extra = `<div class="wdl mini" title="${teamName(f.team_a)} ${w.toFixed(0)}% · ${t("draw")} ${d.toFixed(0)}% · ${teamName(f.team_b)} ${l.toFixed(0)}%">
        <span style="width:${w}%;background:${teamGradCss(f.team_a)}">${w >= 12 ? w.toFixed(0) + "%" : ""}</span>
        <span style="width:${d}%;background:${DRAW_GRAD}">${d >= 12 ? d.toFixed(0) + "%" : ""}</span>
        <span style="width:${l}%;background:${teamGradCss(f.team_b)}">${l >= 12 ? l.toFixed(0) + "%" : ""}</span>
      </div>`;
    }
    return `<div class="gfx-row ${f.played ? "" : "upcoming"}">${head}${teams}${extra}</div>`;
  }).join("");

  const remaining = gp.fixtures.filter((f) => !f.played).length;

  const metaTxt = LANG === "en"
    ? `${standings.length} teams · ${remaining} matches left`
    : `${standings.length}개 팀 · 남은 경기 ${remaining}개`;
  gv.innerHTML = `
    <a class="back" href="#">${t("backStand")}</a>
    ${selector}
    <div class="team-hero">
      <div class="hero-flag">📊</div>
      <div>
        <h1 class="hero-name">${groupName(g)}</h1>
        <div class="hero-meta">${metaTxt}</div>
      </div>
    </div>

    <div class="card">
      <h3>${t("gpStandings")} <span class="hint">${t("gpStandingsHint")}</span></h3>
      <div class="table-scroll"><table class="gs-table rtable">
        <thead><tr>
          <th>#</th><th>${t("th.team")}</th><th class="num">${t("th.played")}</th><th class="num">${t("th.wdl")}</th>
          <th class="num">${t("th.gd")}</th><th class="num">${t("th.gddiff")}</th><th class="num">${t("th.pts")}</th><th class="num">${t("th.elo")}</th>
          <th>${t("posCol")}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>

    <div class="card">
      <h3>${t("fullSched")} <span class="hint">${t("fullSchedHint")}</span></h3>
      <div class="gfx-list">${fx}</div>
    </div>
  `;
}

function route() {
  const hash = decodeURIComponent(location.hash);
  const tm = hash.match(/^#team\/(.+)$/);
  const gm = hash.match(/^#group\/(.+)$/);
  const tv = document.getElementById("teamview");
  const gv = document.getElementById("groupview");
  const showTeam = !!tm && !!D.team_pages[tm[1]];
  const showGroup = !!gm && !!(D.group_pages && D.group_pages[gm[1]]);
  const detail = showTeam || showGroup;
  document.querySelector("nav.tabs").style.display = detail ? "none" : "";
  document.querySelector("main").style.display = detail ? "none" : "";
  tv.style.display = showTeam ? "block" : "none";
  gv.style.display = showGroup ? "block" : "none";
  if (showTeam) { renderTeamPage(tm[1]); window.scrollTo(0, 0); }
  else if (showGroup) { renderGroupPage(gm[1]); window.scrollTo(0, 0); }
}
window.addEventListener("hashchange", route);

// GA4: 팀/조 페이지 등 해시 이동을 가상 페이지뷰로 기록 (최초 로드는 gtag config가 자동 기록)
window.addEventListener("hashchange", () => {
  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_location: location.href,
      page_path: location.pathname + location.hash,
      page_title: document.title,
    });
  }
});

// ---- 정적 텍스트 i18n 적용 + 언어 토글 ----
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
}
function setupLangToggle() {
  const box = document.getElementById("langToggle");
  if (!box) return;
  box.querySelectorAll("button").forEach((b) => {
    if (b.dataset.lang === LANG) b.classList.add("active");
    b.onclick = () => {
      if (b.dataset.lang === LANG) return;
      localStorage.setItem("wc_lang", b.dataset.lang);
      location.reload();
    };
  });
}
applyStaticI18n();
setupLangToggle();

// initial
renderStandings();
rendered.standings = true;
route();
