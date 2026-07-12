const LANG = window.APP_LANG || "en";

// 部署完 worker/ 底下的 Cloudflare Worker 後，把印出來的網址貼在這裡。
// 沒填之前，手動刷新按鈕會直接顯示「尚未設定」，不會亂打 request。
const REFRESH_ENDPOINT = "https://skyevent.adam105195.workers.dev";
 // 例如 "https://sky-refresh-trigger.your-subdomain.workers.dev"

// 字幕 CORS 代理：直接用同一個 worker 的 /api/subtitle-proxy 路由，取代 corsproxy.io。
const SUBTITLE_PROXY_ENDPOINT = `${REFRESH_ENDPOINT}/api/subtitle-proxy`;

const UI = {
  tw: {
    title: "光遇 活動 / 影片 資料", hint: "資料每 30 分鐘自動拉取一次，也可以在下方輸入密碼立即刷新。",
    tabs: { schedule: "活動", video: "影片", diff: "差異" },
    filterPlaceholder: "搜尋名稱…", onlyActive: "僅進行中",
    sortModes: { status_alpha: "依狀態（字母排序）", status_time: "依狀態（時間排序）" },
    status: { on: "進行中", up: "未開始", off: "已結束" },
    scheduleHead: ["狀態", "名稱", "開始", "結束", "時長", "倒數"],
    videoHead: ["名稱", "時長", "播放", "字幕", "備註"],
    units: { d: "天", h: "時", m: "分", s: "秒" },
    countdownStart: (t) => `距離開始還有 ${t}`,
    countdownEnd: (t) => `距離結束還有 ${t}`,
    countdownEndedAgo: (t) => `已結束 ${t} 前`,
    countdownOngoing: (t) => `已進行 ${t}`,
    play: "播放", subtitle: "字幕", notesMulti: "多語言", notesWarning: "流量提醒",
    scheduleMeta: (r, total, active) => `伺服器時間 ${r} · 共 ${total.shown} 條 / 總計 ${total.all} · 進行中 ${active}`,
    videoMeta: (shown, all) => `共 ${shown} 條 / 總計 ${all}`,
    updatedAt: (t) => `更新於 ${t}`,
    emptySchedule: (only) => (only ? "沒有進行中的活動" : "暫無符合的活動"),
    emptyVideo: "暫無符合的影片",
    diffTitle: "上次有變化時的差異", diffLoading: "資料每 30 分鐘更新一次，暫無變化紀錄",
    diffHeads: { sAdd: "活動 · 新增", sDel: "活動 · 刪除", vAdd: "影片 · 新增", vDel: "影片 · 刪除" },
    diffEmptyNone: "暫無變化紀錄", diffEmptyAdd: "無新增", diffEmptyDel: "無刪除",
    recordedAt: (t) => `記錄於 ${t}`, unchangedSchedule: "活動資料自上次變化後未再變動",
    unchangedVideo: "影片資料自上次變化後未再變動",
    modalClose: "關閉", cellularWarning: "此影片可能消耗較多流量。", playFail: "播放失敗，請稍後重試。",
    fetchError: (n) => `${n} 讀取失敗`,
    videoLangLabels: { en: "English", zh: "繁體中文", zh_cn: "简体中文", ja: "日本語" },
    subtitleProxyFail: "官方伺服器安全限制，無法載入內建字幕，請改用表格中的「字幕」按鈕另開分頁觀看。",
    refreshPlaceholder: "輸入密碼立即刷新…", refreshButton: "立即刷新",
    refreshTriggering: "觸發中…", refreshSuccess: "已觸發，約 1 分鐘後重新整理頁面即可看到最新資料。",
    refreshWrongPassword: "密碼錯誤。", refreshTooSoon: (s) => `太頻繁了，請 ${s} 秒後再試。`,
    refreshError: "觸發失敗，請稍後再試。", refreshNotConfigured: "尚未設定刷新服務。",longTerm: "長期"
  },
  cn: {
    title: "光遇 活动 / 影片 数据", hint: "数据每 30 分钟自动拉取一次，也可以在下方输入密码立即刷新。",
    tabs: { schedule: "活动", video: "影片", diff: "差异" },
    filterPlaceholder: "搜索名称…", onlyActive: "仅进行中",
    sortModes: { status_alpha: "按状态（字母排序）", status_time: "按状态（时间排序）" },
    status: { on: "进行中", up: "未开始", off: "已结束" },
    scheduleHead: ["状态", "名称", "开始", "结束", "时长", "倒计时"],
    videoHead: ["名称", "时长", "播放", "字幕", "备注"],
    units: { d: "天", h: "时", m: "分", s: "秒" },
    countdownStart: (t) => `距离开始还有 ${t}`,
    countdownEnd: (t) => `距离结束还有 ${t}`,
    countdownEndedAgo: (t) => `已结束 ${t} 前`,
    countdownOngoing: (t) => `已进行 ${t}`,
    play: "播放", subtitle: "字幕", notesMulti: "多语言", notesWarning: "流量提醒",
    scheduleMeta: (r, total, active) => `服务器时间 ${r} · 共 ${total.shown} 条 / 总计 ${total.all} · 进行中 ${active}`,
    videoMeta: (shown, all) => `共 ${shown} 条 / 总计 ${all}`,
    updatedAt: (t) => `更新于 ${t}`,
    emptySchedule: (only) => (only ? "没有进行中的活动" : "暂无匹配的活动"),
    emptyVideo: "暂无匹配的影片",
    diffTitle: "上次有变化时的差异", diffLoading: "数据每 30 分钟更新一次，暂无变化记录",
    diffHeads: { sAdd: "活动 · 新增", sDel: "活动 · 删除", vAdd: "影片 · 新增", vDel: "影片 · 删除" },
    diffEmptyNone: "暂无变化记录", diffEmptyAdd: "无新增", diffEmptyDel: "无删除",
    recordedAt: (t) => `记录于 ${t}`, unchangedSchedule: "活动数据自上次变化后未再变动",
    unchangedVideo: "影片数据自上次变化后未再变动",
    modalClose: "关闭", cellularWarning: "此影片可能消耗较多流量。", playFail: "播放失败，请稍后重试。",
    fetchError: (n) => `${n} 读取失败`,
    videoLangLabels: { en: "English", zh: "简体中文", zh_cn: "简体中文", ja: "日本語" },
    subtitleProxyFail: "官方服务器安全限制，无法加载内建字幕，请改用表格中的「字幕」按钮另开分页观看。",
    refreshPlaceholder: "输入密码立即刷新…", refreshButton: "立即刷新",
    refreshTriggering: "触发中…", refreshSuccess: "已触发，约 1 分钟后重新整理页面即可看到最新数据。",
    refreshWrongPassword: "密码错误。", refreshTooSoon: (s) => `太频繁了，请 ${s} 秒后再试。`,
    refreshError: "触发失败，请稍后再试。", refreshNotConfigured: "尚未设定刷新服务。",longTerm: "长期"
  },
  en: {
    title: "Sky: CotL — Events & Videos", hint: "Data refreshes automatically every 30 minutes, or enter the password below to refresh immediately.",
    tabs: { schedule: "Events", video: "Videos", diff: "Changes" },
    filterPlaceholder: "Search…", onlyActive: "Active only",
    sortModes: { status_alpha: "By status (A–Z)", status_time: "By status (soonest first)" },
    status: { on: "Active", up: "Upcoming", off: "Ended" },
    scheduleHead: ["Status", "Name", "Start", "End", "Duration", "Countdown"],
    videoHead: ["Name", "Duration", "Play", "Subtitles", "Notes"],
    units: { d: "d", h: "h", m: "m", s: "s" },
    countdownStart: (t) => `Starts in ${t}`,
    countdownEnd: (t) => `Ends in ${t}`,
    countdownEndedAgo: (t) => `Ended ${t} ago`,
    countdownOngoing: (t) => `Ongoing for ${t}`,
    play: "Play", subtitle: "Subtitles", notesMulti: "Multi-language", notesWarning: "Data warning",
    scheduleMeta: (r, total, active) => `Server time ${r} · showing ${total.shown} / ${total.all} · active ${active}`,
    videoMeta: (shown, all) => `showing ${shown} / ${all}`,
    updatedAt: (t) => `Updated ${t}`,
    emptySchedule: (only) => (only ? "No active events" : "No matching events"),
    emptyVideo: "No matching videos",
    diffTitle: "Changes since last update", diffLoading: "Data refreshes every 30 minutes; no recorded change yet",
    diffHeads: { sAdd: "Events · Added", sDel: "Events · Removed", vAdd: "Videos · Added", vDel: "Videos · Removed" },
    diffEmptyNone: "No recorded change", diffEmptyAdd: "Nothing added", diffEmptyDel: "Nothing removed",
    recordedAt: (t) => `Recorded ${t}`, unchangedSchedule: "No further event changes since last recorded diff",
    unchangedVideo: "No further video changes since last recorded diff",
    modalClose: "Close", cellularWarning: "This video may use a lot of data.", playFail: "Playback failed, please retry.",
    fetchError: (n) => `Failed to load ${n}`,
    videoLangLabels: { en: "English", zh: "Traditional Chinese", zh_cn: "Simplified Chinese", ja: "Japanese" },
    subtitleProxyFail: "Built-in subtitles are blocked by the source server. Use the \"Subtitles\" button in the table to open them in a new tab instead.",
    refreshPlaceholder: "Enter password to refresh now…", refreshButton: "Refresh now",
    refreshTriggering: "Triggering…", refreshSuccess: "Triggered — reload this page in about a minute to see the new data.",
    refreshWrongPassword: "Wrong password.", refreshTooSoon: (s) => `Too soon, try again in ${s}s.`,
    refreshError: "Failed to trigger, please try again later.", refreshNotConfigured: "Refresh service not configured yet.",longTerm: "Long term"
  },
};

