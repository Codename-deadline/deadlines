package xyz.om3lette.deadlines_api.data.notifications.event

import xyz.om3lette.deadlines_api.data.integration.bot.enums.Language
import java.time.Instant

data class DeadlineDueChangedNotificationEvent(
    val chatId: Long,
    val timeZone: String,
    val language: Language,
    val deadline: RawDeadline,
    val oldDue: Instant,
    val newDue: Instant,
    val organization: RawOrganization,
    val thread: RawThread
) : NotificationEvent
