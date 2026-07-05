"""
差异比对：只有「這次抓到的名稱集合」跟「上次存檔的名稱集合」不同時，才更新 added/removed，
否則保留上一筆有變化的紀錄（對應前端 unchanged_since_last_change 的提示文字）。

current_items 現在是 dict：{name: info}，info 至少含 label，
schedule 還會多帶 start/end/duration_label，讓「新增/刪除」清單能直接顯示具體時段，
不用另外回頭查詢。
"""
from converter import fmt_ts


def compute_diff(current_items: dict, prev_entry, now_ts: int):
    if prev_entry is None:
        new_entry = {"items": current_items, "fetched_at_fmt": fmt_ts(now_ts), "last_diff": None}
        return _render(None, False), new_entry

    old_items = prev_entry.get("items", {})
    added_names = sorted(set(current_items) - set(old_items))
    removed_names = sorted(set(old_items) - set(current_items))
    changed = bool(added_names or removed_names)

    if changed:
        last_diff = {
            "recorded_at_fmt": fmt_ts(now_ts),
            "previous_fetched_at_fmt": prev_entry.get("fetched_at_fmt", ""),
            "added": [{"name": n, **current_items[n]} for n in added_names],
            "removed": [{"name": n, **old_items[n]} for n in removed_names],
        }
    else:
        last_diff = prev_entry.get("last_diff")  # 保留上一筆有變化的紀錄

    new_entry = {"items": current_items, "fetched_at_fmt": fmt_ts(now_ts), "last_diff": last_diff}
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
