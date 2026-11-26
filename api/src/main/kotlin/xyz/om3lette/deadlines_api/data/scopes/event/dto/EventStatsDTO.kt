package xyz.om3lette.deadlines_api.data.scopes.event.dto

import xyz.om3lette.deadlines_api.data.scopes.event.response.EventStatsResponse

data class EventStatsDTO(
    val eventId: Long,
    val assignees: Long,
    val attachments: Long
) {
    fun toResponse(): EventStatsResponse = EventStatsResponse(
        assignees, attachments
    )
}
