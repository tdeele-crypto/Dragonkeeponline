"""Tests for the new manual-override + 30-min-fallback Seasonal Light feature.

Covers:
- AppSettings no longer has light_winter_shorten_hours (removed field)
- Admin settings PUT for light_summer_start / light_winter_start
- TimeSlot winter_time persistence via PUT /api/times/{id}
- /api/daily-overview winter fallback logic (services/season.py apply_winter_times)
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
    """Force today into winter period and verify fallback + override logic."""

    def test_winter_fallback_30min_after_light_on(self, api_client):
        today = datetime.date.today()
        # winter period = [winter_start, summer_start); make it basically the whole
        # year except tomorrow, guaranteeing "today" is inside winter.
        tomorrow = today + datetime.timedelta(days=1)
        summer_start = f"{tomorrow.month:02d}-{tomorrow.day:02d}"
        winter_start = f"{tomorrow.month:02d}-{tomorrow.day:02d}"
        # winter <= summer (equal) -> is_in_winter_period requires winter<=today<summer
        # equal winter/summer would give empty range, so instead set winter_start to
        # today and summer_start to tomorrow+1 to guarantee inclusion.
        day_after = today + datetime.timedelta(days=2)
        winter_start = f"{today.month:02d}-{today.day:02d}"
        summer_start = f"{day_after.month:02d}-{day_after.day:02d}"

        settings_resp = api_client.put(f"{API}/admin/settings", json={
            "light_summer_start": summer_start,
            "light_winter_start": winter_start,
        })
        assert settings_resp.status_code == 200

        # Set an explicit winter override ONLY on the light-on slot.
        cur_on = next(t for t in api_client.get(f"{API}/times").json() if t["id"] == TIME_LIGHT_ON)
        override_resp = api_client.put(f"{API}/times/{TIME_LIGHT_ON}", json={
            "time": cur_on["time"], "winter_time": "06:15",
        })
        assert override_resp.status_code == 200

        date_str = today.strftime("%Y-%m-%d")
        overview_resp = api_client.get(f"{API}/daily-overview", params={"date": date_str})
        assert overview_resp.status_code == 200
        overview = overview_resp.json()
        assert overview["is_winter_period"] is True

        sif = next(d for d in overview["dragons"] if d["dragon_id"] == DRAGON_ID)
        tasks_by_time = [t for t in sif["tasks"]]
        assert len(tasks_by_time) > 0

        # light-on task (lys) should show overridden 06:15
        lys_tasks = [t for t in tasks_by_time if t["category"] == "lys"]
        assert any(t["time"] == "06:15" for t in lys_tasks), f"lys tasks: {lys_tasks}"

        # ALL other tasks without their own override (fodring/pleje/lys-off) should be 06:45
        for t in tasks_by_time:
            if t["time"] == "06:15":
                continue
            assert t["time"] == "06:45", f"expected fallback 06:45, got {t}"

        # Now set an explicit override on a fodring slot too, verify it uses its own value
        cur_fodring = next(t for t in api_client.get(f"{API}/times").json() if t["id"] == TIME_FODRING)
        api_client.put(f"{API}/times/{TIME_FODRING}", json={
            "time": cur_fodring["time"], "winter_time": "11:11",
        })
        overview_resp2 = api_client.get(f"{API}/daily-overview", params={"date": date_str})
        overview2 = overview_resp2.json()
        sif2 = next(d for d in overview2["dragons"] if d["dragon_id"] == DRAGON_ID)
        fodring_tasks = [t for t in sif2["tasks"] if t["category"] == "fodring"]
        # the fodring task whose time_id had an override should now show 11:11
        assert any(t["time"] == "11:11" for t in fodring_tasks), f"fodring tasks: {fodring_tasks}"
        # other non-overridden tasks still fall back to 06:45
        others = [t for t in sif2["tasks"] if t["time"] not in ("06:15", "11:11")]
        for t in others:
            assert t["time"] == "06:45", f"expected fallback 06:45, got {t}"

        # cleanup done in module-scoped restore_state fixture
