"""Seasonal light-schedule adjustment.

Bearded dragons in the wild experience shorter daylight hours in winter.
Admin configures a "summer start" and "winter start" date (day+month,
repeats every year) under Admin. During the winter period, each Time entry
(under Tasks -> Times) can have its own optional "winter time" override -
when set, tasks scheduled at that time use the winter time instead on the
Daily Overview. Times/Tasks/Schedules themselves are never modified.

For any time slot WITHOUT an explicit winter override, the fallback rule is:
the task starts 30 minutes after the day's "lys tændt" (light-on) time - i.e.
the earliest 'lys' (Light & Heat) task of the day (using its winter-adjusted
time, if that slot itself has an override). The light-on slot itself is left
unchanged unless it has its own explicit winter override.
"""
from datetime import date as date_cls
from typing import Tuple

LYS_ON_FALLBACK_OFFSET_MINUTES = 30


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


def shift_time_str(time_str: str, minutes_delta: int) -> str:
    """Shift a 'HH:MM' string by minutes_delta, clamped to the same day (00:00-23:59)."""
    try:
        h, m = map(int, time_str.split(":"))
    except Exception:
        return time_str
    total = h * 60 + m + minutes_delta
    total = max(0, min(23 * 60 + 59, total))
    return f"{total // 60:02d}:{total % 60:02d}"


def apply_winter_times(tasks: list, times_winter_map: dict) -> None:
    """Mutates `tasks` (list of dicts with 'time_id', 'time', 'category' keys)
    in place for the winter period:
    - If a task's time slot has an explicit winter_time override, use it.
    - Otherwise, the earliest 'lys' task of the day ("lys tændt" / light-on)
      is left unchanged (unless it itself has an override, handled above).
    - Every other task without its own override starts
      LYS_ON_FALLBACK_OFFSET_MINUTES after the effective light-on time.
    Re-sorts `tasks` by the resulting time.
    """
    lys_tasks = [t for t in tasks if t["category"] == "lys"]
    lys_on_time_id = None
    lys_on_effective = None
    if lys_tasks:
        lys_on = min(lys_tasks, key=lambda t: t["time"])
        lys_on_time_id = lys_on["time_id"]
        lys_on_effective = times_winter_map.get(lys_on_time_id) or lys_on["time"]

    for t in tasks:
        override = times_winter_map.get(t["time_id"])
        if override:
            t["time"] = override
        elif t["time_id"] == lys_on_time_id:
            continue
        elif lys_on_effective:
            t["time"] = shift_time_str(lys_on_effective, LYS_ON_FALLBACK_OFFSET_MINUTES)

    tasks.sort(key=lambda t: t["time"])
