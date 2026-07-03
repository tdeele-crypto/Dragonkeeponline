"""
Tests for NEW feature: Dragon activity_state (active/brumation) toggle
- PUT /api/dragons/{id}/activity-state
- GET /api/daily-overview activity_state field + feeding task filtering
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://bearded-buddy-log.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def test_dragon(api_client):
    payload = {
        "name": "TEST_ActivityDragon",
        "gender": "Han",
        "color": "Orange",
        "morph": "Standard",
        "birthday": "2024-01-01",
    }
    resp = api_client.post(f"{API}/dragons", json=payload)
    assert resp.status_code == 200
    dragon = resp.json()
    yield dragon
    api_client.delete(f"{API}/dragons/{dragon['id']}")


class TestActivityStateEndpoint:
    def test_default_activity_state_is_active(self, test_dragon):
        assert test_dragon.get("activity_state") == "active"

    def test_put_activity_state_to_brumation(self, api_client, test_dragon):
        resp = api_client.put(
            f"{API}/dragons/{test_dragon['id']}/activity-state",
            json={"activity_state": "brumation"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["activity_state"] == "brumation"

        # Verify persisted via GET
        get_resp = api_client.get(f"{API}/dragons/{test_dragon['id']}")
        assert get_resp.status_code == 200
        assert get_resp.json()["activity_state"] == "brumation"

    def test_put_activity_state_back_to_active(self, api_client, test_dragon):
        api_client.put(f"{API}/dragons/{test_dragon['id']}/activity-state", json={"activity_state": "brumation"})
        resp = api_client.put(
            f"{API}/dragons/{test_dragon['id']}/activity-state",
            json={"activity_state": "active"},
        )
        assert resp.status_code == 200
        assert resp.json()["activity_state"] == "active"

    def test_put_invalid_activity_state_returns_422(self, api_client, test_dragon):
        resp = api_client.put(
            f"{API}/dragons/{test_dragon['id']}/activity-state",
            json={"activity_state": "hibernating"},
        )
        assert resp.status_code == 422

    def test_put_activity_state_invalid_dragon_id(self, api_client):
        resp = api_client.put(
            f"{API}/dragons/invalid-id-123/activity-state",
            json={"activity_state": "active"},
        )
        assert resp.status_code == 400

    def test_put_activity_state_nonexistent_dragon(self, api_client):
        resp = api_client.put(
            f"{API}/dragons/64b6f3f3f3f3f3f3f3f3f3f3/activity-state",
            json={"activity_state": "active"},
        )
        assert resp.status_code == 404


class TestDailyOverviewFiltering:
    def test_overview_includes_activity_state(self, api_client, test_dragon):
        resp = api_client.get(f"{API}/daily-overview", params={"date": "2026-01-15"})
        assert resp.status_code == 200
        data = resp.json()
        dragon_entry = next((d for d in data["dragons"] if d["dragon_id"] == test_dragon["id"]), None)
        assert dragon_entry is not None
        assert dragon_entry["activity_state"] == "active"

    def test_brumation_hides_feeding_tasks(self, api_client, test_dragon):
        date_str = "2026-01-15"
        resp_before = api_client.get(f"{API}/daily-overview", params={"date": date_str})
        dragon_before = next(d for d in resp_before.json()["dragons"] if d["dragon_id"] == test_dragon["id"])
        categories_before = {t["category"] for t in dragon_before["tasks"]}

        # Switch to brumation
        api_client.put(f"{API}/dragons/{test_dragon['id']}/activity-state", json={"activity_state": "brumation"})

        resp_after = api_client.get(f"{API}/daily-overview", params={"date": date_str})
        dragon_after = next(d for d in resp_after.json()["dragons"] if d["dragon_id"] == test_dragon["id"])
        categories_after = {t["category"] for t in dragon_after["tasks"]}

        assert dragon_after["activity_state"] == "brumation"
        assert "fodring" not in categories_after
        # care/light tasks should still be non-feeding categories if present before
        assert categories_after.issubset({"pleje", "lys"})

        # Switch back to active - feeding tasks should reappear
        api_client.put(f"{API}/dragons/{test_dragon['id']}/activity-state", json={"activity_state": "active"})
        resp_final = api_client.get(f"{API}/daily-overview", params={"date": date_str})
        dragon_final = next(d for d in resp_final.json()["dragons"] if d["dragon_id"] == test_dragon["id"])
        categories_final = {t["category"] for t in dragon_final["tasks"]}
        assert categories_final == categories_before

    def test_brumation_per_dragon_isolation(self, api_client, test_dragon):
        # create second dragon
        payload2 = {
            "name": "TEST_ActivityDragon2",
            "gender": "Hun",
            "color": "Red",
            "morph": "Standard",
            "birthday": "2024-01-01",
        }
        resp2 = api_client.post(f"{API}/dragons", json=payload2)
        dragon2 = resp2.json()
        try:
            date_str = "2026-01-15"
            api_client.put(f"{API}/dragons/{test_dragon['id']}/activity-state", json={"activity_state": "brumation"})

            resp = api_client.get(f"{API}/daily-overview", params={"date": date_str})
            d1 = next(d for d in resp.json()["dragons"] if d["dragon_id"] == test_dragon["id"])
            d2 = next(d for d in resp.json()["dragons"] if d["dragon_id"] == dragon2["id"])

            assert d1["activity_state"] == "brumation"
            assert d2["activity_state"] == "active"
            categories_d2 = {t["category"] for t in d2["tasks"]}
            # dragon2 should still have feeding tasks (unaffected by dragon1's state)
            assert "fodring" in categories_d2 or len(d2["tasks"]) == 0
        finally:
            api_client.delete(f"{API}/dragons/{dragon2['id']}")