const T = UI[LANG] || UI.en;

// 快速篩選 chips：點一下直接帶入關鍵字，不用手打。關鍵字比對「原始英文代碼」，跟語言無關。
const QUICK_FILTERS = {
  schedule: {
    tw: [["蠟燭", "candle"], ["任務", "quest"], ["收集先祖", "collectible"], ["兌換樹", "visit"], ["社交", "social"], ["季節", "season"]],
    cn: [["蜡烛", "candle"], ["任务", "quest"], ["收集先祖", "collectible"], ["兌換樹", "visit"], ["社交", "social"], ["季节", "season"]],
    en: [["Candles", "candle"], ["Quests", "quest"], ["Collect spirit", "collectible"], ["Spirit tree", "visit"], ["Social", "social"], ["Seasons", "season"]],
  },
  video: {
    tw: [["公告", "announce"], ["季節", "season"], ["活動", "event"]],
    cn: [["公告", "announce"], ["季节", "season"], ["活动", "event"]],
    en: [["Announcements", "announce"], ["Seasons", "season"], ["Events", "event"]],
  },
};

let tab = "schedule";
let scheduleData = null, videoData = null, diffData = null;
let scheduleMeta = null, videoMeta = null;

const $ = (id) => document.getElementById(id);
const esc = (t) => (t == null ? "" : String(t)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const setMsg = (t) => { $("msg").textContent = t || ""; };
const nameFor = (r) => (r.label ? (r.label[LANG] || r.label.en || r.name) : r.name);

async function fetchJson(name) {
  const r = await fetch(`../data/${name}.json?_=${Date.now()}`);
  if (!r.ok) throw new Error(T.fetchError(name));
  return r.json();
}

function matchQ(displayName, rawName) {
  const q = $("filterQ").value.trim().toLowerCase();
  if (!q) return true;
  return (displayName || "").toLowerCase().includes(q) || (rawName || "").toLowerCase().includes(q);
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

// 所有 *_fmt 時間字串後端都是用 +08:00 格式化的，補上 offset 就能丟給 Date 解析成正確的絕對時刻。
const FMT_DATE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
function parseFmtDate(str) {
  if (!FMT_DATE_RE.test(str || "")) return null; // 例如 "长期" 這種非日期字串
  return new Date(str.replace(" ", "T") + "+08:00");
}

function fmtDuration(ms) {
  const u = T.units;
  let s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  const parts = [];
  if (d) parts.push(`${d}${u.d}`);
  if (d || h) parts.push(`${h}${u.h}`);
  if (d || h || m) parts.push(`${m}${u.m}`);
  parts.push(`${s}${u.s}`);
  return parts.join(" ");
}

function statusTagHtml(active, upcoming) {
  return active ? `<span class="tag on">${T.status.on}</span>`
    : (upcoming ? `<span class="tag up">${T.status.up}</span>` : `<span class="tag off">${T.status.off}</span>`);
}

// 排序：先分「未開始 → 進行中 → 已結束」三個分組（即需求 1/2/3），
// 分組內部再依使用者選的排序方式決定用字母還是時間排（需求 4/5）。
function statusRank(r) {
  return r.upcoming ? 0 : (r.active ? 1 : 2);
}

function sortRows(rows, mode) {
  const arr = rows.slice();
  const collator = (a, b) => nameFor(a).localeCompare(nameFor(b), LANG === "en" ? "en" : "zh-Hant");

  arr.sort((a, b) => {
    const ra = statusRank(a), rb = statusRank(b);
    if (ra !== rb) return ra - rb; // 分組順序永遠是 未開始 → 進行中 → 已結束，不受排序方式影響

    if (mode === "status_time") {
      if (ra === 0) { // 未開始：越快開始的越上面
        return (parseFmtDate(a.start)?.getTime() ?? 0) - (parseFmtDate(b.start)?.getTime() ?? 0);
      }
      if (ra === 1) { // 進行中：越快結束的越上面（長期活動沒有結束時間，排到最後）
        const ea = parseFmtDate(a.end)?.getTime() ?? Infinity;
        const eb = parseFmtDate(b.end)?.getTime() ?? Infinity;
        return ea - eb;
      }
      // 已結束：越晚結束（越新結束）的越上面
      const ea = parseFmtDate(a.end)?.getTime() ?? 0;
      const eb = parseFmtDate(b.end)?.getTime() ?? 0;
      return eb - ea;
    }
    return collator(a, b); // status_alpha（預設）：同分組內按字母排序，不用 json 原本順序
  });
  return arr;
}

function renderSchedule() {
  const body = $("scheduleBody");
  body.innerHTML = "";
  if (!scheduleData) return;
  const onlyActive = $("onlyActive").checked;
  const sortMode = $("sortMode")?.value || "status_alpha";
  let rows = (scheduleData.events || []).filter(r => (!onlyActive || r.active) && matchQ(nameFor(r), r.name));
  rows = sortRows(rows, sortMode);
  if (!rows.length) {
    showEmpty("scheduleBody", T.emptySchedule(onlyActive));
  } else {
    hideEmpty("scheduleBody");
    rows.forEach(r => {
      const tag = statusTagHtml(r.active, r.upcoming);
      const tr = document.createElement("tr");
      tr.dataset.start = r.start;
      tr.dataset.end = r.end;
      tr.innerHTML = buildCells(T.scheduleHead,
        [tag, esc(nameFor(r)), esc(r.start), esc(r.end),esc(formatDuration(r)), ""],
        ["", "name-cell", "", "", "", "countdown-cell"]);
      body.appendChild(tr);
    });
  }
  let meta = T.scheduleMeta(scheduleData.server_time_fmt || "-", { shown: rows.length, all: scheduleData.total || 0 }, scheduleData.active_count || 0);
  if (scheduleMeta?.fetched_at_fmt) meta += ` · ${T.updatedAt(scheduleMeta.fetched_at_fmt)}`;
  $("dataMeta").textContent = meta;
  updateLiveSchedule(); // 立刻算一次，不用等下一個整秒的 tick
}

function formatDurationLabel(minutes) {
  if (minutes == null) return T.longTerm;

  minutes = Number(minutes);

  let total = minutes;

  const y = Math.floor(total / (365 * 24 * 60));
  total %= 365 * 24 * 60;

  const d = Math.floor(total / (24 * 60));
  total %= 24 * 60;

  const h = Math.floor(total / 60);
  const m = total % 60;

  const unit = {
    tw: { h:"小時", m:"分鐘", d:"天", y:"年" },
    cn: { h:"小时", m:"分钟", d:"天", y:"年" },
    en: { h:"h", m:"min", d:"d", y:"y" }
  }[LANG] || { h:"h", m:"min", d:"d", y:"y" };

  const parts = [];

  if (y) parts.push(`${y} ${unit.y}`);
  if (d) parts.push(`${d} ${unit.d}`);
  if (h) parts.push(`${h} ${unit.h}`);
  if (m) parts.push(`${m} ${unit.m}`);

  return parts.join(" ") || `0 ${unit.m}`;
}

function formatDuration(r) {
  if (r.duration_label === 99999999) {
    return T.longTerm;
  }
  return formatDurationLabel(r.duration_minutes);
}

// 每秒重算一次「現在」跟每列 start/end 的差距，狀態跟倒數都以瀏覽器當下時間為準，
// 不用等下一次 30 分鐘的資料拉取，秒數也會精準跳動。
function updateLiveSchedule() {
  if (tab !== "schedule") return;
  const now = Date.now();
  $("scheduleBody").querySelectorAll("tr").forEach(tr => {
    const start = parseFmtDate(tr.dataset.start);
    const end = parseFmtDate(tr.dataset.end);
    const statusCell = tr.children[0];
    const countCell = tr.children[5];
    if (!statusCell || !countCell) return;

    if (start && now < start.getTime()) {
      statusCell.innerHTML = statusTagHtml(false, true);
      countCell.textContent = T.countdownStart(fmtDuration(start.getTime() - now));
    } else if (end && now < end.getTime()) {
      statusCell.innerHTML = statusTagHtml(true, false);
      countCell.textContent = T.countdownEnd(fmtDuration(end.getTime() - now));
    } else if (end) {
      statusCell.innerHTML = statusTagHtml(false, false);
      countCell.textContent = T.countdownEndedAgo(fmtDuration(now - end.getTime()));
    } else if (start) {
      // 長期活動（沒有結束時間）：顯示已經進行多久
      statusCell.innerHTML = statusTagHtml(true, false);
      countCell.textContent = T.countdownOngoing(fmtDuration(now - start.getTime()));
    } else {
      countCell.textContent = "";
    }
  });
}

let activeHls = null;
let currentVideoRow = null;   // 目前播放中的影片，供切換字幕語言時重新載入用
let subtitleRequestId = 0;    // 請求版本號：只有「最新一次」的字幕請求回來時才真的套用，避免快速切語言時字幕選錯

function destroyPlayer() {
  const v = $("videoPlayer");
  if (activeHls) { activeHls.destroy(); activeHls = null; }
  v.pause(); v.removeAttribute("src"); v.innerHTML = ""; v.load();
}

function closePlayer() {
  destroyPlayer();
  currentVideoRow = null;
  subtitleRequestId++; // 讓還在飛行中的字幕請求失效
  $("videoModal").classList.add("hidden");
  $("videoModal").setAttribute("aria-hidden", "true");
  $("videoModalHint").textContent = "";
  document.body.style.overflow = "";
}

// 點擊「播放」按鈕的入口：先決定語言選單要不要顯示、預設語言是什麼，再真正播放
function openPlayer(row) {
  if (!row.playback_url) return;
  currentVideoRow = row;

  const langSelect = $("videoLangSelect");
  if (langSelect) {
    if (row.has_translations) {
      langSelect.classList.remove("hidden");
      langSelect.value = LANG === "en" ? "en" : "zh";
    } else {
      langSelect.classList.add("hidden");
      langSelect.value = "en";
    }
    playVideoWithLang(row, langSelect.value);
  } else {
    playVideoWithLang(row, "en");
  }
}

// 字幕檔名規則：官方在檔名前面加上 "[語言代碼] " 前綴來切換語言，
// 例如 "SCA26_Show_P1.vtt" -> "[cmn-Hant-TW] SCA26_Show_P1.vtt"（繁中）
// 或 "[en] SCA26_Show_P1.vtt"（英文）。這裡統一處理「加前綴 / 換前綴」，
// 不再假設檔名一定含有 "_EN_" 這種舊格式。
const SUBTITLE_LANG_PREFIX = {
  en: "[en] ",
  zh: "[cmn-Hant-TW] ",
  zh_cn: "[cmn-Hans-CN] ",
  ja: "[ja] "
};

function buildSubtitleUrl(baseUrl, langCode) {
  if (!baseUrl) return baseUrl;
  const idx = baseUrl.lastIndexOf("/");
  if (idx === -1) return baseUrl;
  const dir = baseUrl.slice(0, idx + 1);
  const rawFilename = baseUrl.slice(idx + 1);

  let filename;
  try {
    filename = decodeURIComponent(rawFilename);
  } catch {
    filename = rawFilename; // 萬一不是合法的百分比編碼，就照原樣處理
  }

  // 先把既有的 "[xxx] " 語言前綴拿掉，避免疊加變成 "[en] [cmn-Hant-TW] xxx.vtt"
  filename = filename.replace(/^\[[^\]]+\]\s*/, "");

  const prefix = SUBTITLE_LANG_PREFIX[langCode] || "";
  return dir + encodeURIComponent(prefix + filename);
}

// 實際載入影片本體 + 依語言載入字幕（透過自架的 subtitle-proxy worker route）
function playVideoWithLang(row, langCode) {
  destroyPlayer();
  $("videoModalTitle").textContent = row.name || T.play;
  $("videoModal").classList.remove("hidden");
  $("videoModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("videoModalHint").textContent = row.cellular_data_warning ? T.cellularWarning : "";

  const video = $("videoPlayer");
  const finalVideoUrl = row.playback_url;

  // 字幕網址規則：官方檔名前綴（見 buildSubtitleUrl），不保證每部影片都真的存在該語言字幕檔
  let finalSubUrl = row.subtitle_url || row.subtitle_base;
  if (finalSubUrl && row.has_translations) {
    finalSubUrl = buildSubtitleUrl(finalSubUrl, langCode);
  }

  const requestId = ++subtitleRequestId;

  if (finalSubUrl) {
    // 走自架 worker 的 /api/subtitle-proxy 路由，不再依賴 corsproxy.io 這種公開第三方代理，
    // 這裡只做「盡量顯示」，失敗時會退回提示使用者改用另開分頁的字幕按鈕。
    const proxyUrl = `${SUBTITLE_PROXY_ENDPOINT}?url=${encodeURIComponent(finalSubUrl)}`;
    fetch(proxyUrl)
      .then(r => { if (!r.ok) throw new Error("subtitle proxy failed"); return r.text(); })
      .then(vttText => {
        if (requestId !== subtitleRequestId) return; // 使用者已切換語言或關閉視窗，這個結果過期了，不套用
        const blob = new Blob([vttText], { type: "text/vtt" });
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.label = T.videoLangLabels[langCode] || langCode;
        track.srclang = langCode;
        track.src = URL.createObjectURL(blob);
        track.default = true;
        video.appendChild(track);
      })
      .catch(() => {
        if (requestId !== subtitleRequestId) return;
        $("videoModalHint").textContent = T.subtitleProxyFail;
      });
  }

  if (!finalVideoUrl) return;
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = finalVideoUrl;
    video.play().catch(() => {});
  } else if (window.Hls?.isSupported()) {
    activeHls = new Hls();
    activeHls.loadSource(finalVideoUrl);
    activeHls.attachMedia(video);
    activeHls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    activeHls.on(Hls.Events.ERROR, (_, d) => { if (d?.fatal) $("videoModalHint").textContent = T.playFail; });
  } else {
    window.open(finalVideoUrl, "_blank", "noopener");
  }
}

function renderVideos() {
  const body = $("videoBody");
  body.innerHTML = "";
  if (!videoData) return;
  let rows = (videoData.videos || []).filter(r => matchQ(r.name, r.name));
  if (!rows.length) {
    showEmpty("videoBody", T.emptyVideo);
  } else {
    hideEmpty("videoBody");
    rows.forEach((r, idx) => {
      const playback = r.has_playback ? `<button type="button" class="btn-link" data-play="${idx}">${T.play}</button>` : "-";
      const sub = r.has_subtitle ? `<button type="button" class="btn-link" data-sub="${idx}">${T.subtitle}</button>` : "-";
      const notes = [r.has_translations && T.notesMulti, r.cellular_data_warning && T.notesWarning].filter(Boolean);
      const tr = document.createElement("tr");
      tr.innerHTML = buildCells(T.videoHead,
        [esc(r.name), esc(r.duration_fmt), playback, sub, esc(notes.join("、") || "-")],
        ["name-cell", "", "action-cell", "action-cell", ""]);
      body.appendChild(tr);
    });
  }
  body.querySelectorAll("[data-play]").forEach(btn =>
    btn.onclick = () => openPlayer(rows[+btn.dataset.play]));
  body.querySelectorAll("[data-sub]").forEach(btn =>
    btn.onclick = () => { const row = rows[+btn.dataset.sub]; const url = row?.subtitle_url || row?.subtitle_base; if (url) window.open(url, "_blank", "noopener"); });

  let meta = T.videoMeta(rows.length, videoData.total || 0);
  if (videoMeta?.fetched_at_fmt) meta += ` · ${T.updatedAt(videoMeta.fetched_at_fmt)}`;
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
  items.forEach(item => {
    const li = document.createElement("li");
    const label = item.label ? (item.label[LANG] || item.label.en || item.name) : item.name;
    const timeParts = [item.start, item.end].filter(Boolean).join(" → ");
    const extra = [timeParts, item.duration_label || item.duration_fmt].filter(Boolean).join(" · ");
    li.innerHTML = `<div class="diff-name">${esc(label)}</div>` + (extra ? `<div class="diff-time">${esc(extra)}</div>` : "");
    ul.appendChild(li);
  });
}

function renderDiff() {
  $("dataMeta").textContent = T.diffTitle;
  const schedule = diffData?.event_schedule || {};
  const video = diffData?.video_defs || {};
  const parts = [];
  if (schedule.recorded_at_fmt) parts.push(`${T.diffHeads.sAdd.split(" ")[0]}: ${T.recordedAt(schedule.recorded_at_fmt)}`);
  if (video.recorded_at_fmt) parts.push(`${T.diffHeads.vAdd.split(" ")[0]}: ${T.recordedAt(video.recorded_at_fmt)}`);
  const stale = [];
  if (schedule.unchanged_since_last_change) stale.push(T.unchangedSchedule);
  if (video.unchanged_since_last_change) stale.push(T.unchangedVideo);
  $("diffMeta").textContent = [parts.join(" · ") || T.diffLoading, ...stale].join(" · ");

  renderDiffList("diffScheduleAdded", schedule.added, schedule.has_recorded_diff ? T.diffEmptyAdd : T.diffEmptyNone);
  renderDiffList("diffScheduleRemoved", schedule.removed, schedule.has_recorded_diff ? T.diffEmptyDel : T.diffEmptyNone);
  renderDiffList("diffVideoAdded", video.added, video.has_recorded_diff ? T.diffEmptyAdd : T.diffEmptyNone);
  renderDiffList("diffVideoRemoved", video.removed, video.has_recorded_diff ? T.diffEmptyDel : T.diffEmptyNone);
}

function renderQuickFilters(kind) {
  const el = $(kind === "schedule" ? "quickFiltersSchedule" : "quickFiltersVideo");
  if (!el) return;
  const list = QUICK_FILTERS[kind][LANG] || [];
  el.innerHTML = list.map(([label, kw]) =>
    `<button type="button" class="chip" data-kw="${esc(kw)}">${esc(label)}</button>`).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      const kw = btn.dataset.kw;
      const turningOn = $("filterQ").value.trim().toLowerCase() !== kw;
      $("filterQ").value = turningOn ? kw : "";
      el.querySelectorAll("button").forEach(b => b.classList.toggle("active-chip", turningOn && b === btn));
      renderTable();
    };
  });
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
  $("quickFiltersSchedule").classList.toggle("hidden", name !== "schedule");
  $("quickFiltersVideo").classList.toggle("hidden", name !== "video");
  renderTable();
}

