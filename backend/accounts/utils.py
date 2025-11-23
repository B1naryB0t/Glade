# backend/accounts/utils.py
from datetime import datetime

import pytz
from django.utils import timezone as django_tz


def convert_to_user_timezone(dt, user_timezone="UTC"):
    """
    Convert a datetime object to the user's timezone

    Args:
        dt: datetime object (should be timezone-aware)
        user_timezone: string name of timezone (e.g., 'America/New_York')

    Returns:
        datetime object in user's timezone
    """
    if not dt:
        return None

    # Ensure datetime is timezone-aware
    if dt.tzinfo is None:
        dt = django_tz.make_aware(dt, pytz.UTC)

    # Convert to user's timezone
    user_tz = pytz.timezone(user_timezone)
    return dt.astimezone(user_tz)


def format_datetime_for_user(dt, user, format_string="%Y-%m-%d %H:%M:%S %Z"):
    """
    Format a datetime for display to a specific user in their timezone

    Args:
        dt: datetime object
        user: User model instance
        format_string: strftime format string

    Returns:
        Formatted string in user's timezone
    """
    if not dt:
        return None

    user_dt = convert_to_user_timezone(dt, user.timezone)
    return user_dt.strftime(format_string)


def get_user_current_time(user):
    """
    Get the current time in the user's timezone

    Args:
        user: User model instance

    Returns:
        Current datetime in user's timezone
    """
    now_utc = django_tz.now()
    return convert_to_user_timezone(now_utc, user.timezone)


def get_timezone_choices_grouped():
    """
    Return timezone choices grouped by region for better UI display

    Returns:
        Dictionary with region keys and timezone lists as values
    """
    grouped = {}

    for tz in pytz.common_timezones:
        parts = tz.split("/", 1)
        region = parts[0] if len(parts) > 1 else "Other"

        if region not in grouped:
            grouped[region] = []

        grouped[region].append(tz)

    return grouped


def validate_timezone(timezone_str):
    """
    Validate that a timezone string is valid

    Args:
        timezone_str: String name of timezone

    Returns:
        Boolean indicating if timezone is valid
    """
    return timezone_str in pytz.all_timezones
