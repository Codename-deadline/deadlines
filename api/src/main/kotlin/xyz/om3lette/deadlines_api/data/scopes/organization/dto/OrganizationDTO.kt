package xyz.om3lette.deadlines_api.data.scopes.organization.dto

import io.swagger.v3.oas.annotations.media.Schema
import xyz.om3lette.deadlines_api.data.scopes.organization.enums.OrganizationType
import java.time.Instant

data class OrganizationDTO(
    val id: Long,

    val title: String,

    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val description: String?,

    val type: OrganizationType,

    val createdAt: Instant
)
