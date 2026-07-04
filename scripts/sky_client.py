"""
Sky: Children of the Light — 登入 & 資料抓取共用模組
從舊有 SCRIPT.py 抽出登入邏輯，供 fetch_and_build.py 重複使用。
"""
import os
import uuid
import random
import string
import requests

URL_LOGIN = "https://live.radiance.thatgamecompany.com/account/auth/login"
URL_EVENT_SCHEDULE = "https://live.radiance.thatgamecompany.com/account/get_event_schedule"
URL_VIDEO_DEFS = "https://live.radiance.thatgamecompany.com/account/get_video_defs"


def _headers():
    version = os.environ.get("B", "0.33.8.401579")
    return {
        "User-Agent": f"Sky-Live-com.tgc.sky.android/{version}(OPPOA11;android29.0.0;zh-Hant)",
        "X-Session-ID": str(uuid.uuid4()),
        "Content-Type": "application/json",
        "trace-id": "".join(random.choices(string.ascii_letters + string.digits, k=7)),
        "x-sky-install-source": "com.android.vending",
        "x-sky-build-access-key": os.environ.get("B1", "1743442606-18e8259fef5328952a11cbc53270eff5ade32acd6cf4c86d7a58d6f9f7ab7e2e"),
        "x-sky-level-id": "3526133726",
    }


def _login_body():
    # 帳號綁定用的裝置簽章資訊；建議日後改由環境變數/密鑰管理，這裡先沿用舊值。
    return {
        "type": "Local",
        "user": "3cd4a098-1426-4508-aaa6-6367739ecc4f",
        "device": "7cc79895-82ea-4e8f-9e9e-ca95df76554b",
        "key": "0000989582ea4e8f9e9eca95df76554b0600000000000000a0f2a3e577000000",
        "device_name": "Note",
        "production": False,
        "tos_version": 4,
        "device_key": "AhTKINlHBe8ZVdgvDgGYmZEij7kgkhtw+Mvxjv87LR10",
        "sig_ts": 1768758071,
        "sig": "MEYCIQDTaFfFoirrxPUvN+mOM0h2P1MIjI5XHkiRnSKKc0THBgIhAMSfMQi/EiMDd0/p/yjCmfWNgme7ZzyzxYzZkMHjVSN3",
        "hashes": [1135420871, 3278488245, 3343069416, 697052631, 652834403, 3230520735, 2862836767,
                   2800003423, 1631895066, 4115622663, 3482958274, 2755794839, 2261054885, 997608129,
                   4289683175, 2093290016, 985236781, 4081232643, 1796835836, 3163265594, 1238400182,
                   1683264279, 4116407909, 3239572463, 1810499009, 360214524, 3661381049, 2387379720,
                   1550689788, 494663582, 2954385764, 178158103, 19908138, 2365512913, 2808461692],
        "integrity": True,
    }


class SkyClient:
    """登入一次，重複拉取 event_schedule / video_defs。"""

    def __init__(self):
        self.session_http = requests.Session()
        self.headers = _headers()
        self._login()

    def _login(self):
        r = self.session_http.post(URL_LOGIN, headers=self.headers, json=_login_body())
        r.raise_for_status()
        body = r.json()
        session = body.get("session")
        user = body.get("authinfo", {}).get("user")
        if not session:
            raise RuntimeError("Login Failed")
        self.headers.update({
            "session": session,
            "user-id": user,
            "x-user-id": user,
            "x-session-token": session,
        })
        self._body_base = {"user": user, "user-id": user, "session": session}

    def get_event_schedule(self) -> dict:
        r = self.session_http.post(URL_EVENT_SCHEDULE, headers=self.headers, json=self._body_base)
        r.raise_for_status()
        return r.json().get("event_schedule", {})

    def get_video_defs(self) -> dict:
        r = self.session_http.post(URL_VIDEO_DEFS, headers=self.headers, json=self._body_base)
        r.raise_for_status()
        data = r.json()
        return {
            "video_defs": data.get("video_defs", []),
            "video_schedule": data.get("video_schedule", []),
        }
