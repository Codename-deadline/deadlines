from datetime import datetime

from pydantic import Field

from common.application.enums import Language
from common.infrastructure.kafka.enums.event_kind import EventKind
from common.infrastructure.kafka.schemas.base_kafka_event import BaseKafkaEvent


class RawEntityPayload(BaseKafkaEvent):
    id: int
    title: str


class EventPayload(BaseKafkaEvent):
    id: int
    title: str
    due: datetime
    kind: EventKind = EventKind.DEADLINE


class BaseNotificationEvent(BaseKafkaEvent):
    chat_id: int
    language: Language
    organization: RawEntityPayload
    thread: RawEntityPayload
    # Keep the published Kafka field name compatible with existing messages.
    event: EventPayload = Field(alias="deadline")
    time_zone: str = "Etc/UTC"
