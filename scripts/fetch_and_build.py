"""
主流程（取代舊的 main.py + SCRIPT.py 組合）：
  1. 登入取得 session
  2. 拉 event_schedule / video_defs
  3. 轉成整理後格式
  4. 比對差異（只在有變化時更新 added/removed）
  5. 寫出 docs/data/*.json 給前端讀，並附加一份月份存檔

用法： python fetch_and_build.py
需要環境變數：B, B1（沿用舊 SCRIPT.py 的簽章 header），可選 SERVER_NAME（預設 gjf）
"""
import json
import os
import time
from datetime import datetime, timezone, timedelta

from sky_client import SkyClient
from converter import convert_schedule, convert_videos, fmt_ts, TZ8
from diff_state import compute_diff

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "data")
ARCHIVE_DIR = os.path.join(os.path.dirname(__file__), "..", "archive")
SERVER_NAME = os.environ.get("SERVER_NAME", "gjf")


def _load_json(path, default=None):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def _save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def _wrap(data, fetched_at):
    return {
        "ok": True,
        "server": SERVER_NAME,
        "meta": {
            "fetched_at": fetched_at,
            "fetched_at_fmt": fmt_ts(fetched_at),
            "auto_refresh": True,
            "refresh_interval_hours": 0.5,
        },
        "data": data,
    }


def main():
    client = SkyClient()
    now = int(time.time())

    raw_schedule = client.get_event_schedule()
    schedule = convert_schedule(raw_schedule)

    raw_videos = client.get_video_defs()
    videos = convert_videos(raw_videos)

    _save_json(os.path.join(OUT_DIR, "schedule.json"), _wrap(schedule, now))
    _save_json(os.path.join(OUT_DIR, "video.json"), _wrap(videos, now))

    # --- 差异比对（以「名稱」為單位，跨執行持久化在 diff_state.json） ---
    diff_state_path = os.path.join(OUT_DIR, "diff_state.json")
    state = _load_json(diff_state_path, {}) or {}

    schedule_names = {e["name"] for e in schedule["events"]}
    video_names = {v["name"] for v in videos["videos"]}

    diff_schedule, state["event_schedule"] = compute_diff(
        schedule_names, state.get("event_schedule"), now)
    diff_video, state["video_defs"] = compute_diff(
        video_names, state.get("video_defs"), now)

    _save_json(diff_state_path, state)
    _save_json(os.path.join(OUT_DIR, "diff.json"), {
        "ok": True,
        "diff": {"event_schedule": diff_schedule, "video_defs": diff_video},
    })

    # --- status.json：前端顶部「资料更新于」用 ---
    _save_json(os.path.join(OUT_DIR, "status.json"), {
        "ready": True,
        "manual_refresh_enabled": False,
        "snapshots": {
            "event_schedule": {"fetched_at_fmt": fmt_ts(now)},
            "video_defs": {"fetched_at_fmt": fmt_ts(now)},
        },
    })

    # --- 按月存档（只留活动，影片清单变动不大就不重复存） ---
    month_key = datetime.now(TZ8).strftime("%Y-%m")
    day_key = datetime.now(TZ8).strftime("%Y-%m-%d")
    archive_path = os.path.join(ARCHIVE_DIR, f"{month_key}.json")
    archive = _load_json(archive_path, {}) or {}
    archive[day_key] = {
        "active_events": sorted(schedule_names),
        "total": schedule["total"],
        "active_count": schedule["active_count"],
    }
    _save_json(archive_path, archive)

    print(f"Done. schedule={schedule['total']} events, videos={videos['total']}")


if __name__ == "__main__":
    main()
