"""
主流程（唯一需要被 GitHub Actions 執行的腳本；其他 3 個檔案都是被 import 的模組）：
  1. 登入取得 session
  2. 拉 event_schedule / video_defs
  3. 讀取 EVENT_NAMES_JSON（GitHub Secret）翻譯活動名稱
  4. 轉成整理後格式，砍掉沒必要的 epoch timestamp，只留格式化時間字串
  5. 比对差异（只在有變化時更新 added/removed，且每筆都帶具體 start/end/duration）
  6. 寫出 docs/data/*.json 給前端讀，並附加一份月份存檔

需要環境變數（放在 GitHub Secrets）：
  B, B1              沿用舊 SCRIPT.py 的簽章 header
  EVENT_NAMES_JSON   活動名稱翻譯字典（見 translate.py 開頭的格式說明）
  SERVER_NAME        可選，預設 global
"""
import json
import os
import time
from datetime import datetime

from sky_client import SkyClient
from converter import (
    convert_schedule, convert_videos, public_schedule,
    representative_occurrences, representative_video_info,
    fmt_ts, TZ8,
)
from diff_state import compute_diff
from translate import load_event_name_map

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "data")
ARCHIVE_DIR = os.path.join(os.path.dirname(__file__), "..", "archive")
SERVER_NAME = os.environ.get("SERVER_NAME", "global")


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
    # 只保留格式化時間，不寫入 epoch，減少 json 長度
    return {
        "ok": True,
        "server": SERVER_NAME,
        "meta": {
            "fetched_at_fmt": fmt_ts(fetched_at),
            "auto_refresh": True,
            "refresh_interval_hours": 0.5,
        },
        "data": data,
    }


def main():
    client = SkyClient()
    now = int(time.time())
    name_map = load_event_name_map()

    schedule_full = convert_schedule(client.get_event_schedule(), name_map=name_map)
    videos = convert_videos(client.get_video_defs())

    _save_json(os.path.join(OUT_DIR, "schedule.json"), _wrap(public_schedule(schedule_full), now))
    _save_json(os.path.join(OUT_DIR, "video.json"), _wrap(videos, now))

    # --- 差异比对：帶著代表時段一起存，新增/刪除清單能直接顯示具體開始/結束 ---
    diff_state_path = os.path.join(OUT_DIR, "diff_state.json")
    state = _load_json(diff_state_path, {}) or {}

    schedule_items = representative_occurrences(schedule_full)
    video_items = representative_video_info(videos)

    diff_schedule, state["event_schedule"] = compute_diff(
        schedule_items, state.get("event_schedule"), now)
    diff_video, state["video_defs"] = compute_diff(
        video_items, state.get("video_defs"), now)

    _save_json(diff_state_path, state)
    _save_json(os.path.join(OUT_DIR, "diff.json"), {
        "ok": True,
        "diff": {"event_schedule": diff_schedule, "video_defs": diff_video},
    })

    # --- status.json：前端顶部「资料更新于」用 ---
    _save_json(os.path.join(OUT_DIR, "status.json"), {
        "ready": True,
        "snapshots": {
            "event_schedule": {"fetched_at_fmt": fmt_ts(now)},
            "video_defs": {"fetched_at_fmt": fmt_ts(now)},
        },
    })

    # --- 按月存档（只留活跃活动名稱，影片清单变动不大就不重复存） ---
    month_key = datetime.now(TZ8).strftime("%Y-%m")
    day_key = datetime.now(TZ8).strftime("%Y-%m-%d")
    archive_path = os.path.join(ARCHIVE_DIR, f"{month_key}.json")
    archive = _load_json(archive_path, {}) or {}
    archive[day_key] = {
        "active_events": sorted(n for n, e in schedule_items.items()),
        "total": schedule_full["total"],
        "active_count": schedule_full["active_count"],
    }
    _save_json(archive_path, archive)

    print(f"Done. schedule={schedule_full['total']} events, videos={videos['total']}, "
          f"translated={sum(1 for n in name_map if n in schedule_items)}/{len(name_map)}")


if __name__ == "__main__":
    main()