function applyStaticText() {
  document.title = T.title;
  $("pageTitle").textContent = T.title;
  $("hint").textContent = T.hint;
  $("tabSchedule").textContent = T.tabs.schedule;
  $("tabVideo").textContent = T.tabs.video;
  $("tabDiff").textContent = T.tabs.diff;
  $("filterQ").placeholder = T.filterPlaceholder;
  $("onlyActiveLabel").textContent = T.onlyActive;
  $("diffScheduleAddedH").textContent = T.diffHeads.sAdd;
  $("diffScheduleRemovedH").textContent = T.diffHeads.sDel;
  $("diffVideoAddedH").textContent = T.diffHeads.vAdd;
  $("diffVideoRemovedH").textContent = T.diffHeads.vDel;
  $("videoModalClose").textContent = T.modalClose;
  const sortModeEl = $("sortMode");
  if (sortModeEl) {
    sortModeEl.querySelectorAll("option").forEach(opt => {
      if (T.sortModes[opt.value]) opt.textContent = T.sortModes[opt.value];
    });
  }
  T.scheduleHead.forEach((t, i) => { const el = $(`schHead${i}`); if (el) el.textContent = t; });
  T.videoHead.forEach((t, i) => { const el = $(`vidHead${i}`); if (el) el.textContent = t; });
  const langSelect = $("videoLangSelect");
  if (langSelect) {
    langSelect.querySelectorAll("option").forEach(opt => {
      if (T.videoLangLabels[opt.value]) opt.textContent = T.videoLangLabels[opt.value];
    });
  }
  if ($("refreshPassword")) $("refreshPassword").placeholder = T.refreshPlaceholder;
  if ($("refreshBtn")) $("refreshBtn").textContent = T.refreshButton;
}

