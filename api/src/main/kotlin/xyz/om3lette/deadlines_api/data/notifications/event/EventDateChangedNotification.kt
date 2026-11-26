package xyz.om3lette.deadlines_api.data.notifications.event

import com.fasterxml.jackson.annotation.JsonProperty
import xyz.om3lette.deadlines_api.data.integration.bot.enums.Language
import java.time.Instant

data class EventDateChangedNotification(
    val chatId: Long,
    val timeZone: String,
    val language: Language,
    @get:JsonProperty("deadline")
    @param:JsonProperty("deadline")
    val event: RawEvent,
    val oldDue: Instant,
    val newDue: Instant,
    val organization: RawOrganization,
    val thread: RawThread
) : NotificationEvent
