package xyz.om3lette.deadlines_api.db

import jakarta.persistence.EntityManager
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import tools.jackson.databind.json.JsonMapper
import xyz.om3lette.deadlines_api.config.TestInfraMocks
import xyz.om3lette.deadlines_api.data.integration.bot.enums.Language
import xyz.om3lette.deadlines_api.data.notifications.event.DeadlineDueChangedNotificationEvent
import xyz.om3lette.deadlines_api.data.notifications.event.DeadlineNotificationEvent
import xyz.om3lette.deadlines_api.data.notifications.event.NotificationEvent
import xyz.om3lette.deadlines_api.data.outbox.repo.OutboxRepository
import xyz.om3lette.deadlines_api.data.scopes.deadline.model.Deadline
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeType
import xyz.om3lette.deadlines_api.data.user.model.User
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertOrganization
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertThread
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertDeadline
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertBot
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertChat
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertChatSubscription
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertUser
import xyz.om3lette.deadlines_api.db.DatabaseObjectBuilder.insertUserScope
import xyz.om3lette.deadlines_api.services.DeadlineService
import xyz.om3lette.deadlines_api.services.notifications.NotificationService
import java.time.Instant
import java.time.OffsetDateTime
import java.time.temporal.ChronoUnit
import kotlin.test.assertEquals
import kotlin.test.assertNull

@SpringBootTest
@Tag("testcontainers")
@ActiveProfiles("test")
@Import(TestInfraMocks::class, TestDatabaseConfig::class)
class NotificationIntegrationTests {
    @Autowired private lateinit var jdbc: JdbcTemplate
    @Autowired private lateinit var em: EntityManager
    @Autowired private lateinit var notificationService: NotificationService
    @Autowired private lateinit var outboxRepository: OutboxRepository
    @Autowired private lateinit var deadlineService: DeadlineService
    @Autowired private lateinit var transactionManager: PlatformTransactionManager

    private val mapper = JsonMapper.builder().build()
    private val organizationId = 8_100L
    private val threadId = 8_200L
    private val deadlineId = 8_300L
    private val fallbackBotId = 8_400L
    private val messengerBotId = 9_400L
    private val ownerId = 8_600L
    private val reminderId = 8_700L
    private val batchSize = 100
    private val maxRetries = 5

    private data class ChatFixture(
        val id: Long,
        val messengerChatId: Long,
        val language: Language = Language.EN,
        val timeZone: String = "Etc/UTC"
    )

    private val multiScopeChat = ChatFixture(8_501, 9_501, Language.RU, "Asia/Tokyo")
    private val threadChat = ChatFixture(8_502, 9_502)
    private val organizationChat = ChatFixture(8_503, 9_503)
    private val unsubscribedChat = ChatFixture(8_504, 9_504)
    private val recipientChats = listOf(multiScopeChat, threadChat, organizationChat)
    private val allChats = recipientChats + unsubscribedChat

    private fun fixtures(completed: Boolean = false, subscriptions: Boolean = true) {
        insertOrganization(jdbc, organizationId)
        insertThread(jdbc, threadId, organizationId)
        insertDeadline(jdbc, deadlineId, threadId, isCompleted = completed)
        // Only one bot per messenger is allowed; other integration tests may have registered it.
        val botId = jdbc.queryForList("SELECT id FROM bots WHERE messenger = 'TELEGRAM'", Long::class.java)
            .firstOrNull() ?: fallbackBotId.also { insertBot(jdbc, it, messengerBotId) }
        allChats.forEach { chat ->
            insertChat(jdbc, chat.id, chat.messengerChatId, botId, language = chat.language, timeZone = chat.timeZone)
        }
        if (subscriptions) {
            insertChatSubscription(jdbc, multiScopeChat.id, ScopeType.DEADLINE, deadlineId)
            insertChatSubscription(jdbc, multiScopeChat.id, ScopeType.THREAD, threadId)
            insertChatSubscription(jdbc, multiScopeChat.id, ScopeType.ORGANIZATION, organizationId)
            insertChatSubscription(jdbc, threadChat.id, ScopeType.THREAD, threadId)
            insertChatSubscription(jdbc, organizationChat.id, ScopeType.ORGANIZATION, organizationId)
        }
        insertUser(jdbc, ownerId, "notification-owner")
        insertUserScope(jdbc, ownerId, ScopeType.ORGANIZATION, organizationId, ScopeRole.ORG_OWNER)
    }

    private fun insertReminder() {
        jdbc.update(
            """
            INSERT INTO deadline_notifications (id, deadline_id, send_at, type, status)
            VALUES (?, ?, now() - interval '1 minute', 'ONE_HOUR', 'P')
            """.trimIndent(),
            reminderId,
            deadlineId
        )
    }

    private fun payloads(): List<NotificationEvent> = jdbc.queryForList(
        "SELECT payload::text FROM notification_outbox ORDER BY payload->>'chatId'",
        String::class.java
    ).map { mapper.readValue(it, NotificationEvent::class.java) }

