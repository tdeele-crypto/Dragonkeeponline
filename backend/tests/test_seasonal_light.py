"""Backend tests for the Seasonal Light Adjustment feature.

Covers:
- GET/PUT /api/admin/settings for light_summer_start, light_winter_start,
  light_winter_shorten_hours (persistence round-trip).
- /api/daily-overview is_winter_period flag + symmetric shift of 'lys' task
  times when today falls inside the configured winter window.
- No shift / is_winter_period False when today is outside the winter window.

IMPORTANT: This suite mutates the singleton AppSettings document (there is
only one). Original values are captured in a fixture and restored at the
end of the module so the app is left in the same season config it started
in (tests do NOT assume default 03-01/09-01/3 - they save/restore whatever
was present before the run).
"""
import os
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def original_settings(api_client):
    """Capture original season settings and restore after module tests."""
    resp = api_client.get(f"{API}/admin/settings")
    assert resp.status_code == 200
    data = resp.json()
    original = {
        "light_summer_start": data.get("light_summer_start", "03-01"),
        "light_winter_start": data.get("light_winter_start", "09-01"),
        "light_winter_shorten_hours": data.get("light_winter_shorten_hours", 3.0),
    }
    yield original
    # Restore
    restore_resp = api_client.put(f"{API}/admin/settings", json=original)
    assert restore_resp.status_code == 200


class TestAdminSettingsSeasonPersistence:
    def test_put_and_get_season_settings_roundtrip(self, api_client, original_settings):
        payload = {
            "light_summer_start": "10-20",
            "light_winter_start": "04-05",
            "light_winter_shorten_hours": 4.5,
        }
        put_resp = api_client.put(f"{API}/admin/settings", json=payload)
        assert put_resp.status_code == 200
        put_data = put_resp.json()
        assert put_data["light_summer_start"] == "10-20"
        assert put_data["light_winter_start"] == "04-05"
        assert put_data["light_winter_shorten_hours"] == 4.5

        get_resp = api_client.get(f"{API}/admin/settings")
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert get_data["light_summer_start"] == "10-20"
        assert get_data["light_winter_start"] == "04-05"
        assert get_data["light_winter_shorten_hours"] == 4.5


class TestDailyOverviewSeasonalShift:
    def test_winter_period_shifts_lys_tasks_symmetrically(self, api_client, original_settings):
        today = date.today()
        winter_start_date = today - timedelta(days=5)
        summer_start_date = today + timedelta(days=90)
        winter_str = f"{winter_start_date.month:02d}-{winter_start_date.day:02d}"
        summer_str = f"{summer_start_date.month:02d}-{summer_start_date.day:02d}"

        put_resp = api_client.put(f"{API}/admin/settings", json={
            "light_winter_start": winter_str,
            "light_summer_start": summer_str,
            "light_winter_shorten_hours": 3.0,
        })
        assert put_resp.status_code == 200

        today_str = today.isoformat()
        overview_resp = api_client.get(f"{API}/daily-overview", params={"date": today_str})
        assert overview_resp.status_code == 200
        overview_data = overview_resp.json()
        assert overview_data["is_winter_period"] is True

        dragons = overview_data["dragons"]
        assert len(dragons) >= 1
        dragon = dragons[0]
        lys_times = sorted({t["time"] for t in dragon["tasks"] if t["category"] == "lys"})
        assert len(lys_times) >= 2, "Expected at least 2 distinct lys times to verify shift"

        # shift_minutes = (3/2)*60 = 90
        # Compare against raw schedule slot + times to compute expected unshifted values
        schedule_resp = api_client.get(f"{API}/schedule-slots", params={
            "age_category": dragon["age_category"],
            "day_of_week": overview_data["day_of_week"],
        })
        assert schedule_resp.status_code == 200
        slots = [s for s in schedule_resp.json() if s["category"] == "lys"]
        times_resp = api_client.get(f"{API}/times")
        assert times_resp.status_code == 200
        times_map = {t["id"]: t["time"] for t in times_resp.json()}
        raw_lys_times = sorted({times_map.get(s["time_id"]) for s in slots if times_map.get(s["time_id"])})
        assert len(raw_lys_times) >= 2

        def to_minutes(hhmm):
            h, m = map(int, hhmm.split(":"))
            return h * 60 + m

        expected_earliest = min(to_minutes(raw_lys_times[0]) + 90, 23 * 60 + 59)
        expected_latest = max(to_minutes(raw_lys_times[-1]) - 90, 0)

        assert to_minutes(lys_times[0]) == expected_earliest
        assert to_minutes(lys_times[-1]) == expected_latest

    def test_outside_winter_period_no_shift(self, api_client, original_settings):
        today = date.today()
        # Configure so today is clearly in "summer" (not winter): summer_start = today,
        # winter_start = 200 days later.
        winter_start_date = today + timedelta(days=200)
        summer_start_date = today
        winter_str = f"{winter_start_date.month:02d}-{winter_start_date.day:02d}"
        summer_str = f"{summer_start_date.month:02d}-{summer_start_date.day:02d}"

        put_resp = api_client.put(f"{API}/admin/settings", json={
            "light_winter_start": winter_str,
            "light_summer_start": summer_str,
            "light_winter_shorten_hours": 3.0,
        })
        assert put_resp.status_code == 200

        today_str = today.isoformat()
        overview_resp = api_client.get(f"{API}/daily-overview", params={"date": today_str})
        assert overview_resp.status_code == 200
        overview_data = overview_resp.json()
        assert overview_data["is_winter_period"] is False

        dragon = overview_data["dragons"][0]
        lys_times = sorted({t["time"] for t in dragon["tasks"] if t["category"] == "lys"})

        schedule_resp = api_client.get(f"{API}/schedule-slots", params={
            "age_category": dragon["age_category"],
            "day_of_week": overview_data["day_of_week"],
        })
        slots = [s for s in schedule_resp.json() if s["category"] == "lys"]
        times_resp = api_client.get(f"{API}/times")
        times_map = {t["id"]: t["time"] for t in times_resp.json()}
        raw_lys_times = sorted({times_map.get(s["time_id"]) for s in slots if times_map.get(s["time_id"])})

        assert lys_times == raw_lys_times, "Times should be unshifted outside winter period"
