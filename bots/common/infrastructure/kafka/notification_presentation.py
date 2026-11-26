from dataclasses import dataclass

from common.application.translation import TranslationKey
from common.infrastructure.kafka.enums.event_kind import EventKind


@dataclass(frozen=True)
class NotificationPresentation:
    header: TranslationKey
    upcoming: TranslationKey
    occurred: TranslationKey
    date_changed: TranslationKey
    action: TranslationKey


NOTIFICATION_PRESENTATIONS: dict[EventKind, NotificationPresentation] = {
    EventKind.DEADLINE: NotificationPresentation(
        header=TranslationKey.NOTIFICATIONS_DEADLINE_HEADER,
        upcoming=TranslationKey.NOTIFICATIONS_DEADLINE_EXPIRY,
        occurred=TranslationKey.NOTIFICATIONS_DEADLINE_OVERDUE,
        date_changed=TranslationKey.NOTIFICATIONS_DEADLINE_DUE_CHANGED,
        action=TranslationKey.NOTIFICATIONS_GO_TO_DEADLINE,
    ),
    EventKind.ALERT: NotificationPresentation(
        header=TranslationKey.NOTIFICATIONS_ALERT_HEADER,
        upcoming=TranslationKey.NOTIFICATIONS_ALERT_UPCOMING,
        occurred=TranslationKey.NOTIFICATIONS_ALERT_OCCURRED,
        date_changed=TranslationKey.NOTIFICATIONS_ALERT_DATE_CHANGED,
        action=TranslationKey.NOTIFICATIONS_GO_TO_ALERT,
    ),
}
