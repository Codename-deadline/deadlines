from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TypeVar

from pydantic import TypeAdapter

from common.infrastructure.kafka.schemas.base_kafka_event import BaseKafkaEvent

TEvent = TypeVar("TEvent", bound=BaseKafkaEvent)


@dataclass
class EventHandler[TEvent]:
    topic: str
    event_mapping: TypeAdapter[TEvent]
    handler: Callable[[TEvent], Awaitable[None]]
