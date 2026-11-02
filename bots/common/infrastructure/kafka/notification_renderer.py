from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from common.application.protocols.translator import Translator
from common.application.translation import TranslationKey
from common.infrastructure.i18n.mappings import TIME_REMAINING_TRANSLATION_KEYS
from common.infrastructure.kafka.enums.time_remaining import TimeRemaining
from common.infrastructure.kafka.schemas.deadline_due_changed_event import (
    DeadlineDueChangedNotificationEvent,
)
from common.infrastructure.kafka.schemas.notification_event import Notification


def _format_utc_offset(offset: timedelta) -> str:
    total_minutes = int(offset.total_seconds() // 60)
    sign = "+" if total_minutes >= 0 else "-"
    hours, minutes = divmod(abs(total_minutes), 60)
    return f"UTC{sign}{hours:02d}:{minutes:02d}"


def _format_due(value: datetime, time_zone: str) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Deadline due must be timezone-aware")
    due = value.astimezone(ZoneInfo(time_zone))
    offset: timedelta | None = due.utcoffset()
    if offset is None:
        raise ValueError("Deadline due must be timezone-aware")

    return f"{due.strftime('%H:%M %d.%m.%Y')} {_format_utc_offset(offset)}"


def render_notification(event: Notification, translator: Translator) -> str:
    header = translator.translate(
        TranslationKey.NOTIFICATIONS_DEADLINE_HEADER,
        event.language,
        title=event.deadline.title,
        organization=event.organization.title,
        thread=event.thread.title,
    )
    if isinstance(event, DeadlineDueChangedNotificationEvent):
        body = translator.translate(
            TranslationKey.NOTIFICATIONS_DEADLINE_DUE_CHANGED,
            event.language,
            old_due=_format_due(event.old_due, event.time_zone),
            new_due=_format_due(event.new_due, event.time_zone),
        )
    else:
        translation_key = TranslationKey.NOTIFICATIONS_DEADLINE_OVERDUE
        params = {"due": _format_due(event.deadline.due, event.time_zone)}
        if event.time_remaining is not TimeRemaining.NO_TIME:
            translation_key = TranslationKey.NOTIFICATIONS_DEADLINE_EXPIRY
            params["time_remaining"] = translator.translate(
                TIME_REMAINING_TRANSLATION_KEYS[event.time_remaining], event.language
            )
        body = translator.translate(translation_key, event.language, **params)

    return f"{header}\n\n{body}"
