package xyz.om3lette.deadlines_api.data.scopes.event.response

import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole

data class EventCreatedResponse(
    val deadlineId: Long,
    val assignees: Int,
    val globalRole: ScopeRole,
)
