package xyz.om3lette.deadlines_api.services.notifications

import org.junit.jupiter.api.Test
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.node.ObjectNode
import xyz.om3lette.deadlines_api.data.integration.bot.enums.Language
import xyz.om3lette.deadlines_api.data.notifications.enums.TimeRemaining
import xyz.om3lette.deadlines_api.data.notifications.event.*
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertIs

class NotificationEventTest {
    private val mapper = JsonMapper.builder().build()
    private val reminder = DeadlineNotificationEvent(
        42, "UTC", Language.EN,
        RawDeadline(1, Instant.parse("2026-12-01T12:00:00Z"), "Deadline"),
        TimeRemaining.ONE_DAY, RawOrganization(2, "Organization"), RawThread(3, "Thread")
    )

    @Test
    fun `reminders round trip with a type while retaining existing fields`() {
        val json = mapper.valueToTree<ObjectNode>(reminder)

        assertEquals("DEADLINE_REMINDER", json["type"].stringValue())
        assertEquals(TimeRemaining.ONE_DAY.ordinal, json["timeRemaining"].intValue())
        assertEquals(reminder, mapper.treeToValue(json, NotificationEvent::class.java))
    }

    @Test
    fun `legacy outbox payloads without a type deserialize as reminders`() {
        val json = mapper.valueToTree<ObjectNode>(reminder)
        json.remove("type")

        assertEquals(reminder, mapper.treeToValue(json, NotificationEvent::class.java))
    }

    @Test
    fun `due changes round trip without a time remaining value`() {
        val event = DeadlineDueChangedNotificationEvent(
            reminder.chatId, reminder.timeZone, reminder.language, reminder.deadline,
            Instant.parse("2026-11-30T12:00:00Z"), reminder.deadline.due,
            reminder.organization, reminder.thread
        )
        val json = mapper.valueToTree<ObjectNode>(event)

        assertEquals("DEADLINE_DUE_CHANGED", json["type"].stringValue())
        assertIs<DeadlineDueChangedNotificationEvent>(mapper.treeToValue(json, NotificationEvent::class.java))
        assertEquals(event, mapper.treeToValue(json, NotificationEvent::class.java))
    }
}
