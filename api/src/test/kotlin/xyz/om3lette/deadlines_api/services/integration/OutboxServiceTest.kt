package xyz.om3lette.deadlines_api.services.integration

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import tools.jackson.databind.json.JsonMapper
import xyz.om3lette.deadlines_api.configs.properties.OutboxProperties
import xyz.om3lette.deadlines_api.data.integration.bot.enums.Messenger
import xyz.om3lette.deadlines_api.data.notifications.enums.NotificationStatus
import xyz.om3lette.deadlines_api.data.notifications.repo.DeadlineNotificationRepository
import xyz.om3lette.deadlines_api.data.outbox.enums.OutboxSource
import xyz.om3lette.deadlines_api.data.outbox.enums.ProcessResult
import xyz.om3lette.deadlines_api.data.outbox.model.Outbox
import xyz.om3lette.deadlines_api.data.outbox.repo.OutboxRepository
import xyz.om3lette.deadlines_api.services.integration.outboxHandler.OutboxHandler
import kotlin.test.assertEquals

class OutboxServiceTest {
    @ParameterizedTest
    @EnumSource(ProcessResult::class)
    fun `deliveries without reminder ids do not finalize scheduled reminders`(result: ProcessResult) {
        val repository = mockk<OutboxRepository>(relaxed = true)
        val reminders = mockk<DeadlineNotificationRepository>(relaxed = true)
        val handler = mockk<OutboxHandler>()
        val delivery = Outbox(
            id = 1,
            source = OutboxSource.DDL_DUE_CHANGED,
            messenger = Messenger.TELEGRAM,
            priority = 100,
            topic = "private.integration.notifications",
            payload = JsonMapper.builder().build().createObjectNode(),
            retries = 1
        )
        every { handler.topic } returns delivery.topic
        every { handler.handle(delivery.messenger, delivery.payload) } returns result
        every { repository.claimBatch(any(), any()) } returns listOf(delivery)

        OutboxService(repository, reminders, listOf(handler), OutboxProperties()).pollOnce()

        verify(exactly = 0) { reminders.finalizeProcessedNotifications(any()) }
        if (result == ProcessResult.SUCCESS) {
            verify { repository.deleteAllByIdInBatch(listOf(delivery.id)) }
        } else {
            verify { repository.saveAllAndFlush(listOf(delivery)) }
            assertEquals(
                if (result == ProcessResult.RETRY) NotificationStatus.PENDING else NotificationStatus.FAILED,
                delivery.status
            )
        }
    }

    @ParameterizedTest
    @EnumSource(ProcessResult::class)
    fun `terminal outcomes finalize only associated reminders in a mixed batch`(result: ProcessResult) {
        val repository = mockk<OutboxRepository>(relaxed = true)
        val reminders = mockk<DeadlineNotificationRepository>(relaxed = true)
        val handler = mockk<OutboxHandler>()
        val delivery = Outbox(
            id = 1,
            source = OutboxSource.DDL_DUE_CHANGED,
            messenger = Messenger.TELEGRAM,
            priority = 100,
            topic = "private.integration.notifications",
            payload = JsonMapper.builder().build().createObjectNode(),
            retries = 5
        )
        val reminder = delivery.copy(id = 2, source = OutboxSource.DDL_EXPIRATION, notificationId = 42)
        every { handler.topic } returns delivery.topic
        every { handler.handle(any(), any()) } returns result
        every { repository.claimBatch(any(), any()) } returns listOf(delivery, reminder)

        OutboxService(repository, reminders, listOf(handler), OutboxProperties()).pollOnce()

        verify(exactly = 1) { reminders.finalizeProcessedNotifications(setOf(42L)) }
    }
}
