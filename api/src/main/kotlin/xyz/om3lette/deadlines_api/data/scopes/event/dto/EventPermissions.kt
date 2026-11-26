package xyz.om3lette.deadlines_api.data.scopes.event.dto

data class EventPermissions(
    val update: Boolean,
    val delete: Boolean,
    val manageAssignees: Boolean,
    val manageAttachments: Boolean
)
