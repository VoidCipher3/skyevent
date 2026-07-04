"""
把伺服器回傳的原始格式（2.log 樣式）轉成前端要用的整理後格式（1.log 樣式）。
- convert_schedule(): event_schedule -> {events:[...], total, active_count, ...}
- convert_videos():   video_defs     -> {videos:[...], total}
"""
from datetime import datetime, timezone, timedelta

TZ8 = timezone(timedelta(hours=8))
LONG_TERM = 99999999


def fmt_ts(ts: int) -> str:
    return datetime.fromtimestamp(ts, TZ8).strftime("%Y-%m-%d %H:%M:%S")


def convert_schedule(raw: dict) -> dict:
    server_time = raw.get("server_time", 0)
    valid_until = raw.get("valid_until", 0)
    base_time = raw.get("base_time", 0)

    events = []
    for e in raw.get("events", []):
        duration_minutes = int(e.get("duration", 0))
        is_long_term = duration_minutes >= LONG_TERM
        for offset in e.get("when", []):
            start_ts = base_time + offset
            if is_long_term:
                end_ts, end_label, duration_label = None, "长期", "长期"
            else:
                end_ts = start_ts + duration_minutes * 60
                end_label = fmt_ts(end_ts)
                duration_label = f"{duration_minutes} 分钟"

            events.append({
                "name": e.get("name", ""),
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
