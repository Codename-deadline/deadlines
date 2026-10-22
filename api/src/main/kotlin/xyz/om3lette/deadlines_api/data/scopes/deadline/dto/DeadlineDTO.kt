package xyz.om3lette.deadlines_api.data.scopes.deadline.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class DeadlineDTO(
    val id: Long,

    val title: String,

    @get:Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    val description: String?,

    val createdAt: Instant,

    val due: Instant,

    val isCompleted: Boolean,

    val threadId: Long
)
