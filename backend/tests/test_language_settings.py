"""
Backend tests for NEW localization settings feature on AppSettings:
- language (en/da), weight_unit (g/oz), time_format (12h/24h)
- GET/PUT /api/admin/settings persistence, defaults, and non-clobbering of
  pre-existing banner/appearance fields.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def original_settings(api_client):
    resp = api_client.get(f"{API}/admin/settings")
    assert resp.status_code == 200
    data = resp.json()
    yield data
    # restore original values after module completes
    restore_payload = {
        "language": data.get("language", "en"),
        "weight_unit": data.get("weight_unit", "g"),
        "time_format": data.get("time_format", "12h"),
    }
    api_client.put(f"{API}/admin/settings", json=restore_payload)


class TestLanguageSettingsDefaults:
    def test_get_settings_has_default_lang_fields(self, api_client, original_settings):
        # Should always have these 3 keys present with valid values (defaults or previously set)
        assert original_settings.get("language") in ("en", "da")
        assert original_settings.get("weight_unit") in ("g", "oz")
        assert original_settings.get("time_format") in ("12h", "24h")

    def test_no_mongo_objectid_leak(self, api_client, original_settings):
        assert "_id" not in original_settings


class TestLanguageSettingsUpdate:
    def test_put_updates_language_weight_time(self, api_client, original_settings):
        payload = {"language": "da", "weight_unit": "oz", "time_format": "24h"}
        resp = api_client.put(f"{API}/admin/settings", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["language"] == "da"
        assert data["weight_unit"] == "oz"
        assert data["time_format"] == "24h"

        # verify persisted via GET
        get_resp = api_client.get(f"{API}/admin/settings")
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert get_data["language"] == "da"
        assert get_data["weight_unit"] == "oz"
        assert get_data["time_format"] == "24h"

    def test_put_switch_back_to_english_defaults(self, api_client):
        payload = {"language": "en", "weight_unit": "g", "time_format": "12h"}
        resp = api_client.put(f"{API}/admin/settings", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["language"] == "en"
        assert data["weight_unit"] == "g"
        assert data["time_format"] == "12h"

    def test_put_lang_settings_does_not_clobber_banner_fields(self, api_client):
        # set a banner text first
        banner_payload = {"banner_text": "TEST_banner_lang_regress"}
        r1 = api_client.put(f"{API}/admin/settings", json=banner_payload)
        assert r1.status_code == 200
        assert r1.json()["banner_text"] == "TEST_banner_lang_regress"

        # now update only language fields
        lang_payload = {"language": "da"}
        r2 = api_client.put(f"{API}/admin/settings", json=lang_payload)
        assert r2.status_code == 200
        data = r2.json()
        assert data["language"] == "da"
        assert data["banner_text"] == "TEST_banner_lang_regress"  # not clobbered

        # cleanup banner text + reset language
        api_client.put(f"{API}/admin/settings", json={"banner_text": None, "language": "en"})

    def test_put_invalid_language_value_rejected(self, api_client):
        resp = api_client.put(f"{API}/admin/settings", json={"language": "fr"})
        assert resp.status_code == 422

    def test_put_invalid_weight_unit_rejected(self, api_client):
        resp = api_client.put(f"{API}/admin/settings", json={"weight_unit": "lb"})
        assert resp.status_code == 422

    def test_put_invalid_time_format_rejected(self, api_client):
        resp = api_client.put(f"{API}/admin/settings", json={"time_format": "48h"})
        assert resp.status_code == 422


class TestRegressionCoreEndpoints:
    """Quick smoke regression on core endpoints to ensure the new settings feature
    did not break anything else."""

    def test_dragons_list_endpoint_ok(self, api_client):
        resp = api_client.get(f"{API}/dragons")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_task_items_list_endpoint_ok(self, api_client):
        resp = api_client.get(f"{API}/task-items")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_times_list_endpoint_ok(self, api_client):
        resp = api_client.get(f"{API}/times")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_daily_overview_endpoint_ok(self, api_client):
        import datetime
        today = datetime.date.today().isoformat()
        resp = api_client.get(f"{API}/daily-overview", params={"date": today})
        assert resp.status_code == 200

    def test_admin_export_endpoint_ok(self, api_client):
        resp = api_client.get(f"{API}/admin/export")
        assert resp.status_code == 200
        data = resp.json()
        assert "dragons" in data
        assert "app_settings" in data
