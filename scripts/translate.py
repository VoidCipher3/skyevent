"""
活動名稱翻譯字典載入器。

字典本體建議放在 GitHub Secret（例如 EVENT_NAMES_JSON），內容是一段 JSON 字串：

{
  "event_prairie_tcandles3": {"tw": "雲野大蠟燭-3", "cn": "云野大蜡烛-3", "en": "Daylight Prairie Treasure Candle-3"},
  "collectible_bird":        {"tw": "候鳥",         "cn": "候鸟",         "en": "Traveling Bird"},
  "season_b_night_candles2": {"tw": "禁閣季蠟B組-2", "cn": "禁阁季蜡B组-2", "en": "Vault of Knowledge Season Candle B-2"}
}

執行時只從環境變數讀進記憶體使用，寫回 repo 的 schedule.json 裡已經是翻譯後的 label，
字典本身不會被 commit，達到「翻譯表是密鑰、輸出是明文」的效果。

本機測試時可以改用 EVENT_NAMES_FILE 指向一個本地 json 檔，方便你不用每次都塞 env 變數。
"""
import json
import os


def load_event_name_map() -> dict:
    raw = os.environ.get("EVENT_NAMES_JSON", "").strip()
    if not raw:
        file_path = os.environ.get("EVENT_NAMES_FILE", "").strip()
        if file_path and os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                raw = f.read()
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[translate] EVENT_NAMES_JSON 不是合法 JSON，已忽略翻譯字典：{e}")
        return {}


def label_for(name: str, name_map: dict) -> dict:
    entry = name_map.get(name)
    if entry:
        return {
            "tw": entry.get("tw", name),
            "cn": entry.get("cn", name),
            "en": entry.get("en", name),
        }
    return {"tw": name, "cn": name, "en": name}
