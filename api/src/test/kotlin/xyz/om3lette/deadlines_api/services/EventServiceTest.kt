package xyz.om3lette.deadlines_api.services

import io.mockk.CapturingSlot
import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertAll
import org.junit.jupiter.api.assertThrows
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import xyz.om3lette.deadlines_api.DomainObjectBuilder
import xyz.om3lette.deadlines_api.db.constraintViolation
import xyz.om3lette.deadlines_api.data.common.constraints.DatabaseConstraint
import xyz.om3lette.deadlines_api.configs.properties.DeadlinesProperties
import xyz.om3lette.deadlines_api.data.permissions.dto.EventScope
import xyz.om3lette.deadlines_api.data.permissions.dto.ThreadScope
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventPermissions
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventStatsDTO
import xyz.om3lette.deadlines_api.data.scopes.event.model.Event
import xyz.om3lette.deadlines_api.data.scopes.event.model.EventKind
import xyz.om3lette.deadlines_api.data.scopes.common.dto.UsernameRolePairList
import xyz.om3lette.deadlines_api.data.scopes.event.repo.EventRepository
import xyz.om3lette.deadlines_api.data.scopes.organization.model.Organization
import xyz.om3lette.deadlines_api.data.scopes.thread.model.Thread
import xyz.om3lette.deadlines_api.data.scopes.thread.repo.ThreadRepository
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeRole
import xyz.om3lette.deadlines_api.data.scopes.userScope.enums.ScopeType
import xyz.om3lette.deadlines_api.data.scopes.userScope.model.UserScope
import xyz.om3lette.deadlines_api.data.scopes.userScope.repo.UserScopeRepository
import xyz.om3lette.deadlines_api.data.user.model.User
import xyz.om3lette.deadlines_api.exceptions.enums.ErrorCode
import xyz.om3lette.deadlines_api.exceptions.type.StatusCodeException
import xyz.om3lette.deadlines_api.services.notifications.EventReminderPlannerService
import xyz.om3lette.deadlines_api.services.notifications.NotificationService
import xyz.om3lette.deadlines_api.services.permission.PermissionService
import java.time.Instant
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class EventServiceTest {
    private val maxAssignees = 2L
    private val userScopeRepository: UserScopeRepository = mockk()
    private val threadRepository: ThreadRepository = mockk()
    private val eventRepository: EventRepository = mockk()
    private val eventReminderPlannerService: EventReminderPlannerService = mockk()
    private val permissionService: PermissionService = mockk()
    private val notificationService: NotificationService = mockk()
    private val eventService = EventService(
        DeadlinesProperties(maxAssignees = maxAssignees),
        userScopeRepository,
        threadRepository,
        eventRepository,
        eventReminderPlannerService,
        permissionService,
        notificationService
    )

    private lateinit var issuer: User
    private lateinit var assignee: User
    private lateinit var organization: Organization
    private lateinit var thread: Thread
    private lateinit var deadline: Event
    private lateinit var organizationMembership: UserScope

    private fun deadlineScope() = EventScope(deadline)

    @BeforeEach
    fun commonHappyStubs() {
        issuer = DomainObjectBuilder.userBob()
        assignee = DomainObjectBuilder.userAlice()
        organization = DomainObjectBuilder.organization()
        thread = DomainObjectBuilder.thread(organization)
        deadline = DomainObjectBuilder.deadline(thread)
        organizationMembership = DomainObjectBuilder.userScope(
            user = assignee,
            scopeType = ScopeType.ORGANIZATION,
            scopeId = organization.id,
            role = ScopeRole.ORG_MEMBER
        )

        every { eventRepository.findById(deadline.id) } returns Optional.of(deadline)
    }

    @Nested
    inner class CreateEntry {
        private val saved = slot<Event>()

        @BeforeEach
        fun stubs() {
            every { threadRepository.findById(thread.id) } returns Optional.of(thread)
            every { permissionService.canCreateDeadline(issuer, thread) } returns true
            every { eventRepository.save(capture(saved)) } answers { firstArg<Event>().copy(id = 100) }
            every { userScopeRepository.findByScopeTypeScopeIdInAndUsernameInIgnoreCase(any(), any(), any()) } returns emptyList()
            every { userScopeRepository.saveAll(any<List<UserScope>>()) } answers { firstArg() }
            every { eventReminderPlannerService.createNotifications(any(), any()) } just Runs
            every { permissionService.getMaxRole(any()) } returns ScopeRole.ORG_OWNER
        }

        @Test
        fun `new alerts are persisted and receive reminders`() {
            val due = Instant.now().plusSeconds(86400)
            eventService.createEvent(issuer, thread.id, "Release day", null, due, UsernameRolePairList(emptyList()), EventKind.ALERT)

            assertEquals(EventKind.ALERT, saved.captured.kind)
            assertEquals(false, saved.captured.isCompleted)
            verify { eventReminderPlannerService.createNotifications(match { it.kind == EventKind.ALERT && it.due == due }, any()) }
        }

        @Test
        fun `creation defaults to deadline for existing clients`() {
            eventService.createEvent(issuer, thread.id, "Task", null, Instant.now().plusSeconds(86400), UsernameRolePairList(emptyList()))

            assertEquals(EventKind.DEADLINE, saved.captured.kind)
        }
    }

    @Nested
    inner class AddAssignee {
        private val savedUserScopeSlot: CapturingSlot<UserScope> = slot()

        @BeforeEach
        fun commonHappyStubs() {
            every {
                userScopeRepository.findByScopeTypeAndScopeIdAndUsernameIgnoreCase(
                    assignee.username,
                    ScopeType.ORGANIZATION,
                    organization.id
                )
            } returns Optional.of(organizationMembership)
            every { permissionService.canAddAssignees(issuer, deadlineScope()) } returns true
            every { userScopeRepository.countDeadlineAssignees(deadline.id) } returns 0
            every { userScopeRepository.saveAndFlush(capture(savedUserScopeSlot)) } returnsArgument 0
        }

        @Test
        fun `invalid deadline role throws 400`() {
            val error = assertThrows<StatusCodeException> {
                eventService.addAssignee(issuer, deadline.id, assignee.username, ScopeRole.THR_ASSIGNEE)
            }

            assertAll(
                { assertEquals(400, error.statusCode) },
                { assertEquals(ErrorCode.INVITATION_INVALID_ROLE, error.code) },
                { verify(exactly = 0) { userScopeRepository.saveAndFlush(any()) } }
            )
        }

        @Test
        fun `assigning issuer throws 400`() {
            val error = assertThrows<StatusCodeException> {
                eventService.addAssignee(issuer, deadline.id, issuer.username.uppercase(), ScopeRole.DDL_ASSIGNEE)
            }

            assertAll(
                { assertEquals(400, error.statusCode) },
                { assertEquals(ErrorCode.INVITATION_SELF_INVITE, error.code) },
                { verify(exactly = 0) { userScopeRepository.saveAndFlush(any()) } }
            )
        }

        @Test
        fun `missing deadline throws 404`() {
            every { eventRepository.findById(deadline.id) } returns Optional.empty()

            val error = assertThrows<StatusCodeException> {
                eventService.addAssignee(issuer, deadline.id, assignee.username, ScopeRole.DDL_ASSIGNEE)
            }

            assertAll(
                { assertEquals(404, error.statusCode) },
                { assertEquals(ErrorCode.DDL_NOT_FOUND, error.code) },
                { verify(exactly = 0) { userScopeRepository.saveAndFlush(any()) } }
            )
        }

        @Test
        fun `assignee outside organization throws 400`() {
            every {
                userScopeRepository.findByScopeTypeAndScopeIdAndUsernameIgnoreCase(
                    assignee.username,
                    ScopeType.ORGANIZATION,
                    organization.id
                )
            } returns Optional.empty()

            val error = assertThrows<StatusCodeException> {
                eventService.addAssignee(issuer, deadline.id, assignee.username, ScopeRole.DDL_ASSIGNEE)
            }

            assertAll(
                { assertEquals(400, error.statusCode) },
                { assertEquals(ErrorCode.INVITATION_NOT_ORG_MEMBER, error.code) },
                { verify(exactly = 0) { userScopeRepository.saveAndFlush(any()) } }
            )
        }

        @Test
        fun `insufficient permissions throws 403`() {
            every { permissionService.canAddAssignees(issuer, deadlineScope()) } returns false

            val error = assertThrows<StatusCodeException> {
                eventService.addAssignee(issuer, deadline.id, assignee.username, ScopeRole.DDL_ASSIGNEE)
            }

            assertAll(
                { assertEquals(403, error.statusCode) },
                { assertEquals(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, error.code) },
                { verify(exactly = 0) { userScopeRepository.saveAndFlush(any()) } }
            )
        }

        @Test
        fun `assignee limit reached throws 409`() {
            every { userScopeRepository.countDeadlineAssignees(deadline.id) } returns maxAssignees

            val error = assertThrows<StatusCodeException> {
                eventService.addAssignee(issuer, deadline.id, assignee.username, ScopeRole.DDL_ASSIGNEE)
            }

            assertAll(
                { assertEquals(409, error.statusCode) },
                { assertEquals(ErrorCode.DDL_ASSIGNEE_LIMIT_EXCEEDED, error.code) },
                { verify(exactly = 0) { userScopeRepository.saveAndFlush(any()) } }
            )
        }

        @Test
        fun `already assigned member throws 409`() {
            every { userScopeRepository.saveAndFlush(any()) } throws
                constraintViolation(DatabaseConstraint.PK_USER_SCOPES)

            val error = assertThrows<StatusCodeException> {
                eventService.addAssignee(issuer, deadline.id, assignee.username, ScopeRole.DDL_ASSIGNEE)
            }

            assertAll(
                { assertEquals(409, error.statusCode) },
                { assertEquals(ErrorCode.MEMBER_ALREADY_ASSIGNED, error.code) }
            )
        }

        @Test
        fun `happy path saves deadline assignee scope`() {
            eventService.addAssignee(issuer, deadline.id, assignee.username, ScopeRole.DDL_ASSIGNEE)

            assertAll(
                { assertTrue(savedUserScopeSlot.isCaptured) },
                { assertEquals(assignee, savedUserScopeSlot.captured.user) },
                { assertEquals(ScopeType.DEADLINE, savedUserScopeSlot.captured.scopeType) },
                { assertEquals(deadline.id, savedUserScopeSlot.captured.scopeId) },
                { assertEquals(ScopeRole.DDL_ASSIGNEE, savedUserScopeSlot.captured.role) }
            )
        }
    }

    @Nested
    inner class AnonymousReads {
        @Test
        fun `thread deadlines do not resolve user roles for anonymous access`() {
            every { threadRepository.findById(thread.id) } returns Optional.of(thread)
            every { permissionService.hasAccess(null, ThreadScope(thread)) } returns true
            every { eventRepository.findAllByThread(thread, any()) } returns PageImpl(listOf(deadline))
            every { eventRepository.getEventStats(listOf(deadline.id)) } returns listOf(
                EventStatsDTO(deadline.id, assignees = 0, attachments = 0)
            )
            every { permissionService.buildDeadlinePermissions(null, deadline) } returns EventPermissions(
                update = false,
                delete = false,
                manageAssignees = false,
                manageAttachments = false
            )

            val result = eventService.getEventsByThread(null, thread.id, 0, 10)

            assertAll(
                { assertEquals(null, result.data.single().role) },
                { assertEquals(null, result.data.single().globalRole) },
                { verify(exactly = 0) { permissionService.prefetchUserRoles(any(), any(), any(), any()) } },
                { verify(exactly = 0) { permissionService.getRole(any(), any()) } },
                { verify(exactly = 0) { permissionService.getMaxRole(any()) } }
            )
        }

        @Test
        fun `anonymous deadline assignees use scope access check`() {
            every { permissionService.hasAccess(null, deadlineScope()) } returns true
            every { userScopeRepository.findAllByScopeIdAndScopeType(deadline.id, ScopeType.DEADLINE, any()) } returns PageImpl(emptyList())

            eventService.getEventAssignees(null, deadline.id, 0, 2)

            verify(exactly = 1) { permissionService.hasAccess(null, deadlineScope()) }
            verify(exactly = 1) { userScopeRepository.findAllByScopeIdAndScopeType(deadline.id, ScopeType.DEADLINE, any()) }
        }
    }

    @Nested
    inner class PatchDeadline {
        @BeforeEach
        fun commonHappyStubs() {
            every { permissionService.canUpdate(issuer, any()) } returns true
            every { eventRepository.save(any()) } returnsArgument 0
            every { eventReminderPlannerService.deleteNotifications(any()) } just Runs
            every { eventReminderPlannerService.reconcileNotifications(any(), any()) } just Runs
            every { notificationService.notifyDeadlineDueChanged(deadline.id, any(), any()) } just Runs
        }

        @Test
        fun `alerts cannot be completed and reminders are preserved`() {
            deadline = deadline.copy(kind = EventKind.ALERT)
            every { eventRepository.findById(deadline.id) } returns Optional.of(deadline)

            val error = assertThrows<StatusCodeException> {
                eventService.patchEvent(issuer, deadline.id, null, null, true, null)
            }

            assertEquals(400, error.statusCode)
            assertEquals(ErrorCode.DDL_ALERT_COMPLETION_NOT_ALLOWED, error.code)
            assertEquals(false, deadline.isCompleted)
            verify(exactly = 0) { eventReminderPlannerService.deleteNotifications(any()) }
            verify(exactly = 0) { eventRepository.save(any()) }
        }

        @Test
        fun `moving an alert reschedules reminders and announces the new date`() {
            deadline = deadline.copy(kind = EventKind.ALERT)
            every { eventRepository.findById(deadline.id) } returns Optional.of(deadline)
            val oldDue = deadline.due
            val newDue = Instant.now().plusSeconds(86400)

            eventService.patchEvent(issuer, deadline.id, null, null, null, newDue)

            assertEquals(newDue, deadline.due)
            assertEquals(false, deadline.isCompleted)
            verify { eventReminderPlannerService.reconcileNotifications(deadline, any()) }
            verify { notificationService.notifyDeadlineDueChanged(deadline.id, oldDue, newDue) }
        }

        @Test
        fun `completing deadline deletes all scheduled notifications`() {
            eventService.patchEvent(issuer, deadline.id, null, null, true, null)

            assertTrue(deadline.isCompleted)
            verify(exactly = 1) { eventReminderPlannerService.deleteNotifications(deadline) }
            verify(exactly = 0) { eventReminderPlannerService.reconcileNotifications(any(), any()) }
        }

        @Test
        fun `reopening deadline reschedules notifications`() {
            deadline.isCompleted = true

            eventService.patchEvent(issuer, deadline.id, null, null, false, null)

            assertEquals(false, deadline.isCompleted)
            verify(exactly = 1) { eventReminderPlannerService.reconcileNotifications(deadline, any()) }
            verify(exactly = 0) { eventReminderPlannerService.deleteNotifications(any()) }
        }

        @Test
        fun `changing due date on active deadline reschedules notifications`() {
            val oldDue = deadline.due
            val newDue = Instant.now().plusSeconds(60 * 60)

            eventService.patchEvent(issuer, deadline.id, null, null, null, newDue)

            assertEquals(newDue, deadline.due)
            verify(exactly = 1) { eventReminderPlannerService.reconcileNotifications(deadline, any()) }
            verify(exactly = 0) { eventReminderPlannerService.deleteNotifications(any()) }
            verify(exactly = 1) { notificationService.notifyDeadlineDueChanged(deadline.id, oldDue, newDue) }
        }

        @Test
        fun `changing due date on completed deadline does not schedule notifications`() {
            deadline.isCompleted = true
            val newDue = Instant.now().plusSeconds(60 * 60)

            eventService.patchEvent(issuer, deadline.id, null, null, null, newDue)

            assertEquals(newDue, deadline.due)
            verify(exactly = 0) { eventReminderPlannerService.reconcileNotifications(any(), any()) }
            verify(exactly = 0) { eventReminderPlannerService.deleteNotifications(any()) }
            verify(exactly = 0) { notificationService.notifyDeadlineDueChanged(any(), any(), any()) }
        }

        @Test
        fun `unchanged due date does not send change notification`() {
            deadline.due = Instant.now().plusSeconds(60 * 60)

            eventService.patchEvent(issuer, deadline.id, null, null, null, deadline.due)

            verify(exactly = 0) { notificationService.notifyDeadlineDueChanged(any(), any(), any()) }
        }

        @Test
        fun `invalid due date does not send change notification`() {
            assertThrows<StatusCodeException> {
                eventService.patchEvent(issuer, deadline.id, null, null, null, Instant.EPOCH)
            }

            verify(exactly = 0) { notificationService.notifyDeadlineDueChanged(any(), any(), any()) }
        }

        @Test
        fun `changing due date while completing only deletes notifications`() {
            val newDue = Instant.now().plusSeconds(60 * 60)

            eventService.patchEvent(issuer, deadline.id, null, null, true, newDue)

            assertAll(
                { assertEquals(newDue, deadline.due) },
                { assertTrue(deadline.isCompleted) },
                { verify(exactly = 1) { eventReminderPlannerService.deleteNotifications(deadline) } },
                { verify(exactly = 0) { eventReminderPlannerService.reconcileNotifications(any(), any()) } },
                { verify(exactly = 0) { notificationService.notifyDeadlineDueChanged(any(), any(), any()) } }
            )
        }

        @Test
        fun `changing due date while reopening reschedules once`() {
            deadline.isCompleted = true
            val oldDue = deadline.due
            val newDue = Instant.now().plusSeconds(60 * 60)

            eventService.patchEvent(issuer, deadline.id, null, null, false, newDue)

            assertAll(
                { assertEquals(newDue, deadline.due) },
                { assertEquals(false, deadline.isCompleted) },
                { verify(exactly = 1) { eventReminderPlannerService.reconcileNotifications(deadline, any()) } },
                { verify(exactly = 0) { eventReminderPlannerService.deleteNotifications(any()) } },
                { verify(exactly = 1) { notificationService.notifyDeadlineDueChanged(deadline.id, oldDue, newDue) } }
            )
        }

        @Test
        fun `keeping active deadline incomplete does not duplicate notifications`() {
            eventService.patchEvent(issuer, deadline.id, null, null, false, null)

            verify(exactly = 0) { eventReminderPlannerService.reconcileNotifications(any(), any()) }
            verify(exactly = 0) { eventReminderPlannerService.deleteNotifications(any()) }
            verify(exactly = 0) { notificationService.notifyDeadlineDueChanged(any(), any(), any()) }
        }
    }
}
