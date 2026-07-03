"""Seasonal light-schedule adjustment.

Bearded dragons in the wild experience shorter daylight hours in winter.
Admin lets the user configure a "summer start" and "winter start" date
(day+month, repeats every year) plus how many hours shorter the winter photo-
period should be. During the winter period, the earliest "lys" (light/heat)
task of the day is pushed later by half that amount, and the latest one is
pulled earlier by half that amount - i.e. the day is symmetrically shortened
from both ends. Outside the winter period (summer), times are shown exactly
as configured in the Schedule (no adjustment).
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


def shift_time_str(time_str: str, minutes_delta: int) -> str:
    """Shift a 'HH:MM' string by minutes_delta, clamped to the same day (00:00-23:59)."""
    try:
        h, m = map(int, time_str.split(":"))
    except Exception:
        return time_str
    total = h * 60 + m + minutes_delta
    total = max(0, min(23 * 60 + 59, total))
    return f"{total // 60:02d}:{total % 60:02d}"


def apply_winter_light_shift(tasks: list, shift_minutes: int) -> None:
    """Mutates `tasks` (list of dicts with 'category' and 'time' keys) in
    place: pushes the earliest 'lys' task later and the latest 'lys' task
    earlier by shift_minutes. No-op if there aren't at least 2 distinct
    'lys' times that day (can't tell which is 'on' vs 'off')."""
    if shift_minutes <= 0:
        return
    lys_times = sorted({t["time"] for t in tasks if t["category"] == "lys"})
    if len(lys_times) < 2:
        return
    earliest, latest = lys_times[0], lys_times[-1]
    for t in tasks:
        if t["category"] != "lys":
            continue
        if t["time"] == earliest:
            t["time"] = shift_time_str(earliest, shift_minutes)
        elif t["time"] == latest:
            t["time"] = shift_time_str(latest, -shift_minutes)
    tasks.sort(key=lambda t: t["time"])
