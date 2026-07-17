"""
Tests for GET /api/completions/calendar-summary with optional dragon_id filter.
Covers the bug fix: calendar day color should reflect the currently-viewed
dragon's completion status, not a household-wide aggregate.

Real dragons used (do not delete/modify their core data):
- Sif:   6a4635bd66e797e6db9b8f13 -> all 3 manual tasks completed on 2026-07-16 (expect green)
- logan: 6a59e9d05d53661a8cce782d -> 0 manual tasks completed on 2026-07-16 (expect red)
Aggregate (no dragon_id) on 2026-07-16 should be yellow (3/7 completed).
"""
import os
import requests
import pytest

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
SIF_ID = "6a4635bd66e797e6db9b8f13"
LOGAN_ID = "6a59e9d05d53661a8cce782d"
BUG_DATE = "2026-07-16"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _get_day(days, date_str):
    return next((d for d in days if d["date"] == date_str), None)


class TestCalendarSummaryDragonFilter:
    def test_sif_only_is_green(self, api_client):
        resp = api_client.get(
            f"{BASE_URL}/api/completions/calendar-summary",
            params={"year": 2026, "month": 7, "dragon_id": SIF_ID},
        )
        assert resp.status_code == 200
        data = resp.json()
        day = _get_day(data["days"], BUG_DATE)
        assert day is not None
        assert day["status"] == "green"
        assert day["completed"] == day["total"]
        assert day["total"] == 3

    def test_logan_only_is_red(self, api_client):
        resp = api_client.get(
            f"{BASE_URL}/api/completions/calendar-summary",
            params={"year": 2026, "month": 7, "dragon_id": LOGAN_ID},
        )
        assert resp.status_code == 200
        data = resp.json()
        day = _get_day(data["days"], BUG_DATE)
        assert day is not None
        assert day["status"] == "red"
        assert day["completed"] == 0
        assert day["total"] == 4

    def test_aggregate_no_dragon_id_is_yellow(self, api_client):
        resp = api_client.get(
            f"{BASE_URL}/api/completions/calendar-summary",
            params={"year": 2026, "month": 7},
        )
        assert resp.status_code == 200
        data = resp.json()
        day = _get_day(data["days"], BUG_DATE)
        assert day is not None
        assert day["status"] == "yellow"
        assert day["completed"] == 3
        assert day["total"] == 7

    def test_invalid_dragon_id_returns_none_status(self, api_client):
        """A dragon_id that matches no dragon should yield 'none' days (0 total),
        not an error and not a crash."""
        resp = api_client.get(
            f"{BASE_URL}/api/completions/calendar-summary",
            params={"year": 2026, "month": 7, "dragon_id": "doesnotexist"},
        )
        assert resp.status_code == 200
        data = resp.json()
        day = _get_day(data["days"], BUG_DATE)
        assert day is not None
        assert day["status"] == "none"
        assert day["total"] == 0