// 密碼比對通過 → 呼叫 Cloudflare Worker → Worker 再去戳 GitHub Actions 的 workflow_dispatch，
// 立刻執行一次 fetch_and_build.py，不用等下一次 30 分鐘的 cron。
async function triggerRefresh() {
  const statusEl = $("refreshStatus");
  const pwd = $("refreshPassword").value;
  if (!REFRESH_ENDPOINT) {
    statusEl.textContent = T.refreshNotConfigured;
    return;
  }
  if (!pwd) return;

  statusEl.textContent = T.refreshTriggering;
  $("refreshBtn").disabled = true;
  try {
    const r = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.ok) {
      statusEl.textContent = T.refreshSuccess;
      $("refreshPassword").value = "";
    } else if (r.status === 401) {
      statusEl.textContent = T.refreshWrongPassword;
    } else if (r.status === 429) {
      statusEl.textContent = T.refreshTooSoon(data.retry_after ?? "?");
    } else {
      statusEl.textContent = T.refreshError;
    }
  } catch {
    statusEl.textContent = T.refreshError;
  } finally {
    $("refreshBtn").disabled = false;
  }
}

async function loadAll() {
  setMsg("…");
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
    if (scheduleMeta?.fetched_at_fmt) parts.push(T.updatedAt(scheduleMeta.fetched_at_fmt));
    $("fetchMeta").textContent = parts.join(" · ");
  } catch (e) {
    setMsg(e.message);
  }
}

