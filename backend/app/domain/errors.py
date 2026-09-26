class InvalidDateRangeError(Exception):
    """The schedule half-open interval is empty or reversed."""


class CookingClassNotFoundError(Exception):
    """The requested cooking class does not exist."""
