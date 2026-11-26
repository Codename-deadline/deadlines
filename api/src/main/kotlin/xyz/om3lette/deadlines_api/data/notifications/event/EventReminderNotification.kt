package xyz.om3lette.deadlines_api.data.notifications.event

import com.fasterxml.jackson.annotation.JsonProperty
import xyz.om3lette.deadlines_api.data.integration.bot.enums.Language
import xyz.om3lette.deadlines_api.data.notifications.enums.TimeRemaining
import xyz.om3lette.deadlines_api.data.scopes.event.model.EventKind
import java.time.Instant

data class RawEvent(
    val id: Long,
    val due: Instant,
    val title: String,
    val kind: EventKind = EventKind.DEADLINE
)

data class RawOrganization(
    val id: Long,
    val title: String
)

data class RawThread(
    val id: Long,
    val title: String
)

data class EventReminderNotification(
    val chatId: Long,
    val timeZone: String,
    val language: Language,
    @get:JsonProperty("deadline")
    @param:JsonProperty("deadline")
    val event: RawEvent,
    val timeRemaining: TimeRemaining,
    val organization: RawOrganization,
    val thread: RawThread
) : NotificationEvent
