let tab = "schedule";
let scheduleData = null, videoData = null, diffData = null;
let scheduleMeta = null, videoMeta = null;

const $ = (id) => document.getElementById(id);
const esc = (t) => (t == null ? "" : String(t)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const setMsg = (t) => { $("msg").textContent = t || ""; };

async function fetchJson(name) {
  const r = await fetch(`data/${name}.json?_=${Date.now()}`);
  if (!r.ok) throw new Error(`${name} 读取失败`);
  return r.json();
}

function matchQ(name) {
  const q = $("filterQ").value.trim().toLowerCase();
  return !q || (name || "").toLowerCase().includes(q);
}

function buildCells(labels, htmlCells, cls) {
  return labels.map((label, i) =>
    `<td data-label="${esc(label)}"${cls[i] ? ` class="${cls[i]}"` : ""}>${htmlCells[i]}</td>`
  ).join("");
}

function showEmpty(tbodyId, text) {
  const wrap = $(tbodyId).closest(".table-wrap");
  let empty = wrap.querySelector(".empty-table");
  if (!empty) { empty = document.createElement("div"); empty.className = "empty-table"; wrap.appendChild(empty); }
  empty.textContent = text;
  empty.classList.remove("hidden");
  $(tbodyId).closest("table").classList.add("hidden");
}

function hideEmpty(tbodyId) {
  const wrap = $(tbodyId).closest(".table-wrap");
  const empty = wrap.querySelector(".empty-table");
  if (empty) empty.classList.add("hidden");
  $(tbodyId).closest("table").classList.remove("hidden");
}

function renderSchedule() {
  const body = $("scheduleBody");
  body.innerHTML = "";
  if (!scheduleData) return;
  const onlyActive = $("onlyActive").checked;
  let rows = (scheduleData.events || []).filter(r => (!onlyActive || r.active) && matchQ(r.name));
  if (!rows.length) {
    showEmpty("scheduleBody", onlyActive ? "没有进行中的活动" : "暂无匹配的活动");
  } else {
    hideEmpty("scheduleBody");
    rows.forEach(r => {
      const tag = r.active ? '<span class="tag on">进行中</span>'
        : (r.upcoming ? '<span class="tag up">未开始</span>' : '<span class="tag off">已结束</span>');
      const tr = document.createElement("tr");
      tr.innerHTML = buildCells(
        ["状态", "名称", "开始", "结束", "时长"],
        [tag, esc(r.name), esc(r.start), esc(r.end), esc(r.duration_label)],
        ["", "name-cell", "", "", ""]);
      body.appendChild(tr);
    });
  }
  let meta = `服务器时间 ${scheduleData.server_time_fmt || "-"} · 共 ${rows.length} 条 / 总计 ${scheduleData.total || 0} · 进行中 ${scheduleData.active_count || 0}`;
  if (scheduleMeta?.fetched_at_fmt) meta += ` · 更新于 ${scheduleMeta.fetched_at_fmt}`;
  $("dataMeta").textContent = meta;
}

let activeHls = null;

function destroyPlayer() {
  const v = $("videoPlayer");
  if (activeHls) { activeHls.destroy(); activeHls = null; }
  v.pause(); v.removeAttribute("src"); v.load();
}

function closePlayer() {
  destroyPlayer();
  $("videoModal").classList.add("hidden");
  $("videoModal").setAttribute("aria-hidden", "true");
  $("videoModalHint").textContent = "";
  document.body.style.overflow = "";
}

function openPlayer(row) {
  if (!row.playback_url) return;
  destroyPlayer();
  $("videoModalTitle").textContent = row.name || "播放";
  $("videoModal").classList.remove("hidden");
  $("videoModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("videoModalHint").textContent = row.cellular_data_warning ? "该影片可能消耗较多流量。" : "";

  const video = $("videoPlayer");
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = row.playback_url;
    video.play().catch(() => {});
  } else if (window.Hls?.isSupported()) {
    activeHls = new Hls();
    activeHls.loadSource(row.playback_url);
    activeHls.attachMedia(video);
    activeHls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    activeHls.on(Hls.Events.ERROR, (_, d) => { if (d?.fatal) $("videoModalHint").textContent = "播放失败，请稍后重试。"; });
  } else {
    window.open(row.playback_url, "_blank", "noopener");
  }
}

function renderVideos() {
  const body = $("videoBody");
  body.innerHTML = "";
  if (!videoData) return;
  let rows = (videoData.videos || []).filter(r => matchQ(r.name));
  if (!rows.length) {
    showEmpty("videoBody", "暂无匹配的影片");
  } else {
    hideEmpty("videoBody");
    rows.forEach((r, idx) => {
      const playback = r.has_playback ? `<button type="button" class="btn-link" data-play="${idx}">播放</button>` : "-";
      const sub = r.has_subtitle ? `<button type="button" class="btn-link" data-sub="${idx}">字幕</button>` : "-";
      const notes = [r.has_translations && "多语言", r.cellular_data_warning && "流量提醒"].filter(Boolean);
      const tr = document.createElement("tr");
      tr.innerHTML = buildCells(
        ["名称", "时长", "播放", "字幕", "备注"],
        [esc(r.name), esc(r.duration_fmt), playback, sub, esc(notes.join("、") || "-")],
        ["name-cell", "", "action-cell", "action-cell", ""]);
      body.appendChild(tr);
    });
  }
  body.querySelectorAll("[data-play]").forEach(btn =>
    btn.onclick = () => openPlayer(rows[+btn.dataset.play]));
  body.querySelectorAll("[data-sub]").forEach(btn =>
    btn.onclick = () => { const row = rows[+btn.dataset.sub]; if (row?.subtitle_url) window.open(row.subtitle_url, "_blank", "noopener"); });

  let meta = `共 ${rows.length} 条 / 总计 ${videoData.total || 0}`;
  if (videoMeta?.fetched_at_fmt) meta += ` · 更新于 ${videoMeta.fetched_at_fmt}`;
  $("dataMeta").textContent = meta;
}

function renderDiffList(id, items, emptyText) {
  const ul = $(id);
  ul.innerHTML = "";
  if (!items?.length) {
    const li = document.createElement("li");
    li.className = "empty"; li.textContent = emptyText;
    ul.appendChild(li);
    return;
  }
  items.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    ul.appendChild(li);
  });
}

