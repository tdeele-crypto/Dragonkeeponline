"""
Tests for the new WEIGHT TRACKING feature:
- POST /api/dragons/{id}/weights
- GET /api/dragons/{id}/weights
- DELETE /api/weights/{entry_id}
- Cascade delete of weight_entries when dragon deleted
- Admin export includes weight_entries
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


@pytest.fixture
def test_dragon(api_client):
    payload = {
        "name": "TEST_weight_dragon",
        "gender": "Han",
        "color": "Citrus",
        "morph": "Normal",
        "birthday": "2024-01-01",
    }
    resp = api_client.post(f"{BASE_URL}/api/dragons", json=payload)
    assert resp.status_code == 200
    dragon = resp.json()
    yield dragon
    api_client.delete(f"{BASE_URL}/api/dragons/{dragon['id']}")


class TestWeightCRUD:
    def test_create_and_list_weight_entry(self, api_client, test_dragon):
        dragon_id = test_dragon["id"]
        resp = api_client.post(
            f"{BASE_URL}/api/dragons/{dragon_id}/weights",
            json={"weight_grams": 320, "note": "Efter fodring", "date": "2026-01-15"},
        )
        assert resp.status_code == 200, resp.text
        entry = resp.json()
        assert entry["weight_grams"] == 320
        assert entry["note"] == "Efter fodring"
        assert entry["dragon_id"] == dragon_id
        entry_id = entry["id"]

        list_resp = api_client.get(f"{BASE_URL}/api/dragons/{dragon_id}/weights")
        assert list_resp.status_code == 200
        entries = list_resp.json()
        assert any(e["id"] == entry_id for e in entries)

        del_resp = api_client.delete(f"{BASE_URL}/api/weights/{entry_id}")
        assert del_resp.status_code == 200
        assert del_resp.json().get("success") is True

        list_resp2 = api_client.get(f"{BASE_URL}/api/dragons/{dragon_id}/weights")
        assert not any(e["id"] == entry_id for e in list_resp2.json())

    def test_create_weight_invalid_dragon_id(self, api_client):
        resp = api_client.post(
            f"{BASE_URL}/api/dragons/invalid_id/weights",
            json={"weight_grams": 100, "date": "2026-01-15"},
        )
        assert resp.status_code == 400

    def test_create_weight_nonexistent_dragon(self, api_client):
        resp = api_client.post(
            f"{BASE_URL}/api/dragons/000000000000000000000000/weights",
            json={"weight_grams": 100, "date": "2026-01-15"},
        )
        assert resp.status_code == 404

    def test_delete_nonexistent_weight_entry(self, api_client):
        resp = api_client.delete(f"{BASE_URL}/api/weights/000000000000000000000000")
        assert resp.status_code == 404

    def test_delete_weight_invalid_id_format(self, api_client):
        resp = api_client.delete(f"{BASE_URL}/api/weights/invalid_id")
        assert resp.status_code == 400

    def test_zero_weight_allowed_by_backend(self, api_client, test_dragon):
        """Backend has no validation preventing weight_grams=0; frontend guards this."""
        dragon_id = test_dragon["id"]
        resp = api_client.post(
            f"{BASE_URL}/api/dragons/{dragon_id}/weights",
            json={"weight_grams": 0, "date": "2026-01-15"},
        )
        # document actual behavior
        if resp.status_code == 200:
            api_client.delete(f"{BASE_URL}/api/weights/{resp.json()['id']}")
        assert resp.status_code in (200, 422)


class TestWeightCascadeDelete:
    def test_dragon_delete_cascades_weight_entries(self, api_client):
        payload = {
            "name": "TEST_cascade_dragon",
            "gender": "Hun",
            "color": "Citrus",
            "morph": "Normal",
            "birthday": "2024-01-01",
        }
        resp = api_client.post(f"{BASE_URL}/api/dragons", json=payload)
        dragon_id = resp.json()["id"]

        w_resp = api_client.post(
            f"{BASE_URL}/api/dragons/{dragon_id}/weights",
            json={"weight_grams": 250, "date": "2026-01-10"},
        )
        assert w_resp.status_code == 200
        entry_id = w_resp.json()["id"]

        del_resp = api_client.delete(f"{BASE_URL}/api/dragons/{dragon_id}")
        assert del_resp.status_code == 200

        # Weight entries for this dragon should be gone (via GET, since no direct GET-by-id endpoint)
        list_resp = api_client.get(f"{BASE_URL}/api/dragons/{dragon_id}/weights")
        assert list_resp.status_code == 200
        assert list_resp.json() == []

        # Direct delete of the entry should now 404 since cascade removed it already
        del_entry_resp = api_client.delete(f"{BASE_URL}/api/weights/{entry_id}")
        assert del_entry_resp.status_code == 404


class TestAdminExportIncludesWeights:
    def test_export_contains_weight_entries_key(self, api_client, test_dragon):
        dragon_id = test_dragon["id"]
        w_resp = api_client.post(
            f"{BASE_URL}/api/dragons/{dragon_id}/weights",
            json={"weight_grams": 300, "date": "2026-01-01"},
        )
        entry_id = w_resp.json()["id"]

        export_resp = api_client.get(f"{BASE_URL}/api/admin/export")
        assert export_resp.status_code == 200
        data = export_resp.json()
        assert "weight_entries" in data
        # export uses raw mongo docs with stringified _id (consistent with other collections)
        assert any(e.get("_id") == entry_id for e in data["weight_entries"])

        api_client.delete(f"{BASE_URL}/api/weights/{entry_id}")
