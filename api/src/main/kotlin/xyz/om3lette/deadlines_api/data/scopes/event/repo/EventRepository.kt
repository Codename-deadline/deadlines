package xyz.om3lette.deadlines_api.data.scopes.event.repo

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventStatsDTO
import xyz.om3lette.deadlines_api.data.scopes.event.model.Event
import xyz.om3lette.deadlines_api.data.scopes.thread.model.Thread

interface EventRepository : JpaRepository<Event, Long> {

    @Query("SELECT d.id FROM Event d WHERE d.thread.organization.id = :orgId")
    fun findAllIdsByOrganizationId(@Param("orgId") organizationId: Long): List<Long>

    @Query("SELECT d.id FROM Event d WHERE d.thread.id = :threadId")
    fun findAllIdsByThreadId(@Param("threadId") threadId: Long): List<Long>

    fun findAllByThread(thread: Thread, pageable: Pageable): Page<Event>

    @Query("""
        SELECT
            d.id as eventId,
            (SELECT COUNT(us) FROM UserScope us WHERE us.scopeId = d.id AND us.scopeType = 'DDL') as assignees,
            (SELECT COUNT(at.id) FROM Attachment at WHERE at.event = d) as attachments
        FROM Event d
        WHERE d.id IN :ids
    """)
    fun getEventStats(@Param("ids") deadlineIds: List<Long>): List<EventStatsDTO>

    @Query("""
        SELECT d
        FROM Event d
        WHERE EXISTS (
            SELECT 1
            FROM UserScope us
            WHERE us.scopeId = d.id
              AND us.scopeType = 'DDL'
              AND us.user.id = :userId
        )
    """)
    fun findAllByUser(userId: Long, pageable: Pageable): Page<Event>
}
