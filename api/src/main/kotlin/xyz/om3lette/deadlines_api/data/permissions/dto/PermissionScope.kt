package xyz.om3lette.deadlines_api.data.permissions.dto

import xyz.om3lette.deadlines_api.data.scopes.event.model.Event
import xyz.om3lette.deadlines_api.data.scopes.organization.model.Organization
import xyz.om3lette.deadlines_api.data.scopes.thread.model.Thread

sealed interface PermissionScope

data class OrganizationScope(
    val orgId: Long,
    val organization: Organization? = null,
) : PermissionScope

data class ThreadScope(val thread: Thread) : PermissionScope

data class EventScope(val event: Event) : PermissionScope
