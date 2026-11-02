from datetime import datetime
from typing import Literal

from common.infrastructure.kafka.schemas.base_notification_event import (
    BaseNotificationEvent,
)


class DeadlineDueChangedNotificationEvent(BaseNotificationEvent):
    type: Literal["DEADLINE_DUE_CHANGED"] = "DEADLINE_DUE_CHANGED"
    old_due: datetime
    new_due: datetime
