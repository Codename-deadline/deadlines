package xyz.om3lette.deadlines_api.data.notifications.repo.impl

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import xyz.om3lette.deadlines_api.data.notifications.repo.DeadlineNotificationCustomRepository

@Repository
class DeadlineNotificationCustomRepositoryImpl(
    @PersistenceContext private val em: EntityManager
) : DeadlineNotificationCustomRepository {

    @Transactional
    override fun findNotificationRecipientsAndInsertIntoOutbox(batchSize: Int) {
        val sql = """
            WITH due AS (
                SELECT dn.id AS notification_id, dn.type, dn.deadline_id
                FROM deadline_notifications dn
                WHERE dn.send_at <= now() AND dn.status = 'P'
                ORDER BY dn.send_at, dn.id
                LIMIT :batch_size
                FOR UPDATE OF dn SKIP LOCKED
            ),
            inserted AS (
                INSERT INTO notification_outbox (
                    notification_id,
                    source,
                    messenger,
                    available_at,
                    status,
                    retries,
                    priority,
                    topic,
                    payload
                )
                SELECT
                    notification_id,
                    'DDL_EXPIRATION',
                    messenger,
                    now(),
                    'P',
                    0,
                    100,
                    'private.integration.notifications',
                    jsonb_build_object(
                        'type', 'DEADLINE_REMINDER',
                        'chatId', messenger_chat_id,
                        'timeZone', time_zone,
                        'timeRemaining', type,
                        'language', language,
                        'organization', jsonb_build_object(
                            'id', organization_id,
                            'title', organization_title
                        ),
                        'thread', jsonb_build_object(
                            'id', thread_id,
                            'title', thread_title
                        ),
                        'deadline', jsonb_build_object(
                            'id', r.deadline_id,
                            'title', deadline_title,
                            'due', due
                        )
                    )
                FROM due m
                JOIN deadline_notification_recipients r ON r.deadline_id = m.deadline_id
                WHERE r.is_completed = false
                RETURNING notification_id
            )
            UPDATE deadline_notifications dn
            SET status = CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM inserted i
                    WHERE i.notification_id = m.notification_id
                ) THEN 'I'
                ELSE 'S'
            END
            FROM due m
            WHERE dn.id = m.notification_id
        """.trimIndent()

        em.createNativeQuery(sql)
            .setParameter("batch_size", batchSize)
            .executeUpdate()
    }

    @Transactional
    override fun finalizeProcessedNotifications(notificationIds: Collection<Long>) {
        if (notificationIds.isEmpty()) return

        val sql = """
            UPDATE deadline_notifications dn
            SET status = CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM notification_outbox no
                    WHERE no.notification_id = dn.id AND no.status = 'F'
                ) THEN 'F'
                ELSE 'S'
            END
            WHERE dn.id IN (:notification_ids)
                AND dn.status = 'I'
                AND NOT EXISTS (
                    SELECT 1
                    FROM notification_outbox no
                    WHERE no.notification_id = dn.id AND no.status IN ('P', 'I')
                )
        """.trimIndent()

        em.createNativeQuery(sql)
            .unwrap(org.hibernate.query.NativeQuery::class.java)
            .setParameterList("notification_ids", notificationIds)
            .executeUpdate()
    }
}
