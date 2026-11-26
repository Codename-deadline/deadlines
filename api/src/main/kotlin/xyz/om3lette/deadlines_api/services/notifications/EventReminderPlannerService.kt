package xyz.om3lette.deadlines_api.services.notifications

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import xyz.om3lette.deadlines_api.data.notifications.enums.NotificationStatus
import xyz.om3lette.deadlines_api.data.notifications.enums.TimeRemaining
import xyz.om3lette.deadlines_api.data.notifications.model.EventReminder
import xyz.om3lette.deadlines_api.data.notifications.repo.EventReminderRepository
import xyz.om3lette.deadlines_api.data.scopes.event.model.Event
import java.time.Duration
import java.time.Instant
import java.time.Period
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAmount

@Service
class EventReminderPlannerService(
    private val eventReminderRepository: EventReminderRepository
) {
    private data class PlannedNotification(
        val type: TimeRemaining,
        val sendAt: Instant
    )

    private val reminderOffsets = listOf<Pair<TimeRemaining, TemporalAmount>>(
        TimeRemaining.FIFTEEN_MINUTES to Duration.ofMinutes(15),
        TimeRemaining.ONE_HOUR to Duration.ofHours(1),
        TimeRemaining.ONE_DAY to Duration.ofDays(1),
        TimeRemaining.ONE_WEEK to Duration.ofDays(7),
        TimeRemaining.ONE_MONTH to Period.ofMonths(1),
        TimeRemaining.NO_TIME to Duration.ZERO
    )

    fun createNotifications(deadline: Event, now: Instant = Instant.now()) {
        eventReminderRepository.saveAll(
            planNotifications(deadline.due, now).map {
                EventReminder(
                    id = 0,
                    event = deadline,
                    sendAt = it.sendAt,
                    type = it.type,
                    status = NotificationStatus.PENDING
                )
            }
        )
    }

    @Transactional
    fun reconcileNotifications(deadline: Event, now: Instant = Instant.now()) {
        val plannedByType = planNotifications(deadline.due, now).associateBy { it.type }
        val pendingByType = eventReminderRepository
            .findAllByEventAndStatus(deadline, NotificationStatus.PENDING)
            .associateBy { it.type }

        val obsoletePending = mutableListOf<EventReminder>()
        val updatedPending = mutableListOf<EventReminder>()
        for (pendingNotification in pendingByType.values) {
            val plannedNotification = plannedByType[pendingNotification.type]
            if (plannedNotification == null) {
                obsoletePending.add(pendingNotification)
            } else {
                pendingNotification.sendAt = plannedNotification.sendAt
                updatedPending.add(pendingNotification)
            }
        }

        val newNotifications = plannedByType.values
            .filter { pendingByType[it.type] == null }
            .map {
                EventReminder(
                    id = 0,
                    event = deadline,
                    sendAt = it.sendAt,
                    type = it.type,
                    status = NotificationStatus.PENDING
                )
            }

        if (obsoletePending.isNotEmpty()) {
            eventReminderRepository.deleteAll(obsoletePending)
        }
        if (updatedPending.isNotEmpty()) {
            eventReminderRepository.saveAll(updatedPending)
        }
        if (newNotifications.isNotEmpty()) {
            eventReminderRepository.saveAll(newNotifications)
        }
    }

    @Transactional
    fun deleteNotifications(deadline: Event) {
        eventReminderRepository.deleteAllByEvent(deadline)
    }

    private fun planNotifications(due: Instant, now: Instant): List<PlannedNotification> = reminderOffsets
        .map { (type, offset) ->
            val sendAt = due.atOffset(ZoneOffset.UTC).minus(offset).toInstant()
            PlannedNotification(type, sendAt.truncatedTo(ChronoUnit.MINUTES))
        }
        .filter { it.sendAt.isAfter(now) }
}
