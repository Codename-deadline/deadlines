from pathlib import Path

import pytest
from pydantic import TypeAdapter

from common.application.enums import Language
from common.infrastructure.i18n.translator import I18nTranslator
from common.infrastructure.kafka.enums.event_kind import EventKind
from common.infrastructure.kafka.notification_presentation import (
    NOTIFICATION_PRESENTATIONS,
)
from common.infrastructure.kafka.notification_renderer import render_notification
from common.infrastructure.kafka.schemas.notification_event import Notification

ADAPTER = TypeAdapter(Notification)


def payload(kind="ALERT", **fields):
    return {
        "type": "DEADLINE_REMINDER",
        "chatId": 1,
        "language": "RU",
        "timeZone": "Europe/Moscow",
        "organization": {"id": 2, "title": "Team"},
        "thread": {"id": 3, "title": "Releases"},
        "deadline": {
            "id": 4,
            "title": "Release day",
            "due": "2026-12-01T12:00:00Z",
            "kind": kind,
        },
        "timeRemaining": 5,
        **fields,
    }


@pytest.fixture
def translator(monkeypatch):
    monkeypatch.setattr(
        "common.infrastructure.i18n.translator.TRANSLATIONS_PATH",
        Path(__file__).parents[4] / "translations",
    )
    return I18nTranslator(Language.EN, "Deadlines")


@pytest.mark.parametrize("language", list(Language))
def test_alert_at_event_time_does_not_announce_an_overdue_deadline(
    translator, language
):
    event = ADAPTER.validate_python(payload(language=language))
    text = render_notification(event, translator)

    assert "15:00 01.12.2026 UTC+03:00" in text
    assert (
        "Важная дата наступила"
        if language is Language.RU
        else "important date has arrived"
    ) in text
    assert "истёк" not in text
    assert "overdue" not in text
    assert "Release day" in text


@pytest.mark.parametrize("language", list(Language))
def test_upcoming_alert_has_an_event_reminder(translator, language):
    event = ADAPTER.validate_python(payload(language=language, timeRemaining=1))
    text = render_notification(event, translator)

    assert ("До события" if language is Language.RU else "until the event") in text
    assert "UTC+03:00" in text


@pytest.mark.parametrize("language", list(Language))
def test_alert_date_change_uses_event_wording(translator, language):
    event = ADAPTER.validate_python(
        payload(
            language=language,
            type="DEADLINE_DUE_CHANGED",
            oldDue="2026-11-30T12:00:00Z",
            newDue="2026-12-01T12:00:00Z",
        )
    )
    text = render_notification(event, translator)

    assert (
        "Дата события изменена" if language is Language.RU else "Event date changed"
    ) in text
    assert "30.11.2026" in text
    assert "01.12.2026" in text


def test_old_messages_default_to_deadline(translator):
    value = payload()
    del value["deadline"]["kind"]
    del value["type"]
    event = ADAPTER.validate_python(value)

    assert event.event.kind == "DEADLINE"
    assert "Срок выполнения истёк" in render_notification(event, translator)


def test_unknown_kind_is_rejected():
    with pytest.raises(ValueError):
        ADAPTER.validate_python(payload(kind="UNKNOWN"))


def test_all_event_kinds_have_notification_presentations():
    assert set(NOTIFICATION_PRESENTATIONS) == set(EventKind)


@pytest.mark.parametrize("kind", list(EventKind))
def test_generic_event_model_preserves_the_published_kafka_field(kind):
    event = ADAPTER.validate_python(payload(kind=kind))
    wire = event.model_dump(mode="json", by_alias=True)

    assert event.event.kind is kind
    assert wire["deadline"]["kind"] == kind.value
    assert "event" not in wire
