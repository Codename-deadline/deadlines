package xyz.om3lette.deadlines_api.data.scopes.event.response

import java.time.Instant
import java.time.temporal.ChronoUnit

object EventResponseParams {
    fun invalidDueTimestamp(due: Instant, minExpiryMinutes: Long, now: Instant? = Instant.now()) = mapOf(
        "remaining" to ChronoUnit.MINUTES.between(now, due),
        "min" to minExpiryMinutes
    )
}
