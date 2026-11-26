package xyz.om3lette.deadlines_api.data.scopes.event.requests

import jakarta.validation.Valid
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import xyz.om3lette.deadlines_api.data.scopes.common.constraints.ScopeInvitationConstraints
import xyz.om3lette.deadlines_api.data.scopes.common.dto.UsernameRolePair
import xyz.om3lette.deadlines_api.data.scopes.common.constraints.ScopeTextConstraints
import xyz.om3lette.deadlines_api.data.scopes.event.model.EventKind
import java.time.Instant

data class CreateEventRequest(
    @field:NotBlank
    @field:Size(min = ScopeTextConstraints.TITLE_MIN, max = ScopeTextConstraints.TITLE_MAX)
    val title: String,

    @field:Size(max = ScopeTextConstraints.DESCRIPTION_MAX)
    val description: String?,

    val due: Instant,

    @field:Size(max = ScopeInvitationConstraints.MAX_INVITATIONS)
    val invitations: List<@Valid UsernameRolePair>,

    @get:Schema(defaultValue = "DEADLINE", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    val kind: EventKind = EventKind.DEADLINE
)
