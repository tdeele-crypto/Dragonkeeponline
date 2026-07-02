"""
Backend tests for Admin App-udseende feature: app_bg_color + page_title_color
on AppSettings model, verifying PUT /api/admin/settings persists these fields
without clobbering pre-existing banner settings (banner_image_base64,
banner_text, banner_bg_color, heading_color).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def original_settings(api_client):
    """Capture settings before test run so we can restore them after."""
    resp = api_client.get(f"{API}/admin/settings")
    assert resp.status_code == 200
    data = resp.json()
    yield data
    # restore original values (all fields) after test module completes
    restore_payload = {
        "banner_image_base64": data.get("banner_image_base64"),
        "banner_text": data.get("banner_text"),
        "banner_bg_color": data.get("banner_bg_color"),
        "heading_color": data.get("heading_color"),
        "app_bg_color": data.get("app_bg_color"),
        "page_title_color": data.get("page_title_color"),
    }
    api_client.put(f"{API}/admin/settings", json=restore_payload)


class TestAppearanceSettingsPersistence:
    def test_put_app_bg_and_title_color_persists(self, api_client, original_settings):
        payload = {"app_bg_color": "#3D405B", "page_title_color": "#FFFFFF"}
        put_resp = api_client.put(f"{API}/admin/settings", json=payload)
        assert put_resp.status_code == 200
        put_data = put_resp.json()
        assert put_data["app_bg_color"] == "#3D405B"
        assert put_data["page_title_color"] == "#FFFFFF"

        # GET to verify persistence
        get_resp = api_client.get(f"{API}/admin/settings")
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert get_data["app_bg_color"] == "#3D405B"
        assert get_data["page_title_color"] == "#FFFFFF"

    def test_appearance_update_does_not_clobber_banner_fields(self, api_client, original_settings):
        # First set distinct banner settings
        banner_payload = {
            "banner_text": "TEST_banner_text_for_appearance_check",
            "banner_bg_color": "#81B29A",
            "heading_color": "#E07A5F",
        }
        r1 = api_client.put(f"{API}/admin/settings", json=banner_payload)
        assert r1.status_code == 200
        assert r1.json()["banner_bg_color"] == "#81B29A"
        assert r1.json()["heading_color"] == "#E07A5F"
        assert r1.json()["banner_text"] == "TEST_banner_text_for_appearance_check"

        # Now update ONLY appearance fields (mimics handleSaveAppearance in admin.tsx)
        appearance_payload = {"app_bg_color": "#5B8FB9", "page_title_color": "#1C1917"}
        r2 = api_client.put(f"{API}/admin/settings", json=appearance_payload)
        assert r2.status_code == 200
        data = r2.json()
        assert data["app_bg_color"] == "#5B8FB9"
        assert data["page_title_color"] == "#1C1917"
        # Banner fields must remain untouched
        assert data["banner_bg_color"] == "#81B29A"
        assert data["heading_color"] == "#E07A5F"
        assert data["banner_text"] == "TEST_banner_text_for_appearance_check"

        # Verify via fresh GET too
        get_resp = api_client.get(f"{API}/admin/settings")
        get_data = get_resp.json()
        assert get_data["banner_bg_color"] == "#81B29A"
        assert get_data["heading_color"] == "#E07A5F"
        assert get_data["app_bg_color"] == "#5B8FB9"
        assert get_data["page_title_color"] == "#1C1917"

    def test_none_reset_of_appearance_colors(self, api_client, original_settings):
        # Set colors first
        api_client.put(f"{API}/admin/settings", json={"app_bg_color": "#D64545", "page_title_color": "#78716C"})
        # Reset to None (simulates tapping the "X"/none swatch)
        reset_resp = api_client.put(f"{API}/admin/settings", json={"app_bg_color": None, "page_title_color": None})
        assert reset_resp.status_code == 200
        data = reset_resp.json()
        assert data["app_bg_color"] is None
        assert data["page_title_color"] is None

        get_resp = api_client.get(f"{API}/admin/settings")
        get_data = get_resp.json()
        assert get_data["app_bg_color"] is None
        assert get_data["page_title_color"] is None

    def test_mongodb_id_excluded_and_no_objectid_leak(self, api_client):
        resp = api_client.get(f"{API}/admin/settings")
        data = resp.json()
        assert "_id" not in data
        assert "id" in data
