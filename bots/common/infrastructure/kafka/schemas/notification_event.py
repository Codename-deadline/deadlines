from typing import Annotated, Literal

from pydantic import Discriminator, Tag

from common.infrastructure.kafka.enums.time_remaining import TimeRemaining
from common.infrastructure.kafka.schemas.base_notification_event import (
    BaseNotificationEvent,
)
from common.infrastructure.kafka.schemas.event_date_changed_notification import (
    EventDateChangedNotification,
)


class EventReminderNotification(BaseNotificationEvent):
    type: Literal["DEADLINE_REMINDER"] = "DEADLINE_REMINDER"
    time_remaining: TimeRemaining


def _notification_type(value: object) -> str | None:
    if isinstance(value, dict):
        # Messages published before notification types were introduced are reminders.
        return value.get("type", "DEADLINE_REMINDER")
    return getattr(value, "type", None)


type Notification = Annotated[
    Annotated[EventReminderNotification, Tag("DEADLINE_REMINDER")]
    | Annotated[EventDateChangedNotification, Tag("DEADLINE_DUE_CHANGED")],
    Discriminator(_notification_type),
]
