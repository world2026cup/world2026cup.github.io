/* global Chart, WC_DATA */
const D = window.WC_DATA;

const CONF_COLOR = {
  UEFA: "#4f8cff", CONMEBOL: "#ffd166", CAF: "#3ddc97",
  AFC: "#ef6f6c", CONCACAF: "#b388ff", OFC: "#ff9f6e",
};
const confColor = (c) => CONF_COLOR[c] || "#8a93a3";
const pct = (x) => (x * 100).toFixed(1) + "%";
const pct0 = (x) => Math.round(x * 100) + "%";

// 팀명 → 한국어/국기 헬퍼
const TI = window.TEAM_INFO || {};
const teamKo = (name) => (TI[name] ? TI[name].ko : name);
const teamFlag = (name) => (TI[name] ? TI[name].flag : "");
const teamLabel = (name) => `${teamFlag(name)} ${teamKo(name)}`.trim();

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

// ---- header / footer ----
document.getElementById("subline").textContent =
  `${D.totals.teams}개국 · ${D.totals.groups}개조 · ${D.played_count}경기 완료 · 시뮬레이션 ${D.simulations.toLocaleString()}회 (기준일 ${D.generated})`;
document.getElementById("footinfo").textContent =
  `스냅샷 ${D.snapshots.length}개 · 다음 경기 ${D.next_matches.length}개`;

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
      <div class="pname">${teamKo(r.team)}</div>
      <div class="pwin">${pct(r.champion)}</div>
      <div class="pmeta">${r.confederation} · Elo ${r.current_elo}</div>
    </div>`;
  }).join("");

  const tbody = document.querySelector("#standings-table tbody");
  tbody.innerHTML = t.map((r, i) => {
    const chg = r.elo_change_actual;
    const chgCls = chg > 0 ? "chg-pos" : chg < 0 ? "chg-neg" : "chg-zero";
    const chgTxt = (chg > 0 ? "+" : "") + chg.toFixed(1);
    return `<tr>
      <td class="rank">${i + 1} ${prevRank ? rankArrow(prevRank[r.team], curRank[r.team]) : ""}</td>
      <td><a class="team-link" href="#team/${encodeURIComponent(r.team)}"><span class="flag">${teamFlag(r.team)}</span> <b>${teamKo(r.team)}</b></a></td>
      <td class="num pct" style="color:${confColor(r.confederation)}">${pct(r.champion)}</td>
      <td class="num">${r.current_elo}</td>
      <td class="num ${chgCls}">${chgTxt}</td>
      <td>${r.group}</td>
      <td><span style="color:${confColor(r.confederation)}">●</span> ${r.confederation}</td>
      <td>${progressionBar(r)}</td>
    </tr>`;
  }).join("");
}

function progressionBar(r) {
  // nested stages: each segment width = that round's probability share of 100%
  const stages = [
    ["reach_r32", "#2b333f"], ["reach_r16", "#3a4658"],
    ["reach_qf", "#4f8cff"], ["reach_sf", "#7b6cff"],
    ["reach_final", "#ffd166"], ["champion", "#3ddc97"],
  ];
  const segs = stages.map(([k, c]) =>
    `<span style="width:${(r[k] * 100 / 6).toFixed(2)}%;background:${c}" title="${k}: ${pct(r[k])}"></span>`
  ).join("");
  return `<div class="minibar" title="R32 ${pct0(r.reach_r32)} · 16강 ${pct0(r.reach_r16)} · 8강 ${pct0(r.reach_qf)} · 4강 ${pct0(r.reach_sf)} · 결승 ${pct0(r.reach_final)} · 우승 ${pct0(r.champion)}">${segs}</div>`;
}

// =================== ELO ===================
let eloChart;
function renderElo() {
  const m = D.elo_matches;
  // biggest movers: take max |delta| side of each match, sort
  const movers = m.map((x) => {
    const aBig = Math.abs(x.delta_a) >= Math.abs(x.delta_b);
    return aBig
      ? { team: x.team_a, delta: x.delta_a, label: `${teamLabel(x.team_a)} ${x.goals_a}-${x.goals_b} ${teamLabel(x.team_b)}` }
      : { team: x.team_b, delta: x.delta_b, label: `${teamLabel(x.team_b)} ${x.goals_b}-${x.goals_a} ${teamLabel(x.team_a)}` };
  }).sort((a, b) => b.delta - a.delta);

  eloChart = new Chart(document.getElementById("eloMoversChart"), {
    type: "bar",
    data: {
      labels: movers.map((x) => teamLabel(x.team)),
      datasets: [{
        data: movers.map((x) => x.delta),
        backgroundColor: movers.map((x) => x.delta >= 0 ? "#3ddc97" : "#ef6f6c"),
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: "y", maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          title: (it) => movers[it[0].dataIndex].label,
          label: (it) => `Elo ${it.raw >= 0 ? "+" : ""}${it.raw}`,
        } },
      },
      scales: { x: { title: { display: true, text: "Elo 변화" } } },
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
          <span class="hint">(${x.group}조)</span></span>
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
function renderEvolution() {
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
      <span class="mv-team">${teamLink(x.team, `<span class="flag">${teamFlag(x.team)}</span> ${teamKo(x.team)}`)}</span>
      <span class="mv-now">${pct(x.now)}</span>
      <span class="mv-delta ${cls}">${sign}${(x.delta * 100).toFixed(1)}p</span>
    </div>`;
  };
  document.getElementById("riserList").innerHTML = risers.map(row).join("") || "<p class='note'>변동 없음</p>";
  document.getElementById("fallerList").innerHTML = fallers.map(row).join("") || "<p class='note'>변동 없음</p>";
}

