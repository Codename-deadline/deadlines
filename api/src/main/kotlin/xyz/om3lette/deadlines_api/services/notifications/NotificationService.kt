package xyz.om3lette.deadlines_api.services.notifications

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import xyz.om3lette.deadlines_api.data.notifications.repo.DeadlineNotificationRepository
import xyz.om3lette.deadlines_api.data.outbox.repo.OutboxRepository
import java.time.Instant

@Service
class NotificationService(
    private val deadlineNotificationRepository: DeadlineNotificationRepository,
    private val outboxRepository: OutboxRepository
) {
    @Transactional
    fun enqueueScheduledReminders(batchSize: Int) {
        deadlineNotificationRepository.findNotificationRecipientsAndInsertIntoOutbox(batchSize)
    }

    @Transactional
    fun notifyDeadlineDueChanged(deadlineId: Long, oldDue: Instant, newDue: Instant) {
        if (oldDue == newDue) return

        outboxRepository.enqueueDeadlineDueChanged(deadlineId, oldDue, newDue)
    }
}
