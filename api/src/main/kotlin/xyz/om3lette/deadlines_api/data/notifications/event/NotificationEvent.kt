package xyz.om3lette.deadlines_api.data.notifications.event

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    property = "type",
    // Outbox rows written before notification types were introduced are reminders.
    defaultImpl = EventReminderNotification::class
)
@JsonSubTypes(
    JsonSubTypes.Type(value = EventReminderNotification::class, name = "DEADLINE_REMINDER"),
    JsonSubTypes.Type(value = EventDateChangedNotification::class, name = "DEADLINE_DUE_CHANGED")
)
sealed interface NotificationEvent
