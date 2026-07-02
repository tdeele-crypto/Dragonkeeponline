"""
Backend API tests for Skægagamer (Bearded Dragon Care) app.
Covers: dragons CRUD + max-5 limit + AUTOMATIC age_category computation from birthday,
task-items CRUD, times CRUD + duplicate/in-use guard, schedule-slots CRUD,
NEW bulk-copy schedule-slots endpoint, daily-overview computation (age-category matching),
completions toggle.
"""
import os
import datetime
import pytest
import requests

BASE_URL = os.environ.get('EXPO_BACKEND_URL', 'https://bearded-buddy-log.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def months_ago_date(months: int) -> str:
    today = datetime.date.today()
    year = today.year
    month = today.month - months
    while month <= 0:
        month += 12
        year -= 1
    day = min(today.day, 28)
    return datetime.date(year, month, day).isoformat()


def expected_category(months: int) -> str:
    if months < 4:
        return "2-4"
    if months < 7:
        return "4-7"
    if months < 12:
        return "7-12"
    return "12+"


# ---------------------------------------------------------------------------
# Dragons: CRUD + automatic age category computation (feature A)
# ---------------------------------------------------------------------------
class TestDragonsAgeCategory:
    def test_create_dragon_age_category_ignored_and_computed(self, api_client):
        """DragonCreate no longer has age_category field - sending it should be ignored,
        and the real value should be computed from birthday (~3 months -> '2-4')."""
        payload = {
            "name": "TEST_Spike",
            "gender": "Han",
            "color": "Orange",
            "morph": "Hypo Leatherback",
            "birthday": months_ago_date(3),
            "age_category": "12+",  # should be ignored by backend
        }
        r = api_client.post(f"{API}/dragons", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Spike"
        assert data["age_category"] == "2-4", f"Expected computed '2-4', got {data['age_category']}"
        assert "id" in data and "_id" not in data
        dragon_id = data["id"]

        get_r = api_client.get(f"{API}/dragons/{dragon_id}")
        assert get_r.status_code == 200
        assert get_r.json()["age_category"] == "2-4"

        api_client.delete(f"{API}/dragons/{dragon_id}")

    @pytest.mark.parametrize("months,expected", [(3, "2-4"), (5, "4-7"), (9, "7-12"), (14, "12+")])
    def test_various_birthdays_compute_correct_category(self, api_client, months, expected):
        payload = {
            "name": f"TEST_Age{months}",
            "gender": "Ukendt",
            "color": "Grey",
            "morph": "Standard",
            "birthday": months_ago_date(months),
        }
        r = api_client.post(f"{API}/dragons", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["age_category"] == expected, f"months={months} expected {expected} got {data['age_category']}"

        list_r = api_client.get(f"{API}/dragons")
        listed = next(d for d in list_r.json() if d["id"] == data["id"])
        assert listed["age_category"] == expected

        api_client.delete(f"{API}/dragons/{data['id']}")

    def test_update_birthday_recomputes_age_category(self, api_client):
        create_r = api_client.post(f"{API}/dragons", json={
            "name": "TEST_Recompute", "gender": "Hun", "color": "Yellow",
            "morph": "Citrus", "birthday": months_ago_date(3),
        })
        dragon = create_r.json()
        assert dragon["age_category"] == "2-4"

        upd_r = api_client.put(f"{API}/dragons/{dragon['id']}", json={"birthday": months_ago_date(13)})
        assert upd_r.status_code == 200
        assert upd_r.json()["age_category"] == "12+"

        get_r = api_client.get(f"{API}/dragons/{dragon['id']}")
        assert get_r.json()["age_category"] == "12+"

        api_client.delete(f"{API}/dragons/{dragon['id']}")

    def test_get_nonexistent_dragon_404(self, api_client):
        r = api_client.get(f"{API}/dragons/000000000000000000000000")
        assert r.status_code == 404

    def test_unlimited_dragons_no_cap_enforced(self, api_client):
        """MAX_DRAGONS cap was intentionally removed (unlimited dragons feature).
        A 6th dragon should succeed with 200, not be rejected with 400."""
        existing = api_client.get(f"{API}/dragons").json()
        created_ids = []
        to_create = max(5 - len(existing), 0)
        for i in range(to_create):
            r = api_client.post(f"{API}/dragons", json={
                "name": f"TEST_Filler{i}", "gender": "Ukendt", "color": "Grey",
                "morph": "Standard", "birthday": months_ago_date(20),
            })
            assert r.status_code == 200
            created_ids.append(r.json()["id"])

        sixth_r = api_client.post(f"{API}/dragons", json={
            "name": "TEST_Sixth", "gender": "Han", "color": "Red",
            "morph": "Standard", "birthday": months_ago_date(1),
        })
        assert sixth_r.status_code == 200
        created_ids.append(sixth_r.json()["id"])

        for did in created_ids:
            api_client.delete(f"{API}/dragons/{did}")

        for did in created_ids:
            api_client.delete(f"{API}/dragons/{did}")


# ---------------------------------------------------------------------------
# Times & Task Items (regression)
# ---------------------------------------------------------------------------
class TestTimesAndItems:
    def test_create_time_and_verify(self, api_client):
        r = api_client.post(f"{API}/times", json={"time": "TEST_08:31"})
        assert r.status_code == 200
        data = r.json()
        cleanup_id = data["id"]
        get_r = api_client.get(f"{API}/times")
        assert any(t["id"] == cleanup_id for t in get_r.json())
        api_client.delete(f"{API}/times/{cleanup_id}")

    def test_create_and_delete_task_item(self, api_client):
        r = api_client.post(f"{API}/task-items", json={"category": "fodring", "name": "TEST_Larver"})
        assert r.status_code == 200
        data = r.json()
        del_r = api_client.delete(f"{API}/task-items/{data['id']}")
        assert del_r.status_code == 200
        list_r = api_client.get(f"{API}/task-items?category=fodring")
        assert not any(i["id"] == data["id"] for i in list_r.json())


# ---------------------------------------------------------------------------
# Schedule slots: CRUD, bulk-copy (feature B), overview age-matching
# ---------------------------------------------------------------------------
class TestScheduleSlotsBulkCopyAndOverview:
    @pytest.fixture()
    def setup_time_item(self, api_client):
        time_r = api_client.post(f"{API}/times", json={"time": "TEST_07:01"})
        item_r = api_client.post(f"{API}/task-items", json={"category": "fodring", "name": "TEST_Cricket"})
        time_slot = time_r.json()
        item = item_r.json()
        yield time_slot, item
        api_client.delete(f"{API}/times/{time_slot['id']}")
        api_client.delete(f"{API}/task-items/{item['id']}")

    def test_bulk_copy_creates_cartesian_product(self, api_client, setup_time_item):
        time_slot, item = setup_time_item
        payload = {
            "day_of_weeks": ["mandag", "tirsdag"],
            "age_categories": ["2-4", "4-7"],
            "time_id": time_slot["id"],
            "category": "fodring",
            "item_ids": [item["id"]],
            "is_automatic": False,
        }
        r = api_client.post(f"{API}/schedule-slots/bulk-copy", json=payload)
        assert r.status_code == 200, r.text
        results = r.json()
        assert len(results) == 4
        combos = {(s["day_of_week"], s["age_category"]) for s in results}
        assert combos == {("mandag", "2-4"), ("mandag", "4-7"), ("tirsdag", "2-4"), ("tirsdag", "4-7")}

        get_r = api_client.get(f"{API}/schedule-slots?age_category=2-4&day_of_week=mandag")
        assert get_r.status_code == 200
        matching = [s for s in get_r.json() if s["time_id"] == time_slot["id"] and s["category"] == "fodring"]
        assert len(matching) == 1
        assert matching[0]["item_ids"] == [item["id"]]

        for s in results:
            api_client.delete(f"{API}/schedule-slots/{s['id']}")

    def test_bulk_copy_upserts_existing_slot_not_duplicate(self, api_client, setup_time_item):
        time_slot, item = setup_time_item
        # create initial slot for mandag/2-4
        create_r = api_client.post(f"{API}/schedule-slots", json={
            "age_category": "2-4", "day_of_week": "mandag", "time_id": time_slot["id"],
            "category": "fodring", "item_ids": [item["id"]], "is_automatic": False,
        })
        original_slot = create_r.json()

        other_item_r = api_client.post(f"{API}/task-items", json={"category": "fodring", "name": "TEST_OtherFood"})
        other_item = other_item_r.json()

        # bulk-copy same time+category to mandag/2-4 (existing) and onsdag/2-4 (new) with DIFFERENT items
        bulk_r = api_client.post(f"{API}/schedule-slots/bulk-copy", json={
            "day_of_weeks": ["mandag", "onsdag"],
            "age_categories": ["2-4"],
            "time_id": time_slot["id"],
            "category": "fodring",
            "item_ids": [other_item["id"]],
            "is_automatic": False,
        })
        assert bulk_r.status_code == 200
        results = bulk_r.json()
        assert len(results) == 2

        get_r = api_client.get(f"{API}/schedule-slots?age_category=2-4&day_of_week=mandag")
        mandag_slots = [s for s in get_r.json() if s["time_id"] == time_slot["id"] and s["category"] == "fodring"]
        assert len(mandag_slots) == 1, "Should overwrite, not duplicate"
        assert mandag_slots[0]["id"] == original_slot["id"]
        assert mandag_slots[0]["item_ids"] == [other_item["id"]], "items should be overwritten"

        for s in results:
            api_client.delete(f"{API}/schedule-slots/{s['id']}")
        api_client.delete(f"{API}/task-items/{other_item['id']}")

    def test_full_flow_schedule_and_overview_age_matching(self, api_client, setup_time_item):
        time_slot, item = setup_time_item
        dragon_r = api_client.post(f"{API}/dragons", json={
            "name": "TEST_OverviewDragon", "gender": "Hun", "color": "Yellow",
            "morph": "Citrus", "birthday": months_ago_date(2),
        })
        dragon = dragon_r.json()
        assert dragon["age_category"] == "2-4"

        today = datetime.date.today()
        day_names = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
        dow = day_names[today.weekday()]

        slot_r = api_client.post(f"{API}/schedule-slots", json={
            "age_category": "2-4", "day_of_week": dow, "time_id": time_slot["id"],
            "category": "fodring", "item_ids": [item["id"]], "is_automatic": False,
        })
        slot = slot_r.json()

        overview_r = api_client.get(f"{API}/daily-overview?date={today.isoformat()}")
        assert overview_r.status_code == 200
        overview = overview_r.json()
        dragon_entry = next((d for d in overview["dragons"] if d["dragon_id"] == dragon["id"]), None)
        assert dragon_entry is not None
        assert dragon_entry["age_category"] == "2-4"
        task = next((t for t in dragon_entry["tasks"] if t["slot_id"] == slot["id"]), None)
        assert task is not None
        assert task["completed"] is False

        # toggle completion
        toggle_r = api_client.post(f"{API}/completions/toggle", json={
            "dragon_id": dragon["id"], "schedule_slot_id": slot["id"], "date": today.isoformat(),
        })
        assert toggle_r.json()["completed"] is True

        # now change dragon birthday so it ages out of 2-4 bracket -> overview should no longer show that task
        api_client.put(f"{API}/dragons/{dragon['id']}", json={"birthday": months_ago_date(9)})
        overview_r2 = api_client.get(f"{API}/daily-overview?date={today.isoformat()}")
        dragon_entry2 = next(d for d in overview_r2.json()["dragons"] if d["dragon_id"] == dragon["id"])
        assert dragon_entry2["age_category"] == "7-12"
        assert not any(t["slot_id"] == slot["id"] for t in dragon_entry2["tasks"]), \
            "Task for old age bracket should no longer appear after dragon aged into new bracket"

        api_client.delete(f"{API}/schedule-slots/{slot['id']}")
        api_client.delete(f"{API}/dragons/{dragon['id']}")

    def test_update_schedule_slot_normal_regression(self, api_client, setup_time_item):
        time_slot, item = setup_time_item
        slot_r = api_client.post(f"{API}/schedule-slots", json={
            "age_category": "4-7", "day_of_week": "mandag", "time_id": time_slot["id"],
            "category": "fodring", "item_ids": [item["id"]], "is_automatic": True,
        })
        slot = slot_r.json()
        upd_r = api_client.put(f"{API}/schedule-slots/{slot['id']}", json={"is_automatic": False})
        assert upd_r.status_code == 200
        assert upd_r.json()["is_automatic"] is False

        del_r = api_client.delete(f"{API}/schedule-slots/{slot['id']}")
        assert del_r.status_code == 200

    def test_delete_nonexistent_slot_404(self, api_client):
        r = api_client.delete(f"{API}/schedule-slots/000000000000000000000000")
        assert r.status_code == 404


class TestValidation:
    def test_invalid_gender_rejected(self, api_client):
        r = api_client.post(f"{API}/dragons", json={
            "name": "TEST_Bad", "gender": "InvalidGender", "color": "X", "morph": "X",
            "birthday": "2024-01-01",
        })
        assert r.status_code == 422

    def test_invalid_date_format_overview(self, api_client):
        r = api_client.get(f"{API}/daily-overview?date=not-a-date")
        assert r.status_code == 400
