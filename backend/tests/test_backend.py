"""
Backend API tests for Bearded Dragon Care app.
Covers: dragons CRUD + max-5 limit, task-items CRUD, times CRUD + duplicate/in-use guard,
schedule-slots CRUD, daily-overview computation, completions toggle.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_BACKEND_URL', 'https://bearded-buddy-log.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def cleanup_registry():
    reg = {"dragons": [], "times": [], "items": [], "slots": []}
    yield reg
    # no forced cleanup per instructions (fine to leave data behind)


class TestDragons:
    def test_create_dragon_and_verify_persistence(self, api_client, cleanup_registry):
        payload = {
            "name": "TEST_Spike",
            "gender": "Han",
            "color": "Orange",
            "morph": "Hypo Leatherback",
            "birthday": "2024-01-15",
            "age_category": "7-12",
        }
        r = api_client.post(f"{API}/dragons", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Spike"
        assert data["age_category"] == "7-12"
        assert "id" in data and "_id" not in data
        cleanup_registry["dragons"].append(data["id"])

        get_r = api_client.get(f"{API}/dragons/{data['id']}")
        assert get_r.status_code == 200
        assert get_r.json()["name"] == "TEST_Spike"

    def test_update_dragon(self, api_client, cleanup_registry):
        dragon_id = cleanup_registry["dragons"][0]
        r = api_client.put(f"{API}/dragons/{dragon_id}", json={"name": "TEST_Spike_Updated"})
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Spike_Updated"
        get_r = api_client.get(f"{API}/dragons/{dragon_id}")
        assert get_r.json()["name"] == "TEST_Spike_Updated"

    def test_get_nonexistent_dragon_404(self, api_client):
        r = api_client.get(f"{API}/dragons/000000000000000000000000")
        assert r.status_code == 404

    def test_max_5_dragons_enforced(self, api_client, cleanup_registry):
        # We already have 1 dragon from above; create up to 5 total then attempt 6th
        existing = api_client.get(f"{API}/dragons").json()
        to_create = 5 - len(existing)
        for i in range(max(to_create, 0)):
            payload = {
                "name": f"TEST_Filler{i}",
                "gender": "Ukendt",
                "color": "Grey",
                "morph": "Standard",
                "birthday": "2023-01-01",
                "age_category": "12+",
            }
            r = api_client.post(f"{API}/dragons", json=payload)
            assert r.status_code == 200
            cleanup_registry["dragons"].append(r.json()["id"])

        count_r = api_client.get(f"{API}/dragons")
        assert len(count_r.json()) == 5

        sixth_payload = {
            "name": "TEST_Sixth",
            "gender": "Han",
            "color": "Red",
            "morph": "Standard",
            "birthday": "2023-01-01",
            "age_category": "2-4",
        }
        r = api_client.post(f"{API}/dragons", json=sixth_payload)
        assert r.status_code == 400
        assert "Maksimalt" in r.json()["detail"]

    def test_delete_dragon(self, api_client, cleanup_registry):
        dragon_id = cleanup_registry["dragons"].pop()
        r = api_client.delete(f"{API}/dragons/{dragon_id}")
        assert r.status_code == 200
        get_r = api_client.get(f"{API}/dragons/{dragon_id}")
        assert get_r.status_code == 404


class TestTimes:
    def test_create_time_and_verify(self, api_client, cleanup_registry):
        r = api_client.post(f"{API}/times", json={"time": "08:30"})
        assert r.status_code == 200
        data = r.json()
        assert data["time"] == "08:30"
        cleanup_registry["times"].append(data["id"])
        get_r = api_client.get(f"{API}/times")
        assert any(t["time"] == "08:30" for t in get_r.json())

    def test_duplicate_time_rejected(self, api_client):
        r = api_client.post(f"{API}/times", json={"time": "08:30"})
        assert r.status_code == 400
        assert "findes allerede" in r.json()["detail"]

    def test_delete_time(self, api_client, cleanup_registry):
        r = api_client.post(f"{API}/times", json={"time": "09:15"})
        time_id = r.json()["id"]
        del_r = api_client.delete(f"{API}/times/{time_id}")
        assert del_r.status_code == 200
        get_r = api_client.get(f"{API}/times")
        assert not any(t["id"] == time_id for t in get_r.json())


class TestTaskItems:
    def test_create_and_list_task_item(self, api_client, cleanup_registry):
        r = api_client.post(f"{API}/task-items", json={"category": "fodring", "name": "TEST_Larver"})
        assert r.status_code == 200
        data = r.json()
        assert data["category"] == "fodring"
        cleanup_registry["items"].append(data["id"])
        list_r = api_client.get(f"{API}/task-items?category=fodring")
        assert any(i["id"] == data["id"] for i in list_r.json())

    def test_delete_task_item(self, api_client):
        r = api_client.post(f"{API}/task-items", json={"category": "pleje", "name": "TEST_Bad"})
        item_id = r.json()["id"]
        del_r = api_client.delete(f"{API}/task-items/{item_id}")
        assert del_r.status_code == 200
        list_r = api_client.get(f"{API}/task-items?category=pleje")
        assert not any(i["id"] == item_id for i in list_r.json())


class TestScheduleSlotsAndOverview:
    def test_full_flow_schedule_and_overview(self, api_client, cleanup_registry):
        # Setup: dragon, time, item, schedule slot
        dragon_r = api_client.post(f"{API}/dragons", json={
            "name": "TEST_OverviewDragon", "gender": "Hun", "color": "Yellow",
            "morph": "Citrus", "birthday": "2025-06-01", "age_category": "2-4",
        })
        dragon = dragon_r.json()

        time_r = api_client.post(f"{API}/times", json={"time": "07:00"})
        time_slot = time_r.json()

        item_r = api_client.post(f"{API}/task-items", json={"category": "fodring", "name": "TEST_Cricket"})
        item = item_r.json()

        # find day_of_week for today via overview computation, but we schedule for known day
        import datetime
        today = datetime.date.today()
        day_names = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
        dow = day_names[today.weekday()]

        slot_r = api_client.post(f"{API}/schedule-slots", json={
            "age_category": "2-4",
            "day_of_week": dow,
            "time_id": time_slot["id"],
            "category": "fodring",
            "item_ids": [item["id"]],
            "is_automatic": False,
        })
        assert slot_r.status_code == 200
        slot = slot_r.json()

        # daily overview for today should include this dragon+task
        overview_r = api_client.get(f"{API}/daily-overview?date={today.isoformat()}")
        assert overview_r.status_code == 200
        overview = overview_r.json()
        assert overview["day_of_week"] == dow
        dragon_entry = next((d for d in overview["dragons"] if d["dragon_id"] == dragon["id"]), None)
        assert dragon_entry is not None, "Dragon missing from overview"
        task = next((t for t in dragon_entry["tasks"] if t["slot_id"] == slot["id"]), None)
        assert task is not None, "Schedule slot task missing from overview"
        assert task["time"] == "07:00"
        assert task["item_names"] == ["TEST_Cricket"]
        assert task["completed"] is False

        # toggle completion
        toggle_r = api_client.post(f"{API}/completions/toggle", json={
            "dragon_id": dragon["id"], "schedule_slot_id": slot["id"], "date": today.isoformat(),
        })
        assert toggle_r.status_code == 200
        assert toggle_r.json()["completed"] is True

        overview_r2 = api_client.get(f"{API}/daily-overview?date={today.isoformat()}")
        dragon_entry2 = next(d for d in overview_r2.json()["dragons"] if d["dragon_id"] == dragon["id"])
        task2 = next(t for t in dragon_entry2["tasks"] if t["slot_id"] == slot["id"])
        assert task2["completed"] is True

        # toggle back
        toggle_r2 = api_client.post(f"{API}/completions/toggle", json={
            "dragon_id": dragon["id"], "schedule_slot_id": slot["id"], "date": today.isoformat(),
        })
        assert toggle_r2.json()["completed"] is False

        # deleting item removes it from slot's item_ids
        api_client.delete(f"{API}/task-items/{item['id']}")
        slots_r = api_client.get(f"{API}/schedule-slots?age_category=2-4&day_of_week={dow}")
        updated_slot = next(s for s in slots_r.json() if s["id"] == slot["id"])
        assert item["id"] not in updated_slot["item_ids"]

        # deleting time in use should be blocked with 400
        time_del_r = api_client.delete(f"{API}/times/{time_slot['id']}")
        assert time_del_r.status_code == 400
        assert "bruges" in time_del_r.json()["detail"]

        # cleanup slot then time then dragon
        api_client.delete(f"{API}/schedule-slots/{slot['id']}")
        api_client.delete(f"{API}/times/{time_slot['id']}")
        api_client.delete(f"{API}/dragons/{dragon['id']}")

    def test_update_schedule_slot(self, api_client):
        time_r = api_client.post(f"{API}/times", json={"time": "20:00"})
        time_slot = time_r.json()
        item_r = api_client.post(f"{API}/task-items", json={"category": "lys", "name": "TEST_UVB"})
        item = item_r.json()
        slot_r = api_client.post(f"{API}/schedule-slots", json={
            "age_category": "4-7", "day_of_week": "mandag", "time_id": time_slot["id"],
            "category": "lys", "item_ids": [item["id"]], "is_automatic": True,
        })
        slot = slot_r.json()
        upd_r = api_client.put(f"{API}/schedule-slots/{slot['id']}", json={"is_automatic": False})
        assert upd_r.status_code == 200
        assert upd_r.json()["is_automatic"] is False

        del_r = api_client.delete(f"{API}/schedule-slots/{slot['id']}")
        assert del_r.status_code == 200
        api_client.delete(f"{API}/times/{time_slot['id']}")
        api_client.delete(f"{API}/task-items/{item['id']}")

    def test_delete_nonexistent_slot_404(self, api_client):
        r = api_client.delete(f"{API}/schedule-slots/000000000000000000000000")
        assert r.status_code == 404


class TestValidation:
    def test_invalid_age_category_rejected(self, api_client):
        r = api_client.post(f"{API}/dragons", json={
            "name": "TEST_Bad", "gender": "Han", "color": "X", "morph": "X",
            "birthday": "2024-01-01", "age_category": "invalid-cat",
        })
        assert r.status_code == 422

    def test_invalid_date_format_overview(self, api_client):
        r = api_client.get(f"{API}/daily-overview?date=not-a-date")
        assert r.status_code == 400
