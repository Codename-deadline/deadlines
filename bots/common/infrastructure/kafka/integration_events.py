from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from pydantic import TypeAdapter

from common.config.schemas.kafka_config import KafkaConfig
from common.infrastructure.kafka.consumers.global_consumer import GlobalConsumer
from common.infrastructure.kafka.event_handler import EventHandler
from common.infrastructure.kafka.schemas.account_linkage_event import (
    AccountLinkageEvent,
)
from common.infrastructure.kafka.schemas.notification_event import Notification
from common.infrastructure.kafka.schemas.otp_event import OtpEvent


@dataclass(frozen=True)
class IntegrationEventHandlers:
    account_linkage: Callable[[AccountLinkageEvent], Awaitable[None]]
    notifications: Callable[[Notification], Awaitable[None]]
    otp: Callable[[OtpEvent], Awaitable[None]]


def build_integration_consumer(
    kafka_config: KafkaConfig, handlers: IntegrationEventHandlers
) -> GlobalConsumer:
    consumer = GlobalConsumer(kafka_config)
    consumer.register_handler(
        EventHandler(
            kafka_config.topics.account_linkage,
            TypeAdapter(AccountLinkageEvent),
            handlers.account_linkage,
        )
    )
    consumer.register_handler(
        EventHandler(
            kafka_config.topics.notifications,
            TypeAdapter(Notification),
            handlers.notifications,
        )
    )
    consumer.register_handler(
        EventHandler(kafka_config.topics.otp, TypeAdapter(OtpEvent), handlers.otp)
    )
    return consumer
