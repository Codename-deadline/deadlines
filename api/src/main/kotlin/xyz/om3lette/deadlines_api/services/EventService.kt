package xyz.om3lette.deadlines_api.services

import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import xyz.om3lette.deadlines_api.data.common.constraints.DatabaseConstraint
import xyz.om3lette.deadlines_api.configs.properties.DeadlinesProperties
import xyz.om3lette.deadlines_api.data.common.response.PaginationResponse
import xyz.om3lette.deadlines_api.data.permissions.dto.EventScope
import xyz.om3lette.deadlines_api.data.permissions.dto.ThreadScope
import xyz.om3lette.deadlines_api.data.scopes.common.dto.UsernameRolePairList
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventStatsDTO
import xyz.om3lette.deadlines_api.data.scopes.event.model.Event
import xyz.om3lette.deadlines_api.data.scopes.event.model.EventKind
import xyz.om3lette.deadlines_api.data.scopes.event.repo.EventRepository
import xyz.om3lette.deadlines_api.data.scopes.event.response.EventCreatedResponse
import xyz.om3lette.deadlines_api.data.scopes.event.response.EventResponseParams
import xyz.om3lette.deadlines_api.data.scopes.event.response.EventResponseWithRole
import xyz.om3lette.deadlines_api.data.scopes.thread.repo.ThreadRepository
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeType
import xyz.om3lette.deadlines_api.data.scopes.userScope.model.UserScope
import xyz.om3lette.deadlines_api.data.scopes.userScope.repo.UserScopeRepository
import xyz.om3lette.deadlines_api.data.scopes.userScope.response.UserScopeResponse
import xyz.om3lette.deadlines_api.data.user.model.User
import xyz.om3lette.deadlines_api.exceptions.enums.ErrorCode
import xyz.om3lette.deadlines_api.exceptions.type.StatusCodeException
import xyz.om3lette.deadlines_api.services.notifications.EventReminderPlannerService
import xyz.om3lette.deadlines_api.services.notifications.NotificationService
import xyz.om3lette.deadlines_api.services.permission.PermissionContext
import xyz.om3lette.deadlines_api.services.permission.PermissionService
import xyz.om3lette.deadlines_api.util.jpaRepository.findByIdOr404
import xyz.om3lette.deadlines_api.util.jpaRepository.violatesConstraint
import xyz.om3lette.deadlines_api.util.page.toPaginationResponse
import xyz.om3lette.deadlines_api.util.requirePermission
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class EventService(
    private val deadlinesProperties: DeadlinesProperties,
    private val userScopeRepository: UserScopeRepository,
    private val threadRepository: ThreadRepository,
    private val eventRepository: EventRepository,
    private val eventReminderPlannerService: EventReminderPlannerService,
    private val permissionService: PermissionService,
    private val notificationService: NotificationService
) {
    @Transactional
    fun createEvent(
        issuer: User,
        threadId: Long,
        title: String,
        description: String?,
        due: Instant,
        assignees: UsernameRolePairList,
        kind: EventKind = EventKind.DEADLINE
    ): EventCreatedResponse {
        val now = Instant.now()
        val minExpirationTime = now.plus(deadlinesProperties.minExpiryMinutes, ChronoUnit.MINUTES)
        if (due.isBefore(minExpirationTime)) {
            throw StatusCodeException(
                statusCode = 400,
                code = ErrorCode.DDL_INVALID_TIMESTAMP,
                params = EventResponseParams.invalidDueTimestamp(
                    due,
                    deadlinesProperties.minExpiryMinutes,
                    now
                )
            )
        }
        val thread = threadRepository.findByIdOr404(threadId, ErrorCode.THR_NOT_FOUND)

        requirePermission(
            permissionService.canCreateDeadline(issuer, thread)
        )

        val creationTimestamp = Instant.now()
        val deadline = eventRepository.save(
            Event(
                id = 0,
                thread = thread,
                title = title,
                description = description,
                createdAt = creationTimestamp,
                due = due,
                kind = kind
            )
        )

        val assigneeMap = assignees.filterByScope(ScopeType.DEADLINE).associateBy { it.username.lowercase() }
        if (assigneeMap.size > deadlinesProperties.maxAssignees) {
            throw StatusCodeException(409, ErrorCode.DDL_ASSIGNEE_LIMIT_EXCEEDED)
        }
        val deadlineAssigneeScopes: MutableList<UserScope> = mutableListOf()
        userScopeRepository.findByScopeTypeScopeIdInAndUsernameInIgnoreCase(
            thread.organization.id,
            ScopeType.ORGANIZATION,
            assigneeMap.keys.map { it }
        )
            .groupBy { it.user.id }.values
            .map { scopes -> scopes.maxBy { it.role.rank } }
            .forEach { userScope ->
                deadlineAssigneeScopes.add(
                    UserScope(
                        userScope.user,
                        ScopeType.DEADLINE,
                        deadline.id,
                        assigneeMap[userScope.user.username.lowercase()]!!.role,
                        creationTimestamp
                    )
                )
            }

        userScopeRepository.saveAll(deadlineAssigneeScopes)
        eventReminderPlannerService.createNotifications(deadline, now)

        return EventCreatedResponse(
            deadlineId = deadline.id,
            assignees = deadlineAssigneeScopes.size,
            globalRole = permissionService.getMaxRole(listOf(
                PermissionContext.PermissionKey(ScopeType.DEADLINE, deadline.id),
                PermissionContext.PermissionKey(ScopeType.THREAD, thread.id),
                PermissionContext.PermissionKey(ScopeType.ORGANIZATION, thread.organization.id)
            ))
        )
    }

    fun deleteEvent(issuer: User, deadlineId: Long) {
        val deadline = eventRepository.findByIdOr404(deadlineId, ErrorCode.DDL_NOT_FOUND)

        requirePermission(
            permissionService.canDelete(issuer, EventScope(deadline))
        )

        eventRepository.delete(deadline)
    }

    fun addAssignee(issuer: User, deadlineId: Long, username: String, role: ScopeRole) {
        if (!role.canBeAssignedInScope(ScopeType.DEADLINE)) {
            throw StatusCodeException(400, ErrorCode.INVITATION_INVALID_ROLE)
        }
        if (username.equals(issuer.username, ignoreCase = true)) {
            throw StatusCodeException(400, ErrorCode.INVITATION_SELF_INVITE)
        }

        val deadline = eventRepository.findByIdOr404(deadlineId, ErrorCode.DDL_NOT_FOUND)
        val newAssignee = userScopeRepository.findByScopeTypeAndScopeIdAndUsernameIgnoreCase(
            username, ScopeType.ORGANIZATION, deadline.thread.organization.id
        ).orElseThrow{ StatusCodeException(400, ErrorCode.INVITATION_NOT_ORG_MEMBER) }
        requirePermission(
            permissionService.canAddAssignees(issuer, EventScope(deadline))
        )
        if (userScopeRepository.countDeadlineAssignees(deadline.id) >= deadlinesProperties.maxAssignees) {
            throw StatusCodeException(409, ErrorCode.DDL_ASSIGNEE_LIMIT_EXCEEDED)
        }

        try {
            userScopeRepository.saveAndFlush(
                UserScope(
                    newAssignee.user,
                    ScopeType.DEADLINE,
                    deadline.id,
                    role,
                    Instant.now()
                )
            )
        } catch (error: DataIntegrityViolationException) {
            if (!error.violatesConstraint(DatabaseConstraint.PK_USER_SCOPES)) throw error
            throw StatusCodeException(409, ErrorCode.MEMBER_ALREADY_ASSIGNED)
        }
    }

    @Transactional
    fun removeAssignee(issuer: User, deadlineId: Long, assigneeUsername: String) {
        if (assigneeUsername.equals(issuer.username, ignoreCase = true)) {
            throw StatusCodeException(400, ErrorCode.ACTION_SELF_REMOVAL)
        }

        val permissionDTO = userScopeRepository.findRoleAndUserIdByUsernameLowerAndScopeIdAndScopeType(
            assigneeUsername.lowercase(), deadlineId, ScopeType.DEADLINE
        ) ?: throw StatusCodeException(404, ErrorCode.MEMBER_NOT_FOUND)
        val permissionScope = EventScope(
            eventRepository.findByIdOr404(deadlineId, ErrorCode.DDL_NOT_FOUND)
        )
        requirePermission(
            permissionService.canRemoveAssignee(issuer, permissionScope, permissionDTO.role)
        )

        userScopeRepository.deleteByUserIdAndScopeId(permissionDTO.userId, null, null, deadlineId)
    }

    fun getEvent(issuer: User?, deadlineId: Long): EventResponseWithRole {
        val deadline = eventRepository.findByIdOr404(deadlineId, ErrorCode.DDL_NOT_FOUND)

        requirePermission(
            permissionService.hasAccess(issuer, EventScope(deadline))
        )

        val stats = prepareEventResponseData(listOf(deadline))
        return mapEventToFullResponse(issuer, deadline, stats)
    }

    private fun prepareEventResponseData(deadlines: List<Event>, user: User? = null): Map<Long, EventStatsDTO> {
        val deadlineIds = mutableSetOf<Long>()
        val threadIds = mutableSetOf<Long>()
        val organizationIds = mutableSetOf<Long>()

        for (deadline in deadlines) {
            deadlineIds.add(deadline.id)
            threadIds.add(deadline.thread.id)
            organizationIds.add(deadline.thread.organization.id)
        }

        val deadlineIdsList = deadlineIds.toList()
        if (user != null) {
            permissionService.prefetchUserRoles(
                user,
                orgIds = organizationIds.toList(),
                thrIds = threadIds.toList(),
                ddlIds = deadlineIdsList
            )
        }

        return eventRepository.getEventStats(deadlineIdsList)
            .associateBy { it.eventId }
    }

    private fun mapEventToFullResponse(user: User?, deadline: Event, stats: Map<Long, EventStatsDTO>) =
        deadline.toResponse(stats[deadline.id]!!, permissionService.buildDeadlinePermissions(user, deadline)).withRole(
            user?.let { permissionService.getRole(deadline.id, ScopeType.DEADLINE) },
            user?.let {
                permissionService.getMaxRole(
                    listOf(
                        PermissionContext.PermissionKey(ScopeType.DEADLINE, deadline.id),
                        PermissionContext.PermissionKey(ScopeType.THREAD, deadline.thread.id),
                        PermissionContext.PermissionKey(ScopeType.ORGANIZATION, deadline.thread.organization.id)
                    )
                ).takeIf {
                    // The goal is to not return a "read only" role
                    maxRole -> maxRole.isHigherThan(ScopeRole.DDL_ASSIGNEE)
                }
            }
        )

    fun getEventsByUser(
        issuer: User,
        pageNumber: Int,
        pageSize: Int
    ): PaginationResponse<EventResponseWithRole> {
        val userDeadlines = eventRepository.findAllByUser(
            issuer.id, PageRequest.of(pageNumber, pageSize)
        )

        val stats = prepareEventResponseData(userDeadlines.toList(), issuer)
        return PaginationResponse.fromPage(
            userDeadlines.map {
                mapEventToFullResponse(issuer, it, stats)
            }
        )
    }

    fun getEventsByThread(
        issuer: User?,
        threadId: Long,
        pageNumber: Int,
        pageSize: Int
    ): PaginationResponse<EventResponseWithRole> {
        val thread = threadRepository.findByIdOr404(threadId, ErrorCode.THR_NOT_FOUND)

        requirePermission(
            permissionService.hasAccess(issuer, ThreadScope(thread))
        )

        val threadDeadlines = eventRepository.findAllByThread(
            thread, PageRequest.of(pageNumber, pageSize)
        )
        val stats = prepareEventResponseData(threadDeadlines.toList(), issuer)
        return PaginationResponse.fromPage(
            threadDeadlines.map {
                mapEventToFullResponse(issuer, it, stats)
            }
        )
    }

    @Transactional
    fun patchEvent(
        issuer: User,
        deadlineId: Long,
        title: String?,
        description: String?,
        isCompleted: Boolean?,
        due: Instant?
    ) {
        if (
            title == null && description == null &&
            isCompleted == null && due == null
        ) {
            return
        }

        val deadline = eventRepository.findByIdOr404(deadlineId, ErrorCode.DDL_NOT_FOUND)
        requirePermission(
            permissionService.canUpdate(issuer, EventScope(deadline))
        )
        if (deadline.kind == EventKind.ALERT && isCompleted == true) {
            throw StatusCodeException(400, ErrorCode.DDL_ALERT_COMPLETION_NOT_ALLOWED)
        }
        val wasCompleted = deadline.isCompleted
        val oldDue = deadline.due

        if (due != null) {
            val now = Instant.now()
            if (due.isBefore(now)) {
                throw StatusCodeException(
                    400,
                    ErrorCode.DDL_INVALID_TIMESTAMP,
                    params = EventResponseParams.invalidDueTimestamp(
                        due,
                        deadlinesProperties.minExpiryMinutes,
                        now
                    )
                )
            }
            deadline.due = due
        }

        if (title != null) deadline.title = title
        if (description != null) deadline.description = description
        if (isCompleted != null) deadline.isCompleted = isCompleted

        // This by design will not create notifications if due date of a completed deadline is moved further (!)
        when {
            !wasCompleted && isCompleted == true -> eventReminderPlannerService.deleteNotifications(deadline)
            wasCompleted && isCompleted == false -> eventReminderPlannerService.reconcileNotifications(deadline)
            due != null && !deadline.isCompleted -> eventReminderPlannerService.reconcileNotifications(deadline)
        }

        eventRepository.save(deadline)
        if (!deadline.isCompleted && oldDue != deadline.due) {
            notificationService.notifyDeadlineDueChanged(deadline.id, oldDue, deadline.due)
        }
    }

    fun getEventAssignees(
        issuer: User?,
        deadlineId: Long,
        pageNumber: Int,
        pageSize: Int
    ): PaginationResponse<UserScopeResponse> {
        val deadline = eventRepository.findByIdOr404(deadlineId, ErrorCode.DDL_NOT_FOUND)

        requirePermission(
            permissionService.hasAccess(issuer, EventScope(deadline))
        )

        val pageRequest = PageRequest.of(
            pageNumber, pageSize,
            Sort.by("role").descending().and(Sort.by("assignedAt", "user.id"))
        )
        return userScopeRepository.findAllByScopeIdAndScopeType(
            deadlineId, ScopeType.DEADLINE, pageRequest
        ).toPaginationResponse { it.toResponse() }
    }
}
