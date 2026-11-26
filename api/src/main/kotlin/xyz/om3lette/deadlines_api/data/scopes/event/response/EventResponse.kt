package xyz.om3lette.deadlines_api.data.scopes.event.response

import com.fasterxml.jackson.annotation.JsonUnwrapped
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventDTO
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventPermissions
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole

data class EventResponse(
    @get:JsonUnwrapped
    val event: EventDTO,
    val stats: EventStatsResponse,
    val permissions: EventPermissions
) {
    fun withRole(scopeRole: ScopeRole?, globalRole: ScopeRole?): EventResponseWithRole = EventResponseWithRole(
        this, role = scopeRole, globalRole = globalRole
    )
}
