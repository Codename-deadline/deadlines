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
import kotlin.test.assertFalse

class NotificationEventTest {
    private val mapper = JsonMapper.builder().build()
    private val reminder = EventReminderNotification(
        42, "UTC", Language.EN,
        RawEvent(1, Instant.parse("2026-12-01T12:00:00Z"), "Event"),
        TimeRemaining.ONE_DAY, RawOrganization(2, "Organization"), RawThread(3, "Thread")
    )

    @Test
    fun `reminders round trip with a type while retaining existing fields`() {
        val json = mapper.valueToTree<ObjectNode>(reminder)

        assertEquals("DEADLINE_REMINDER", json["type"].stringValue())
        assertEquals(reminder.event.id, json["deadline"]["id"].longValue())
        assertFalse(json.has("event"))
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
        val event = EventDateChangedNotification(
            reminder.chatId, reminder.timeZone, reminder.language, reminder.event,
            Instant.parse("2026-11-30T12:00:00Z"), reminder.event.due,
            reminder.organization, reminder.thread
        )
        val json = mapper.valueToTree<ObjectNode>(event)

        assertEquals("DEADLINE_DUE_CHANGED", json["type"].stringValue())
        assertEquals(event.event.id, json["deadline"]["id"].longValue())
        assertFalse(json.has("event"))
        assertIs<EventDateChangedNotification>(mapper.treeToValue(json, NotificationEvent::class.java))
        assertEquals(event, mapper.treeToValue(json, NotificationEvent::class.java))
    }
}