let snapBarChart, playTimer = null;
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
  if (!snap.last_match) return "개막 전 · 경기 없음";
  const lm = snap.last_match;
  return `${snap.label} · ${kstDateOnly(lm)} · ${teamFlag(lm.team_a)} ${teamKo(lm.team_a)} ${lm.goals_a}-${lm.goals_b} ${teamKo(lm.team_b)} ${teamFlag(lm.team_b)}`;
}

function drawSnapBar(idx) {
  const snap = D.snapshots[idx];
  document.getElementById("sliderLabel").textContent = snapTitle(snap);
  const teams = snap.teams;
  const top = Object.keys(teams).sort((a, b) => teams[b].champion - teams[a].champion).slice(0, 10);
  const labels = top.map(teamLabel);
  const data = top.map((n) => +(teams[n].champion * 100).toFixed(2));
  const colors = top.map((n) => confColor((D.team_pages[n] || {}).confederation));
  if (!snapBarChart) {
    snapBarChart = new Chart(document.getElementById("snapBarChart"), {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        indexAxis: "y", maintainAspectRatio: false,
        animation: { duration: 350 },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (it) => `우승 ${it.raw}%` } } },
        scales: { x: { title: { display: true, text: "우승 확률 (%)" }, beginAtZero: true } },
      },
    });
  } else {
    snapBarChart.data.labels = labels;
    snapBarChart.data.datasets[0].data = data;
    snapBarChart.data.datasets[0].backgroundColor = colors;
    snapBarChart.update();
  }
}
function togglePlay() {
  if (playTimer) { stopPlay(); return; }
  const slider = document.getElementById("snapSlider");
  document.getElementById("playBtn").textContent = "⏸ 정지";
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
  document.getElementById("playBtn").textContent = "▶ 재생";
}
function buildEvoChart() {
  // top 8 teams by latest value of the chosen metric
  const last = D.snapshots[D.snapshots.length - 1].teams;
  const top = Object.keys(last)
    .sort((a, b) => last[b][evoMetric] - last[a][evoMetric]).slice(0, 8);
  const labels = D.snapshots.map((s) => s.label);
  const palette = ["#3ddc97", "#ffd166", "#4f8cff", "#ef6f6c", "#b388ff", "#ff9f6e", "#56d4dd", "#f78fb3"];
  const datasets = top.map((team, i) => ({
    label: teamLabel(team),
    data: D.snapshots.map((s) => +( (s.teams[team]?.[evoMetric] || 0) * 100).toFixed(2)),
    borderColor: palette[i], backgroundColor: palette[i],
    tension: 0.3, pointRadius: 3, borderWidth: 2,
  }));
  if (evoChart) evoChart.destroy();
  evoChart = new Chart(document.getElementById("evoChart"), {
    type: "line",
    data: { labels, datasets },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { tooltip: { callbacks: { label: (it) => `${it.dataset.label}: ${it.raw}%` } } },
      scales: { y: { title: { display: true, text: "확률 (%)" }, beginAtZero: true } },
    },
  });
}

