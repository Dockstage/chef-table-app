class InvalidDateRangeError(Exception):
    """The schedule half-open interval is empty or reversed."""


class CookingClassNotFoundError(Exception):
    """The requested cooking class does not exist."""


class SlotFullError(Exception):
    """The cooking class has no seats left."""


class SlotCancelledError(Exception):
    """The studio cancelled the cooking class."""


class SlotNotBookableError(Exception):
    """The cooking class cannot accept new bookings."""


class DuplicateBookingError(Exception):
    """The client already has an active booking for the class."""


class RentalUnavailableError(Exception):
    """The cooking class has no rental kits left."""


class IdempotencyConflictError(Exception):
    """The idempotency key was used with a different payload."""


class BookingNotFoundError(Exception):
    """The requested booking does not belong to the current client."""


class CancellationClosedError(Exception):
    """The online cancellation deadline has passed."""


class BookingNotActiveError(Exception):
    """The booking is no longer confirmed."""
