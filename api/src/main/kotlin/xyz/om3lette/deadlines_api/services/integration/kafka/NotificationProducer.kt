package xyz.om3lette.deadlines_api.services.integration.kafka

import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import xyz.om3lette.deadlines_api.data.notifications.event.NotificationEvent
import xyz.om3lette.deadlines_api.services.BaseProducer

@Service
class NotificationProducer(
    notificationKafkaTemplate: KafkaTemplate<String, NotificationEvent>
) : BaseProducer<NotificationEvent>("private.integration.notifications", notificationKafkaTemplate)