// =================== NEXT MATCHUPS ===================
function renderNext() {
  const el = document.getElementById("nextCards");
  el.innerHTML = D.next_matches.map((m) => {
    const w = (m.p_win_a * 100), d = (m.p_draw * 100), l = (m.p_win_b * 100);
    return `<div class="mcard">
      <div class="mhead"><span>${m.group}조 · ${kstDateTime(m)} <span class="kst-tag">KST</span></span><span>경기 #${m.match_id}</span></div>
      <div class="teams-row">
        <div><div class="tname">${teamFlag(m.team_a)} ${teamKo(m.team_a)}</div><div class="telo">${m.conf_a} · Elo ${m.elo_a}</div></div>
        <div style="color:var(--muted)">vs</div>
        <div style="text-align:right"><div class="tname">${teamKo(m.team_b)} ${teamFlag(m.team_b)}</div><div class="telo">${m.conf_b} · Elo ${m.elo_b}</div></div>
      </div>
      <div class="wdl">
        <span class="w" style="width:${w}%">${w >= 11 ? w.toFixed(0) + "%" : ""}</span>
        <span class="d" style="width:${d}%">${d >= 11 ? d.toFixed(0) + "%" : ""}</span>
        <span class="l" style="width:${l}%">${l >= 11 ? l.toFixed(0) + "%" : ""}</span>
      </div>
      <div class="wdl-legend"><span>승 ${w.toFixed(0)}%</span><span>무 ${d.toFixed(0)}%</span><span>승 ${l.toFixed(0)}%</span></div>
      <div class="xg">예상 득점 ${m.xg_a} – ${m.xg_b}</div>
    </div>`;
  }).join("");
}

// =================== CONTINENT ===================
function renderContinent() {
  const c = D.conf_analysis;
  const labels = c.map((x) => x.confederation);
  // share comparison
  new Chart(document.getElementById("confShareChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "배정 점유율", data: c.map((x) => +(x.alloc_share * 100).toFixed(1)), backgroundColor: "#3a4658" },
        { label: "전력 점유율(Elo)", data: c.map((x) => +(x.strength_share * 100).toFixed(1)), backgroundColor: "#4f8cff" },
        { label: "우승확률 점유율", data: c.map((x) => +(x.champion_share * 100).toFixed(1)), backgroundColor: "#3ddc97" },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { label: (it) => `${it.dataset.label}: ${it.raw}%` } } },
      scales: { y: { title: { display: true, text: "점유율 (%)" }, beginAtZero: true } },
    },
  });

  new Chart(document.getElementById("confEloChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "누적 Elo 변화",
        data: c.map((x) => x.elo_change_total),
        backgroundColor: c.map((x) => x.elo_change_total >= 0 ? "#3ddc97" : "#ef6f6c"),
        borderRadius: 4,
      }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { title: { display: true, text: "Elo 변화 합" } } },
    },
  });

  document.querySelector("#confTable tbody").innerHTML = c.map((x) => {
    const chg = x.elo_change_total;
    const cls = chg > 0 ? "chg-pos" : chg < 0 ? "chg-neg" : "chg-zero";
    return `<tr>
      <td class="cell-team"><span style="color:${confColor(x.confederation)}">●</span> <b>${x.confederation}</b></td>
      <td class="num" data-label="팀">${x.teams}</td>
      <td class="num" data-label="평균 Elo">${x.avg_base_elo}</td>
      <td class="num" data-label="우승확률합">${pct(x.champion_share)}</td>
      <td class="num" data-label="기대 16강수">${x.exp_r16}</td>
      <td class="num ${cls}" data-label="Elo변화">${(chg > 0 ? "+" : "") + chg}</td>
    </tr>`;
  }).join("");
}

