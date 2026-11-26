package xyz.om3lette.deadlines_api.data.scopes.event.response

import com.fasterxml.jackson.annotation.JsonUnwrapped
import io.swagger.v3.oas.annotations.media.Schema
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole

data class EventResponseWithRole(
    @get:JsonUnwrapped
    val eventResponse: EventResponse,
    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val role: ScopeRole?,
    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val globalRole: ScopeRole?
)