    private fun reminderStatus(): String? = jdbc.queryForObject(
        "SELECT status FROM deadline_notifications WHERE id = ?",
        String::class.java,
        reminderId
    )

    @Test
    @Transactional
    fun `scheduled reminders use shared deduplicated recipients and chat preferences`() {
        fixtures()
        insertReminder()

        notificationService.enqueueScheduledReminders(batchSize)

        val events = payloads().map { it as DeadlineNotificationEvent }
        assertEquals(recipientChats.map { it.messengerChatId }, events.map { it.chatId })
        assertEquals(multiScopeChat.language, events.first().language)
        assertEquals(multiScopeChat.timeZone, events.first().timeZone)
        assertEquals(threadId, events.first().thread.id)
        assertEquals(organizationId, events.first().organization.id)
        assertEquals("I", reminderStatus())
        assertEquals(
            recipientChats.map { reminderId },
            jdbc.queryForList("SELECT notification_id FROM notification_outbox", Long::class.java)
        )
    }

    @Test
    @Transactional
    fun `due changes on completed deadlines capture context and dates without a reminder id`() {
        fixtures(completed = true)
        val deadline = em.find(Deadline::class.java, deadlineId)
        val oldDue = deadline.due
        val newDue = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS)

        deadlineService.patchDeadline(
            em.find(User::class.java, ownerId), deadlineId, "Updated title", null, null, newDue
        )

        val events = payloads().map { it as DeadlineDueChangedNotificationEvent }
        assertEquals(recipientChats.map { it.messengerChatId }, events.map { it.chatId })
        events.forEach {
            assertEquals(oldDue, it.oldDue)
            assertEquals(newDue, it.newDue)
            assertEquals(newDue, it.deadline.due)
            assertEquals("Updated title", it.deadline.title)
        }
        assertEquals(multiScopeChat.language, events.first().language)
        assertEquals(multiScopeChat.timeZone, events.first().timeZone)
        jdbc.queryForList("SELECT notification_id, source FROM notification_outbox").forEach {
            assertNull(it["notification_id"])
            assertEquals("DDL_DUE_CHANGED", it["source"])
        }

        // Later edits must not change the already queued message snapshot.
        deadline.title = "Another title"
        em.flush()
        assertEquals("Updated title", (payloads().first() as DeadlineDueChangedNotificationEvent).deadline.title)

        val deliveries = outboxRepository.claimBatch(batchSize, maxRetries)
        assertEquals(recipientChats.size, deliveries.size)
        deliveries.forEach { assertNull(it.notificationId) }
    }

    @Test
    @Transactional
    fun `completed deadlines remain in the view but do not receive scheduled reminders`() {
        fixtures(completed = true)
        insertReminder()

        assertEquals(
            recipientChats.size,
            jdbc.queryForObject(
                "SELECT count(*) FROM deadline_notification_recipients WHERE deadline_id = ?",
                Int::class.java,
                deadlineId
            )
        )
        notificationService.enqueueScheduledReminders(batchSize)

        assertEquals(emptyList(), payloads())
        assertEquals("S", reminderStatus())
    }

    @Test
    @Transactional
    fun `no subscriptions produce no deliveries and finalize scheduled reminders`() {
        fixtures(subscriptions = false)
        insertReminder()

        notificationService.notifyDeadlineDueChanged(deadlineId, Instant.EPOCH, Instant.now())
        notificationService.enqueueScheduledReminders(batchSize)

        assertEquals(emptyList(), payloads())
        assertEquals("S", reminderStatus())
    }

    @Test
    fun `deadline changes and outbox deliveries roll back together`() {
        val transactionTemplate = TransactionTemplate(transactionManager)
        transactionTemplate.executeWithoutResult {
            fixtures(completed = true)
        }
        val oldDue = jdbc.queryForObject("SELECT due FROM deadlines WHERE id = ?", OffsetDateTime::class.java, deadlineId)

        try {
            assertThrows<IllegalStateException> {
                transactionTemplate.executeWithoutResult {
                    deadlineService.patchDeadline(
                        em.find(User::class.java, ownerId), deadlineId, null, null, null,
                        Instant.now().plus(3, ChronoUnit.DAYS)
                    )

                    assertEquals(recipientChats.size, payloads().size)
                    throw IllegalStateException("Roll back the deadline edit")
                }
            }

            assertEquals(
                oldDue,
                jdbc.queryForObject("SELECT due FROM deadlines WHERE id = ?", OffsetDateTime::class.java, deadlineId)
            )
            assertEquals(
                0,
                jdbc.queryForObject("SELECT count(*) FROM notification_outbox WHERE source = 'DDL_DUE_CHANGED'", Int::class.java)
            )
        } finally {
            jdbc.update("DELETE FROM organizations WHERE id = ?", organizationId)
            allChats.forEach { jdbc.update("DELETE FROM chats WHERE id = ?", it.id) }
            jdbc.update("DELETE FROM bots WHERE id = ?", fallbackBotId)
            jdbc.update("DELETE FROM users WHERE id = ?", ownerId)
        }
    }
}
