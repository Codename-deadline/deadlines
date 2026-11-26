package xyz.om3lette.deadlines_api.data.scopes.event.model

import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import xyz.om3lette.deadlines_api.data.notifications.model.EventReminder
import xyz.om3lette.deadlines_api.data.scopes.common.constraints.ScopeTextConstraints
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventDTO
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventPermissions
import xyz.om3lette.deadlines_api.data.scopes.event.dto.EventStatsDTO
import xyz.om3lette.deadlines_api.data.scopes.event.response.EventResponse
import xyz.om3lette.deadlines_api.data.scopes.thread.model.Thread
import java.time.Instant

@Entity
@Table(name = "deadlines")
data class Event(
    @Id
    @SequenceGenerator(name = "deadline_seq", sequenceName = "deadline_sequence", initialValue = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "deadline_seq")
    val id: Long = 0,

    // Thread id is needed for global role lookup
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "thread_id", nullable = false)
    val thread: Thread,

    @field:NotBlank
    @field:Size(min = ScopeTextConstraints.TITLE_MIN, max = ScopeTextConstraints.TITLE_MAX)
    @Column(length = ScopeTextConstraints.TITLE_MAX, nullable = false)
    var title: String,

    @field:Size(max = ScopeTextConstraints.DESCRIPTION_MAX)
    @Column(length = ScopeTextConstraints.DESCRIPTION_MAX)
    var description: String?,

    @Column(nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    val createdAt: Instant,

    @Column(nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    var due: Instant,

    @Column(nullable = false)
    var isCompleted: Boolean = false,

    @OneToMany(cascade = [CascadeType.ALL], mappedBy = "event")
    @OnDelete(action = OnDeleteAction.CASCADE)
    val notifications: MutableList<EventReminder> = mutableListOf(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    val kind: EventKind = EventKind.DEADLINE,

) {
    fun toDTO() = EventDTO(
        id, title, description, createdAt, due, isCompleted, thread.id, kind
    )

    fun toResponse(stats: EventStatsDTO, permissions: EventPermissions) = EventResponse(
        event = toDTO(),
        stats = stats.toResponse(),
        permissions = permissions
    )
}
