package xyz.om3lette.deadlines_api.data.scopes.deadline.response

import com.fasterxml.jackson.annotation.JsonUnwrapped
import io.swagger.v3.oas.annotations.media.Schema
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole

data class DeadlineResponseWithRole(
    @get:JsonUnwrapped
    val deadlineResponse: DeadlineResponse,
    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val role: ScopeRole?,
    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val globalRole: ScopeRole?
)