// =================== MATCHUP FINDER ===================
const STAGE_KO = {
  round_of_32: "32강", round_of_16: "16강", quarterfinal: "8강",
  semifinal: "4강", final: "결승", third_place: "3·4위전",
};
const STAGE_ORDER = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final", "third_place"];

function renderMatchup() {
  const names = D.team_table.map((r) => r.team).sort((a, b) => teamKo(a).localeCompare(teamKo(b), "ko"));
  const opts = names.map((n) => `<option value="${n}">${teamFlag(n)} ${teamKo(n)}</option>`).join("");
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
  if (a === b) { box.innerHTML = `<p class="note">서로 다른 두 팀을 선택하세요.</p>`; return; }
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  const rec = D.meetings[key];
  const head = `<div class="mu-head">
    <span class="mu-side">${teamLink(a, `<span class="flag">${teamFlag(a)}</span> <b>${teamKo(a)}</b>`)}</span>
    <span class="vs-big">VS</span>
    <span class="mu-side">${teamLink(b, `<span class="flag">${teamFlag(b)}</span> <b>${teamKo(b)}</b>`)}</span>
  </div>`;
  if (!rec) {
    box.innerHTML = head + `<p class="mu-total">만날 확률 <b>&lt; 0.3%</b> · 사실상 만나기 어렵습니다.</p>`;
    return;
  }
  const maxStage = Math.max(...Object.values(rec.stages));
  const rows = STAGE_ORDER.filter((s) => rec.stages[s]).map((s) => {
    const p = rec.stages[s];
    return `<div class="mu-row">
      <span class="mu-stage">${STAGE_KO[s]}</span>
      <div class="mu-bar"><span style="width:${(p / maxStage * 100).toFixed(1)}%"></span></div>
      <span class="mu-pct">${pct(p)}</span>
    </div>`;
  }).join("");
  box.innerHTML = head +
    `<p class="mu-total">토너먼트에서 만날 확률 <b>${pct(rec.total)}</b></p>` +
    `<div class="mu-stages">${rows}</div>`;
}

// =================== BRACKET ===================
const BRACKET_COLS = [
  { stage: "32강", ids: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] },
  { stage: "16강", ids: [89, 90, 93, 94, 91, 92, 95, 96] },
  { stage: "8강", ids: [97, 98, 99, 100] },
  { stage: "4강", ids: [101, 102] },
  { stage: "결승", ids: [104] },
];
let bracketHL = null;

function renderBracket() {
  const wrap = document.getElementById("bracketWrap");
  wrap.innerHTML = BRACKET_COLS.map((col) => {
    const matches = col.ids.map((id) => bracketMatch(id)).join("");
    return `<div class="bk-col"><div class="bk-col-head">${col.stage}</div>${matches}</div>`;
  }).join("");
  wrap.onclick = (e) => {
    const el = e.target.closest("[data-bkteam]");
    if (!el) return;
    const name = el.dataset.bkteam;
    bracketHL = bracketHL === name ? null : name;
    renderBracket();
  };
}