function renderDiff() {
  $("dataMeta").textContent = "上次有变化时的差异（按名称）";
  const schedule = diffData?.event_schedule || {};
  const video = diffData?.video_defs || {};
  const parts = [];
  if (schedule.recorded_at_fmt) parts.push(`活动变化记录于 ${schedule.recorded_at_fmt}`);
  if (video.recorded_at_fmt) parts.push(`影片变化记录于 ${video.recorded_at_fmt}`);
  const stale = [];
  if (schedule.unchanged_since_last_change) stale.push("活动数据自上次变化后未再变动");
  if (video.unchanged_since_last_change) stale.push("影片数据自上次变化后未再变动");
  $("diffMeta").textContent = [parts.join(" · ") || "暂无变化记录", ...stale].join(" · ");

  renderDiffList("diffScheduleAdded", schedule.added, schedule.has_recorded_diff ? "无新增" : "暂无变化记录");
  renderDiffList("diffScheduleRemoved", schedule.removed, schedule.has_recorded_diff ? "无删除" : "暂无变化记录");
  renderDiffList("diffVideoAdded", video.added, video.has_recorded_diff ? "无新增" : "暂无变化记录");
  renderDiffList("diffVideoRemoved", video.removed, video.has_recorded_diff ? "无删除" : "暂无变化记录");
}

function renderTable() {
  if (tab === "schedule") renderSchedule();
  else if (tab === "video") renderVideos();
  else renderDiff();
}

function setTab(name) {
  tab = name;
  ["Schedule", "Video", "Diff"].forEach(n =>
    $(`tab${n}`).classList.toggle("active-tab", n.toLowerCase() === name));
  ["panelSchedule", "panelVideo", "panelDiff"].forEach(id =>
    $(id).classList.toggle("hidden", id !== `panel${name[0].toUpperCase()}${name.slice(1)}`));
  $("onlyActive").parentElement.style.display = name === "schedule" ? "" : "none";
  $("filterQ").parentElement.style.display = name === "diff" ? "none" : "";
  renderTable();
}

async function loadAll() {
  setMsg("加载数据…");
  try {
    const [sched, vids, diff] = await Promise.all([
      fetchJson("schedule"), fetchJson("video"), fetchJson("diff"),
    ]);
    scheduleData = sched.data; scheduleMeta = sched.meta;
    videoData = vids.data; videoMeta = vids.meta;
    diffData = diff.diff;
    setMsg("");
    renderTable();

    const parts = [];
    if (scheduleMeta?.fetched_at_fmt) parts.push(`活动数据更新于 ${scheduleMeta.fetched_at_fmt}`);
    if (videoMeta?.fetched_at_fmt) parts.push(`影片数据更新于 ${videoMeta.fetched_at_fmt}`);
    $("fetchMeta").textContent = parts.join(" · ");
  } catch (e) {
    setMsg(e.message);
  }
}

$("tabSchedule").onclick = () => setTab("schedule");
$("tabVideo").onclick = () => setTab("video");
$("tabDiff").onclick = () => setTab("diff");
$("filterQ").oninput = () => renderTable();
$("onlyActive").onchange = () => renderTable();
$("videoModalClose").onclick = closePlayer;
$("videoModal").onclick = (e) => { if (e.target.id === "videoModal") closePlayer(); };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePlayer(); });

loadAll();
