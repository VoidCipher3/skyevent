"""
差异比对：只有「這次抓到的名稱集合」跟「上次存檔的名稱集合」不同時，才更新 added/removed，
否則保留上一筆有變化的紀錄（對應前端 unchanged_since_last_change 的提示文字）。
"""
from converter import fmt_ts


def compute_diff(current_names, prev_entry, now_ts):
    """
    current_names: set[str] 這次抓到的名稱
    prev_entry: 上次存的 dict，或 None（第一次跑）
                {"names": [...], "fetched_at": int, "fetched_at_fmt": str, "last_diff": {...} | None}
    回傳 (diff_for_frontend, new_entry)
    """
    current_names = set(current_names)

    if prev_entry is None:
        new_entry = {
            "names": sorted(current_names),
            "fetched_at": now_ts,
            "fetched_at_fmt": fmt_ts(now_ts),
            "last_diff": None,
        }
        return _render(None, False), new_entry

    old_names = set(prev_entry.get("names", []))
    added = sorted(current_names - old_names)
    removed = sorted(old_names - current_names)
    changed = bool(added or removed)

    if changed:
        last_diff = {
            "recorded_at": now_ts,
            "recorded_at_fmt": fmt_ts(now_ts),
            "previous_fetched_at_fmt": prev_entry.get("fetched_at_fmt", ""),
            "added": added,
            "removed": removed,
        }
    else:
        last_diff = prev_entry.get("last_diff")  # 保留上一筆有變化的紀錄

    new_entry = {
        "names": sorted(current_names),
        "fetched_at": now_ts,
        "fetched_at_fmt": fmt_ts(now_ts),
        "last_diff": last_diff,
    }
    return _render(last_diff, not changed and last_diff is not None), new_entry


def _render(last_diff, unchanged_since_last_change):
    if last_diff is None:
        return {
            "has_recorded_diff": False,
            "recorded_at_fmt": None,
            "previous_fetched_at_fmt": None,
            "unchanged_since_last_change": False,
            "added": [],
            "removed": [],
        }
    return {
        "has_recorded_diff": True,
        "recorded_at_fmt": last_diff["recorded_at_fmt"],
        "previous_fetched_at_fmt": last_diff["previous_fetched_at_fmt"],
        "unchanged_since_last_change": unchanged_since_last_change,
        "added": last_diff["added"],
        "removed": last_diff["removed"],
    }