function bracketSide(side, winnerName) {
  const top = side[0];
  if (!top) return `<div class="bk-team">-</div>`;
  const isWin = top.team === winnerName;
  const isHL = bracketHL === top.team;
  return `<div class="bk-team ${isWin ? "win" : ""} ${isHL ? "hl" : ""}" data-bkteam="${top.team}" title="${teamKo(top.team)} ${pct(top.prob)}">
    <span class="bk-flag">${teamFlag(top.team)}</span>
    <span class="bk-name">${teamKo(top.team)}</span>
    <span class="bk-pct">${pct0(top.prob)}</span>
  </div>`;
}

function bracketMatch(id) {
  const m = D.bracket[String(id)];
  if (!m) return "";
  const winner = m.winner[0] ? m.winner[0].team : "";
  return `<div class="bk-match">${bracketSide(m.a, winner)}${bracketSide(m.b, winner)}</div>`;
}

const RENDER = {
  standings: renderStandings, elo: renderElo, evolution: renderEvolution,
  next: renderNext, continent: renderContinent,
  matchup: renderMatchup, bracket: renderBracket,
};

// =================== TEAM PAGE (hash routing) ===================
const STAGE_LABELS = [
  ["reach_r32", "32강"], ["reach_r16", "16강"], ["reach_qf", "8강"],
  ["reach_sf", "4강"], ["reach_final", "결승"], ["champion", "우승"],
];

function teamLink(name, inner) {
  return `<a class="team-link" href="#team/${encodeURIComponent(name)}">${inner}</a>`;
}

const POS_SEGS = [["p1", "1위", "#3ddc97"], ["p2", "2위", "#4f8cff"], ["p3", "3위", "#ffd166"], ["p4", "4위", "#ef6f6c"]];
function posBar(gp) {
  if (!gp) return "";
  return `<div class="pos-bar">` + POS_SEGS.map(([k, lbl, c]) => {
    const w = (gp[k] || 0) * 100;
    return `<span style="width:${w}%;background:${c}" title="${lbl} ${pct(gp[k] || 0)}">${w >= 12 ? Math.round(w) + "%" : ""}</span>`;
  }).join("") + `</div>`;
}
function posLegend() {
  return `<div class="pos-legend">` +
    POS_SEGS.map(([, lbl, c]) => `<span><i style="background:${c}"></i>${lbl}</span>`).join("") +
    `</div>`;
}

