"""
Tests for session's 4 new features:
1. Unlimited dragons (no MAX_DRAGONS cap)
2. DELETE /api/schedule-slots/{id}?all_days=true bulk delete + regression single delete
3. Admin appearance page_title_color persistence (used by index/dragons/schedule/DragonColumn UI)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def make_dragon_payload(name):
    return {
        "name": name,
        "gender": "Han",
        "color": "Citrus",
        "morph": "Normal",
        "birthday": "2024-01-01",
    }


class TestUnlimitedDragons:
    """Verify MAX_DRAGONS cap removed - can create more than 5 dragons"""

    created_ids = []

    def test_create_more_than_5_dragons_no_error(self, api_client):
        created_ids = []
        try:
            for i in range(7):
                resp = api_client.post(f"{BASE_URL}/api/dragons", json=make_dragon_payload(f"TEST_dragon_{i}"))
                assert resp.status_code == 200, f"Dragon #{i} creation failed: {resp.status_code} {resp.text}"
                data = resp.json()
                assert data["name"] == f"TEST_dragon_{i}"
                created_ids.append(data["id"])
            # confirm list has at least 7 more than before (no 400 raised for 6th/7th dragon)
            list_resp = api_client.get(f"{BASE_URL}/api/dragons")
            assert list_resp.status_code == 200
            all_names = [d["name"] for d in list_resp.json()]
            for i in range(7):
                assert f"TEST_dragon_{i}" in all_names
        finally:
            for did in created_ids:
                api_client.delete(f"{BASE_URL}/api/dragons/{did}")


class TestScheduleSlotBulkDelete:
    """Verify all_days=true deletes matching slots across days, regression single delete unaffected"""

    def test_bulk_delete_all_days_and_single_delete_regression(self, api_client):
        age_category = "2-4"
        time_id = "TEST_time_bulk"
        category = "fodring"
        item_ids = []

        # Create a time slot to reference (times collection may require existing time_id; use raw string is fine since schema doesn't validate FK)
        days = ["mandag", "tirsdag", "onsdag"]
        created_slot_ids = []
        control_id = None
        try:
            for day in days:
                resp = api_client.post(f"{BASE_URL}/api/schedule-slots", json={
                    "age_category": age_category,
                    "day_of_week": day,
                    "time_id": time_id,
                    "category": category,
                    "item_ids": item_ids,
                    "is_automatic": False,
                })
                assert resp.status_code == 200, resp.text
                created_slot_ids.append(resp.json()["id"])

            # Create a control slot with different category - should NOT be affected
            control_resp = api_client.post(f"{BASE_URL}/api/schedule-slots", json={
                "age_category": age_category,
                "day_of_week": "torsdag",
                "time_id": time_id,
                "category": "pleje",
                "item_ids": item_ids,
                "is_automatic": False,
            })
            assert control_resp.status_code == 200, control_resp.text
            control_id = control_resp.json()["id"]

            # Regression: delete single slot without all_days -> only that one removed
            single_delete_resp = api_client.delete(f"{BASE_URL}/api/schedule-slots/{created_slot_ids[0]}")
            assert single_delete_resp.status_code == 200
            body = single_delete_resp.json()
            assert body.get("deleted_count") == 1

            # Verify other slots (mandag deleted, tirsdag+onsdag still exist)
            list_resp = api_client.get(f"{BASE_URL}/api/schedule-slots?age_category={age_category}&day_of_week=tirsdag")
            remaining_ids = [s["id"] for s in list_resp.json()]
            assert created_slot_ids[1] in remaining_ids

            # Bulk delete remaining matching slots with all_days=true
            bulk_delete_resp = api_client.delete(f"{BASE_URL}/api/schedule-slots/{created_slot_ids[1]}?all_days=true")
            assert bulk_delete_resp.status_code == 200
            bulk_body = bulk_delete_resp.json()
            assert bulk_body.get("deleted_count") == 2  # tirsdag + onsdag remain matching

            # Verify tirsdag + onsdag slots gone
            for day in ["tirsdag", "onsdag"]:
                list_resp = api_client.get(f"{BASE_URL}/api/schedule-slots?age_category={age_category}&day_of_week={day}")
                ids = [s["id"] for s in list_resp.json()]
                assert created_slot_ids[1] not in ids
                assert created_slot_ids[2] not in ids

            # Verify control slot (different category) still exists - not affected by bulk delete
            control_list_resp = api_client.get(f"{BASE_URL}/api/schedule-slots?age_category={age_category}&day_of_week=torsdag")
            control_ids = [s["id"] for s in control_list_resp.json()]
            assert control_id in control_ids
        finally:
            # cleanup any leftover
            for sid in created_slot_ids:
                api_client.delete(f"{BASE_URL}/api/schedule-slots/{sid}")
            if control_id:
                api_client.delete(f"{BASE_URL}/api/schedule-slots/{control_id}")


class TestAdminAppearancePersistence:
    """Regression: page_title_color / app_bg_color still persist correctly via admin settings API"""

    def test_page_title_color_persists(self, api_client):
        resp = api_client.put(f"{BASE_URL}/api/admin/settings", json={"page_title_color": "#8E7DBE"})
        assert resp.status_code == 200
        get_resp = api_client.get(f"{BASE_URL}/api/admin/settings")
        assert get_resp.status_code == 200
        assert get_resp.json().get("page_title_color") == "#8E7DBE"
        # reset
        api_client.put(f"{BASE_URL}/api/admin/settings", json={"page_title_color": None})
