package xyz.om3lette.deadlines_api.data.scopes.thread.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class ThreadDTO(
    val id: Long,

    val title: String,

    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val description: String?,

    val organizationId: Long,

    val createdAt: Instant
)
