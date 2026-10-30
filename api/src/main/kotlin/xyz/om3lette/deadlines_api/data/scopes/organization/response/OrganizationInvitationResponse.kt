package xyz.om3lette.deadlines_api.data.scopes.organization.response

import io.swagger.v3.oas.annotations.media.Schema
import xyz.om3lette.deadlines_api.data.scopes.organization.dto.OrganizationDTO
import xyz.om3lette.deadlines_api.data.user.response.MinimalUserResponse
import java.time.Instant

data class OrganizationInvitationResponse(
    val id: Long,

    val invitedBy: MinimalUserResponse,

    val invitedUser: MinimalUserResponse,

    val organization: OrganizationDTO,

    val status: String,

    val role: String,

    val createdAt: Instant,

    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val answeredAt: Instant?
)
