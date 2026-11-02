package xyz.om3lette.deadlines_api.data.outbox.repo

import xyz.om3lette.deadlines_api.data.outbox.model.Outbox
import java.time.Instant

interface OutboxCustomRepository {
    fun claimBatch(batchSize: Int, maxRetries: Int): List<Outbox>
    fun enqueueDeadlineDueChanged(deadlineId: Long, oldDue: Instant, newDue: Instant)
}