function renderTeamPage(name) {
  const tp = D.team_pages[name];
  const tv = document.getElementById("teamview");
  if (!tp) { tv.innerHTML = `<p>팀을 찾을 수 없습니다.</p>`; return; }

  const chg = tp.elo_change_actual;
  const chgCls = chg > 0 ? "chg-pos" : chg < 0 ? "chg-neg" : "chg-zero";
  const chgTxt = (chg > 0 ? "+" : "") + chg.toFixed(1);

  // stage funnel
  const funnel = STAGE_LABELS.map(([k, lbl]) => {
    const p = tp.probs[k];
    return `<div class="funnel-row">
      <span class="funnel-lbl">${lbl}</span>
      <div class="funnel-bar"><span style="width:${(p * 100).toFixed(1)}%"></span></div>
      <span class="funnel-pct">${pct(p)}</span>
    </div>`;
  }).join("");

  // group standings
  const gs = D.group_standings[tp.group] || [];
  const gsRows = gs.map((r, i) => `<tr class="${r.team === name ? "me" : ""}">
    <td data-label="순위">${i + 1}</td>
    <td class="cell-team">${teamLink(r.team, `<span class="flag">${teamFlag(r.team)}</span> ${teamKo(r.team)}`)}</td>
    <td class="num" data-label="경기">${r.played}</td>
    <td class="num" data-label="승무패">${r.w}-${r.d}-${r.l}</td>
    <td class="num" data-label="득실">${r.gf}:${r.ga}</td>
    <td class="num" data-label="골득실차">${r.gd > 0 ? "+" : ""}${r.gd}</td>
    <td class="num" data-label="승점"><b>${r.pts}</b></td>
  </tr>`).join("");

  // fixtures
  const fx = tp.fixtures.map((f) => {
    let right;
    if (f.played) {
      const cls = f.result === "W" ? "chg-pos" : f.result === "L" ? "chg-neg" : "chg-zero";
      const tag = { W: "승", L: "패", D: "무" }[f.result];
      right = `<span class="fx-score ${cls}">${f.gf} – ${f.ga} <b>${tag}</b></span>`;
    } else {
      right = `<span class="fx-up">예정</span>`;
    }
    return `<div class="fx-row">
      <span class="fx-date">${kstDateTime(f)}</span>
      <span class="fx-opp">vs ${teamLink(f.opponent, `<span class="flag">${teamFlag(f.opponent)}</span> ${teamKo(f.opponent)}`)}</span>
      ${right}
    </div>`;
  }).join("");

  // R32 opponents top 5
  const maxOpp = tp.r32_opponents.length ? tp.r32_opponents[0].prob : 1;
  const opps = tp.r32_opponents.length
    ? tp.r32_opponents.map((o) => `<div class="opp-row">
        <span class="opp-name">${teamLink(o.team, `<span class="flag">${teamFlag(o.team)}</span> ${teamKo(o.team)}`)}</span>
        <div class="opp-bar"><span style="width:${(o.prob / maxOpp * 100).toFixed(1)}%"></span></div>
        <span class="opp-pct">${pct(o.prob)}</span>
      </div>`).join("")
    : `<p class="note">32강 진출 시나리오가 없습니다.</p>`;

  tv.innerHTML = `
    <a class="back" href="#">← 전체 순위로</a>
    <div class="team-hero">
      <div class="hero-flag">${teamFlag(name)}</div>
      <div>
        <h1 class="hero-name">${teamKo(name)} <span class="hero-en">${name}</span></h1>
        <div class="hero-meta">
          ${tp.group}조 · ${tp.confederation} · FIFA ${tp.fifa_rank ?? "-"}위
          · 현재 Elo <b>${tp.current_elo}</b> <span class="${chgCls}">(${chgTxt})</span>
          ${tp.titles ? ` · 우승 ${tp.titles}회` : ""}${tp.best_result ? ` · 최고성적 ${tp.best_result}` : ""}
        </div>
      </div>
      <div class="hero-win">
        <div class="hero-win-pct">${pct(tp.probs.champion)}</div>
        <div class="hero-win-lbl">우승 확률</div>
      </div>
    </div>

    <div class="grid2">
      <div class="card"><h3>🎯 라운드별 진출 확률</h3>${funnel}</div>
      <div class="card"><h3>🥊 32강 예상 상대 Top 5 <span class="hint">32강 진출 시 조건부 확률</span></h3>${opps}</div>
    </div>

    <div class="card">
      <h3>🏅 ${tp.group}조 순위 확률</h3>
      ${posBar(tp.group_pos)}
      ${posLegend()}
      <div class="pos-nums">1위 <b>${pct(tp.group_pos.p1)}</b> · 2위 <b>${pct(tp.group_pos.p2)}</b> · 3위 <b>${pct(tp.group_pos.p3)}</b> · 4위 <b>${pct(tp.group_pos.p4)}</b></div>
      <a class="team-link gp-link" href="#group/${tp.group}">${tp.group}조 전체 현황 보기 →</a>
    </div>

    <div class="card">
      <h3>📋 ${tp.group}조 현재 순위</h3>
      <div class="table-scroll"><table class="gs-table rtable">
        <thead><tr><th>#</th><th>팀</th><th class="num">경기</th><th class="num">승무패</th><th class="num">득실</th><th class="num">차</th><th class="num">승점</th></tr></thead>
        <tbody>${gsRows}</tbody>
      </table></div>
    </div>

    <div class="card">
      <h3>🗓️ 경기 결과 &amp; 향후 일정 <span class="hint">시간은 한국 시간(KST)</span></h3>
      <div class="fx-list">${fx}</div>
    </div>
  `;
}

