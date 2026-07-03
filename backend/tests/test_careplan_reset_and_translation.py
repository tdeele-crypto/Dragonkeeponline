"""
Tests for NEW feature: Admin > Default care plan reset (POST /api/admin/reset-careplan)
and AI auto-translation of custom task items (POST/PUT /api/task-items, GET /api/daily-overview).
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", os.environ.get("EXPO_BACKEND_URL", "")).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def temp_dragon(api_client):
    """Create a dragon + weight entry to verify it survives reset untouched."""
    payload = {
        "name": "TEST_ResetSurvivor",
        "gender": "Han",
        "color": "Citrus",
        "morph": "Normal",
        "birthday": "2024-01-01",
    }
    resp = api_client.post(f"{API}/dragons", json=payload)
    assert resp.status_code in (200, 201), resp.text
    dragon = resp.json()
    dragon_id = dragon["id"]

    w_resp = api_client.post(f"{API}/dragons/{dragon_id}/weights", json={"weight_grams": 123.4, "date": "2024-06-01"})
    assert w_resp.status_code in (200, 201), w_resp.text
    weight = w_resp.json()

    yield dragon_id, weight["id"]

    api_client.delete(f"{API}/dragons/{dragon_id}")


class TestCareplanReset:
    def test_reset_careplan_wipes_and_reseeds(self, api_client, temp_dragon):
        dragon_id, weight_id = temp_dragon

        resp = api_client.post(f"{API}/admin/reset-careplan", json={})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["success"] is True
        assert data["times_count"] == 7
        assert data["items_count"] == 12
        assert data["schedule_slots_count"] > 150  # ~163 expected

        # Verify counts via GET endpoints match
        times = api_client.get(f"{API}/times").json()
        items = api_client.get(f"{API}/task-items").json()
        assert len(times) == 7
        assert len(items) == 12

        # bilingual fields present
        for item in items:
            assert item.get("name_da"), f"missing name_da for {item}"
            assert item.get("name_en"), f"missing name_en for {item}"
            assert item.get("category") in ("fodring", "pleje", "lys")

        # schedule slots cover all 4 age categories
        slots = api_client.get(f"{API}/schedule-slots").json()
        ages = {s["age_category"] for s in slots}
        assert ages == {"2-4", "4-7", "7-12", "12+"}

        # Dragon + weight survive untouched
        dragon_resp = api_client.get(f"{API}/dragons/{dragon_id}")
        assert dragon_resp.status_code == 200
        assert dragon_resp.json()["name"] == "TEST_ResetSurvivor"

        weights_resp = api_client.get(f"{API}/dragons/{dragon_id}/weights")
        assert weights_resp.status_code == 200
        weight_ids = [w["id"] for w in weights_resp.json()]
        assert weight_id in weight_ids

    def test_reseeded_data_fully_editable(self, api_client):
        """After reset, verify times/items/slots can be added/edited/deleted normally."""
        # Add a new time
        t_resp = api_client.post(f"{API}/times", json={"time": "23:45"})
        assert t_resp.status_code in (200, 201), t_resp.text
        time_id = t_resp.json()["id"]

        get_t = api_client.get(f"{API}/times")
        assert any(t["id"] == time_id for t in get_t.json())

        del_resp = api_client.delete(f"{API}/times/{time_id}")
        assert del_resp.status_code == 200

        # Edit an existing item's is_automatic flag
        items = api_client.get(f"{API}/task-items").json()
        assert len(items) > 0
        item = items[0]
        put_resp = api_client.put(
            f"{API}/task-items/{item['id']}",
            json={"category": item["category"], "name": item["name"], "is_automatic": not item["is_automatic"]},
        )
        assert put_resp.status_code == 200, put_resp.text
        assert put_resp.json()["is_automatic"] == (not item["is_automatic"])


class TestAITranslation:
    def test_create_task_item_with_source_language_da_translates_to_en(self, api_client):
        payload = {"category": "fodring", "name": "Cikader", "is_automatic": False, "source_language": "da"}
        resp = api_client.post(f"{API}/task-items", json=payload)
        assert resp.status_code in (200, 201), resp.text
        data = resp.json()
        assert data["name"] == "Cikader"
        assert data["name_da"] == "Cikader"
        assert data["name_en"], "name_en should not be empty"
        # Should be a real translation, not identical to the Danish source
        assert data["name_en"].strip().lower() != "cikader"
        assert "cicad" in data["name_en"].lower(), f"Expected 'cicada'-like translation, got {data['name_en']}"

        # cleanup
        api_client.delete(f"{API}/task-items/{data['id']}")

    def test_put_toggle_is_automatic_does_not_retranslate(self, api_client):
        # create item with known translation
        create_resp = api_client.post(
            f"{API}/task-items",
            json={"category": "pleje", "name": "Testopgave", "is_automatic": False, "source_language": "da"},
        )
        assert create_resp.status_code in (200, 201)
        item = create_resp.json()
        original_da = item["name_da"]
        original_en = item["name_en"]

        # Toggle is_automatic only, same name
        put_resp = api_client.put(
            f"{API}/task-items/{item['id']}",
            json={"category": item["category"], "name": item["name"], "is_automatic": True},
        )
        assert put_resp.status_code == 200
        updated = put_resp.json()
        assert updated["is_automatic"] is True
        assert updated["name_da"] == original_da
        assert updated["name_en"] == original_en

        api_client.delete(f"{API}/task-items/{item['id']}")

    def test_daily_overview_item_names_switch_with_language(self, api_client):
        # ensure fresh careplan seeded (with bilingual names) exists
        seed_resp = api_client.post(f"{API}/admin/reset-careplan", json={})
        assert seed_resp.status_code == 200

        dragon_resp = api_client.post(
            f"{API}/dragons",
            json={"name": "TEST_OverviewDragon", "gender": "Hun", "color": "Red", "morph": "Normal", "birthday": "2020-01-01"},
        )
        assert dragon_resp.status_code in (200, 201)
        dragon_id = dragon_resp.json()["id"]

        try:
            api_client.put(f"{API}/admin/settings", json={"language": "da"})
            overview_da = api_client.get(f"{API}/daily-overview", params={"date": "2026-01-15"})
            assert overview_da.status_code == 200
            da_data = overview_da.json()

            api_client.put(f"{API}/admin/settings", json={"language": "en"})
            overview_en = api_client.get(f"{API}/daily-overview", params={"date": "2026-01-15"})
            assert overview_en.status_code == 200
            en_data = overview_en.json()

            def extract_item_names(payload):
                names = set()
                for dragon_block in payload.get("dragons", []):
                    for task in dragon_block.get("tasks", []):
                        for n in task.get("item_names", []):
                            names.add(n)
                return names

            da_names = extract_item_names(da_data)
            en_names = extract_item_names(en_data)
            assert da_names, f"No item_names found in DA overview: {da_data}"
            assert en_names, f"No item_names found in EN overview: {en_data}"
            assert da_names != en_names, "item_names should differ between da and en language settings"
        finally:
            api_client.put(f"{API}/admin/settings", json={"language": "en"})
            api_client.delete(f"{API}/dragons/{dragon_id}")
