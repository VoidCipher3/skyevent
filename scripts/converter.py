"""
把伺服器回傳的原始格式（2.log 樣式）轉成前端要用的整理後格式（1.log 樣式）。

設計重點：
- convert_schedule() / convert_videos() 回傳「完整版」，內部仍保留 epoch（*_ts）方便計算
  active/upcoming 以及給差异比对挑選代表時段用。
- public_schedule() 把 epoch 數字砍掉，只留下格式化後的時間字串，
  用來寫進最終要 commit 的 json，藉此縮減檔案大小、避免暴露沒意義的原始時間戳。
- 活動名稱可帶入 name_map（來自 translate.load_event_name_map()）產生 {tw,cn,en} label，
  找不到翻譯就整包用原始 name 頂替，不會因為沒翻到就整個爛掉。
"""
from datetime import datetime, timezone, timedelta

from translate import label_for

TZ8 = timezone(timedelta(hours=8))
LONG_TERM = 99999999


def fmt_ts(ts: int) -> str:
    return datetime.fromtimestamp(ts, TZ8).strftime("%Y-%m-%d %H:%M:%S")


def convert_schedule(raw: dict, name_map: dict | None = None) -> dict:
    name_map = name_map or {}
    server_time = raw.get("server_time", 0)
    valid_until = raw.get("valid_until", 0)
    base_time = raw.get("base_time", 0)

    events = []
    for e in raw.get("events", []):
        name = e.get("name", "")
        duration_minutes = int(e.get("duration", 0))
        is_long_term = duration_minutes >= LONG_TERM
        label = label_for(name, name_map)

        for offset in e.get("when", []):
            start_ts = base_time + offset
            if is_long_term:
                end_ts, end_label, duration_label = None, "长期", "长期"
            else:
                end_ts = start_ts + duration_minutes * 60
                end_label = fmt_ts(end_ts)
                duration_label = f"{duration_minutes} 分钟"

            events.append({
                "name": name,
                "label": label,
                "start_ts": start_ts,
                "start": fmt_ts(start_ts),
                "end_ts": end_ts,
                "end": end_label,
                "duration_minutes": duration_minutes,
                "duration_label": duration_label,
                "active": start_ts <= server_time and (end_ts is None or server_time < end_ts),
                "upcoming": start_ts > server_time,
            })

    return {
        "server_time": server_time,
        "server_time_fmt": fmt_ts(server_time) if server_time else "",
        "valid_until": valid_until,
        "valid_until_fmt": fmt_ts(valid_until) if valid_until else "",
        "base_time": base_time,
        "base_time_fmt": fmt_ts(base_time) if base_time else "",
        "total": len(events),
        "active_count": sum(1 for x in events if x["active"]),
        "events": events,
    }


def public_schedule(schedule_full: dict) -> dict:
    """砍掉 epoch，只留格式化字串，寫進最終要 commit 的 schedule.json。"""
    events = [{k: v for k, v in e.items() if k not in ("start_ts", "end_ts")}
              for e in schedule_full["events"]]
    return {
        "server_time_fmt": schedule_full["server_time_fmt"],
        "valid_until_fmt": schedule_full["valid_until_fmt"],
        "base_time_fmt": schedule_full["base_time_fmt"],
        "total": schedule_full["total"],
        "active_count": schedule_full["active_count"],
        "events": events,
    }


def representative_occurrences(schedule_full: dict) -> dict:
    """
    同一個 name 常常有多個時段（when 展開後的多筆），差异比对只需要「一筆代表時段」。
    優先序：進行中 > 最近的未開始 > 最近剛結束的。
    回傳 {name: {label, start, end, duration_label}}
    """
    best = {}

    def score(ev):
        if ev["active"]:
            return (0, ev["start_ts"])
        if ev["upcoming"]:
            return (1, ev["start_ts"])
        return (2, -(ev["end_ts"] or ev["start_ts"]))

    for ev in schedule_full["events"]:
        name = ev["name"]
        if name not in best or score(ev) < score(best[name]):
            best[name] = ev

    return {
        name: {
            "label": ev["label"],
            "start": ev["start"],
            "end": ev["end"],
            "duration_label": ev["duration_label"],
        }
        for name, ev in best.items()
    }


def _duration_fmt(seconds: int) -> str:
    seconds = int(seconds or 0)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def convert_videos(raw: dict) -> dict:
    videos = []
    for v in raw.get("video_defs", []):
        location = v.get("location", "")
        subtitle = v.get("subtitle_base", "")
        videos.append({
            "name": v.get("name", ""),
            "duration": v.get("duration", 0),
            "duration_fmt": _duration_fmt(v.get("duration", 0)),
            "playback_url": location,
            "subtitle_url": subtitle,
            "has_playback": bool(location),
            "has_subtitle": bool(subtitle),
            "has_translations": bool(v.get("has_translations")),
            "cellular_data_warning": False,
        })
    return {"total": len(videos), "videos": videos}


def representative_video_info(videos: dict) -> dict:
    """給影片差异比对用的代表資訊（影片沒有多時段，直接用自己就好）。"""
    return {v["name"]: {"duration_fmt": v["duration_fmt"]} for v in videos["videos"]}
