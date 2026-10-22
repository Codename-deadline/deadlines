package xyz.om3lette.deadlines_api.data.scopes.thread.response

import com.fasterxml.jackson.annotation.JsonUnwrapped
import io.swagger.v3.oas.annotations.media.Schema
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole

data class ThreadResponseWithRole(
    @get:JsonUnwrapped
    val threadResponse: ThreadResponse,
    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val role: ScopeRole?,
    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val globalRole: ScopeRole?
)