applyStaticText();
renderQuickFilters("schedule");
renderQuickFilters("video");
$("quickFiltersVideo").classList.add("hidden");
$("tabSchedule").onclick = () => setTab("schedule");
$("tabVideo").onclick = () => setTab("video");
$("tabDiff").onclick = () => setTab("diff");
$("filterQ").oninput = () => renderTable();
$("onlyActive").onchange = () => renderTable();
$("sortMode")?.addEventListener("change", () => renderTable());
$("videoModalClose").onclick = closePlayer;
$("videoModal").onclick = (e) => { if (e.target.id === "videoModal") closePlayer(); };
$("videoLangSelect")?.addEventListener("change", (e) => {
  if (currentVideoRow) playVideoWithLang(currentVideoRow, e.target.value);
});
$("refreshBtn")?.addEventListener("click", triggerRefresh);
$("refreshPassword")?.addEventListener("keydown", (e) => { if (e.key === "Enter") triggerRefresh(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePlayer(); });

loadAll();
// 資料每 30 分鐘由 GitHub Actions 更新一次，這裡每 5 分鐘自動重抓一次靜態 json，
// 使用者不用手動重新整理分頁就能看到最新結果。
setInterval(loadAll, 5 * 60 * 1000);
// 倒數計時每秒跳動一次，只更新文字內容，不重繪整個表格（不會跳動捲軸位置）。
setInterval(updateLiveSchedule, 1000);