const ALL_GROUPS = "ABCDEFGHIJKL".split("");
function renderGroupPage(g) {
  const gp = D.group_pages[g];
  const gv = document.getElementById("groupview");
  if (!gp) { gv.innerHTML = `<p>조를 찾을 수 없습니다.</p>`; return; }

  const selector = `<div class="group-nav">` +
    ALL_GROUPS.map((x) => `<a class="gnav ${x === g ? "active" : ""}" href="#group/${x}">${x}</a>`).join("") +
    `</div>`;

  // standings + position probabilities
  const standings = D.group_standings[g] || [];
  const rows = standings.map((r, i) => `<tr>
    <td data-label="순위">${i + 1}</td>
    <td class="cell-team">${teamLink(r.team, `<span class="flag">${teamFlag(r.team)}</span> ${teamKo(r.team)}`)}</td>
    <td class="num" data-label="경기">${r.played}</td>
    <td class="num" data-label="승무패">${r.w}-${r.d}-${r.l}</td>
    <td class="num" data-label="득실">${r.gf}:${r.ga}</td>
    <td class="num" data-label="골득실차">${r.gd > 0 ? "+" : ""}${r.gd}</td>
    <td class="num" data-label="승점"><b>${r.pts}</b></td>
    <td class="num" data-label="Elo">${r.elo}</td>
    <td class="pos-cell cell-full" data-label="순위 확률 (1·2·3·4위)">${posBar(gp.positions[r.team])}</td>
  </tr>`).join("");

  // fixtures
  const fx = gp.fixtures.map((f) => {
    const head = `<span class="gfx-date">${kstDateTime(f)}</span>`;
    const teams = `<span class="gfx-teams">${teamLink(f.team_a, `${teamFlag(f.team_a)} ${teamKo(f.team_a)}`)}
      <b class="gfx-mid">${f.played ? `${f.goals_a} - ${f.goals_b}` : "vs"}</b>
      ${teamLink(f.team_b, `${teamKo(f.team_b)} ${teamFlag(f.team_b)}`)}</span>`;
    let extra = "";
    if (f.played) {
      extra = `<span class="fx-up done">완료</span>`;
    } else {
      const w = f.p_win_a * 100, d = f.p_draw * 100, l = f.p_win_b * 100;
      extra = `<div class="wdl mini">
        <span class="w" style="width:${w}%">${w >= 14 ? w.toFixed(0) : ""}</span>
        <span class="d" style="width:${d}%">${d >= 14 ? d.toFixed(0) : ""}</span>
        <span class="l" style="width:${l}%">${l >= 14 ? l.toFixed(0) : ""}</span>
      </div>`;
    }
    return `<div class="gfx-row ${f.played ? "" : "upcoming"}">${head}${teams}${extra}</div>`;
  }).join("");

  const remaining = gp.fixtures.filter((f) => !f.played).length;

  gv.innerHTML = `
    <a class="back" href="#">← 전체 순위로</a>
    ${selector}
    <div class="team-hero">
      <div class="hero-flag">📊</div>
      <div>
        <h1 class="hero-name">${g}조</h1>
        <div class="hero-meta">${standings.length}개 팀 · 남은 경기 ${remaining}개</div>
      </div>
    </div>

    <div class="card">
      <h3>순위 & 조별 순위 확률 <span class="hint">막대 = 1·2·3·4위 확률</span></h3>
      <div class="table-scroll"><table class="gs-table rtable">
        <thead><tr>
          <th>#</th><th>팀</th><th class="num">경기</th><th class="num">승무패</th>
          <th class="num">득실</th><th class="num">차</th><th class="num">승점</th><th class="num">Elo</th>
          <th>순위 확률 (1·2·3·4위)</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${posLegend()}
    </div>

    <div class="card">
      <h3>🗓️ 전체 일정 &amp; 남은 경기 <span class="hint">한국 시간(KST) · 미진행 경기는 승·무·패 확률</span></h3>
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

// initial
renderStandings();
rendered.standings = true;
route();
