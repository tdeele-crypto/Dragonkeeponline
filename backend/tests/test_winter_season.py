"""Tests for the manual-override Seasonal Light feature.

Covers:
- AppSettings no longer has light_winter_shorten_hours (removed field)
- Admin settings PUT for light_summer_start / light_winter_start
- TimeSlot winter_time persistence via PUT /api/times/{id}
- services/season.py apply_winter_times: explicit overrides only, unset slots
  keep their normal (summer) time.
"""
import os
import datetime
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', os.environ.get('EXPO_BACKEND_URL')).rstrip('/')
API = f"{BASE_URL}/api"

DRAGON_ID = "6a4635bd66e797e6db9b8f13"  # Sif, seeded

# Known seeded time ids (07:00 light-on, 20:30 light-off, etc.)
TIME_LIGHT_ON = "6a477da133ffd950009a40a6"  # 07:00 - lys (light on)
TIME_LIGHT_OFF = "6a477da133ffd950009a40ac"  # 20:30 - lys (light off)
TIME_FODRING = "6a477da133ffd950009a40a7"  # 08:00 - fodring


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module", autouse=True)
def restore_state(api_client):
    """Snapshot settings/times before tests, restore after (cleanup rule)."""
    orig_settings = api_client.get(f"{API}/admin/settings").json()
    orig_times = {t["id"]: t.get("winter_time") for t in api_client.get(f"{API}/times").json()}
    yield
    api_client.put(f"{API}/admin/settings", json={
        "light_summer_start": orig_settings.get("light_summer_start", "03-01"),
        "light_winter_start": orig_settings.get("light_winter_start", "09-01"),
    })
    for tid, wt in orig_times.items():
        cur = next((t for t in api_client.get(f"{API}/times").json() if t["id"] == tid), None)
        if cur is None:
            continue
        api_client.put(f"{API}/times/{tid}", json={"time": cur["time"], "winter_time": wt})


class TestAppSettingsShape:
    def test_settings_has_no_shorten_hours_field(self, api_client):
        resp = api_client.get(f"{API}/admin/settings")
        assert resp.status_code == 200
        data = resp.json()
        assert "light_winter_shorten_hours" not in data
        assert "light_summer_start" in data
        assert "light_winter_start" in data


class TestSeasonDatesPersist:
    def test_put_summer_and_winter_start(self, api_client):
        resp = api_client.put(f"{API}/admin/settings", json={
            "light_summer_start": "03-15",
            "light_winter_start": "09-20",
        })
        assert resp.status_code == 200
        get_resp = api_client.get(f"{API}/admin/settings")
        data = get_resp.json()
        assert data["light_summer_start"] == "03-15"
        assert data["light_winter_start"] == "09-20"
        # restore to defaults immediately (also handled by module fixture)
        api_client.put(f"{API}/admin/settings", json={
            "light_summer_start": "03-01",
            "light_winter_start": "09-01",
        })


class TestTimeWinterOverridePersistence:
    def test_put_time_with_winter_time_and_verify(self, api_client):
        cur = next(t for t in api_client.get(f"{API}/times").json() if t["id"] == TIME_FODRING)
        resp = api_client.put(f"{API}/times/{TIME_FODRING}", json={
            "time": cur["time"], "winter_time": "10:45",
        })
        assert resp.status_code == 200
        assert resp.json()["winter_time"] == "10:45"
        get_resp = api_client.get(f"{API}/times")
        found = next(t for t in get_resp.json() if t["id"] == TIME_FODRING)
        assert found["winter_time"] == "10:45"
        # clear it
        clear_resp = api_client.put(f"{API}/times/{TIME_FODRING}", json={
            "time": cur["time"], "winter_time": None,
        })
        assert clear_resp.status_code == 200
        assert clear_resp.json()["winter_time"] is None


class TestDailyOverviewWinterFallback:
    """New rule: winter uses explicit overrides only; unset slots keep their
    normal (summer) time. Tested directly against services.season."""

    def test_apply_winter_times_keeps_summer_time_when_unset(self):
        from services.season import apply_winter_times

        tasks = [
            {"time_id": "A", "time": "07:00", "category": "lys"},
            {"time_id": "B", "time": "08:00", "category": "fodring"},
            {"time_id": "C", "time": "18:00", "category": "pleje"},
        ]
        # Only B has an explicit winter override.
        apply_winter_times(tasks, {"A": None, "B": "09:00", "C": None})
        by_id = {t["category"]: t["time"] for t in tasks}
        assert by_id["lys"] == "07:00"      # unchanged (no override)
        assert by_id["fodring"] == "09:00"  # explicit override applied
        assert by_id["pleje"] == "18:00"    # unchanged (no override) - NOT collapsed

    def test_apply_winter_times_no_overrides_is_noop(self):
        from services.season import apply_winter_times

        tasks = [
            {"time_id": "A", "time": "07:00", "category": "lys"},
            {"time_id": "C", "time": "18:00", "category": "pleje"},
        ]
        apply_winter_times(tasks, {"A": None, "C": None})
        assert [t["time"] for t in tasks] == ["07:00", "18:00"]
