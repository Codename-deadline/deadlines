package xyz.om3lette.deadlines_api.data.notifications.repo

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import xyz.om3lette.deadlines_api.data.notifications.enums.NotificationStatus
import xyz.om3lette.deadlines_api.data.notifications.model.EventReminder
import xyz.om3lette.deadlines_api.data.scopes.event.model.Event

interface EventReminderRepository : JpaRepository<EventReminder, Long>, EventReminderCustomRepository {
    // Used to fetch the notifications which sendAt can be updated
    // To avoid them being sent in the background before the row is updated
    // a LockModeType.PESSIMISTIC_WRITE lock is used
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    fun findAllByEventAndStatus(
        event: Event,
        status: NotificationStatus
    ): List<EventReminder>

    @Modifying
    @Query("DELETE FROM EventReminder dn WHERE dn.event = :event")
    fun deleteAllByEvent(event: Event): Int
}
