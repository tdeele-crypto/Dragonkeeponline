"""Seasonal light-schedule adjustment.

Bearded dragons in the wild experience shorter daylight hours in winter.
Admin configures a "summer start" and "winter start" date (day+month,
repeats every year) under Admin. During the winter period, each Time entry
(under Tasks -> Times) can have its own optional "winter time" override -
when set, tasks scheduled at that time use the winter time instead on the
Daily Overview. Times/Tasks/Schedules themselves are never modified.

For any time slot WITHOUT an explicit winter override, the time is left
UNCHANGED (it keeps its normal / summer time).
"""
from datetime import date as date_cls
from typing import Tuple


def parse_month_day(value: str) -> Tuple[int, int]:
    month_str, day_str = value.split("-")
    return int(month_str), int(day_str)


def is_in_winter_period(check_date: date_cls, summer_start: str, winter_start: str) -> bool:
    """Winter period = [winter_start, summer_start), handled circularly across
    the year boundary (whichever way it wraps)."""
    try:
        summer = parse_month_day(summer_start)
        winter = parse_month_day(winter_start)
    except Exception:
        return False
    today = (check_date.month, check_date.day)
    if winter <= summer:
        return winter <= today < summer
    return today >= winter or today < summer


def apply_winter_times(tasks: list, times_winter_map: dict) -> None:
    """Mutates `tasks` (list of dicts with 'time_id' and 'time' keys) in place
    for the winter period:
    - If a task's time slot has an explicit winter_time override, use it.
    - Otherwise the task keeps its normal (summer) time unchanged.
    Re-sorts `tasks` by the resulting time.
    """
    for t in tasks:
        override = times_winter_map.get(t["time_id"])
        if override:
            t["time"] = override

    tasks.sort(key=lambda t: t["time"])
