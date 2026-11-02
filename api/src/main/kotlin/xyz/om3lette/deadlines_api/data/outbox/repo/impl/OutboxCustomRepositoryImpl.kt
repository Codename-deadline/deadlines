package xyz.om3lette.deadlines_api.data.outbox.repo.impl

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import xyz.om3lette.deadlines_api.data.outbox.model.Outbox
import xyz.om3lette.deadlines_api.data.outbox.repo.OutboxCustomRepository
import java.time.Instant

@Repository
class OutboxCustomRepositoryImpl(
    @PersistenceContext private val em: EntityManager
) : OutboxCustomRepository {
    @Transactional
    override fun enqueueDeadlineDueChanged(deadlineId: Long, oldDue: Instant, newDue: Instant) {
        // The view must see pending deadline edits from the enclosing transaction.
        em.flush()
        val sql = """
            INSERT INTO notification_outbox (
                notification_id, source, messenger, available_at, status,
                retries, priority, topic, payload
            )
            SELECT
                NULL, 'DDL_DUE_CHANGED', messenger, now(), 'P',
                0, 100, 'private.integration.notifications',
                jsonb_build_object(
                    'type', 'DEADLINE_DUE_CHANGED',
                    'chatId', messenger_chat_id,
                    'timeZone', time_zone,
                    'language', language,
                    'oldDue', CAST(:old_due AS timestamptz),
                    'newDue', CAST(:new_due AS timestamptz),
                    'organization', jsonb_build_object(
                        'id', organization_id,
                        'title', organization_title
                    ),
                    'thread', jsonb_build_object(
                        'id', thread_id,
                        'title', thread_title
                    ),
                    'deadline', jsonb_build_object(
                        'id', deadline_id,
                        'title', deadline_title,
                        'due', CAST(:new_due AS timestamptz)
                    )
                )
            FROM deadline_notification_recipients
            WHERE deadline_id = :deadline_id AND is_completed = false
        """.trimIndent()

        em.createNativeQuery(sql)
            .setParameter("deadline_id", deadlineId)
            .setParameter("old_due", oldDue)
            .setParameter("new_due", newDue)
            .executeUpdate()
    }

    override fun claimBatch(batchSize: Int, maxRetries: Int): List<Outbox> {
        val sql = """
            UPDATE notification_outbox
            SET status = 'I',
                retries = retries + 1,
                available_at = available_at + interval '2 minutes'
            WHERE id IN (
                SELECT id
                FROM notification_outbox
                WHERE available_at <= now()
                    AND status IN ('P', 'I')
                    AND retries < :max_retries
                ORDER BY priority DESC, retries ASC, available_at ASC
                LIMIT :batch_size
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *;
        """.trimIndent()

        val q = em.createNativeQuery(sql, Outbox::class.java)
            .setParameter("batch_size", batchSize)
            .setParameter("max_retries", maxRetries)

        @Suppress("UNCHECKED_CAST")
        return q.resultList as List<Outbox>
    }
}
