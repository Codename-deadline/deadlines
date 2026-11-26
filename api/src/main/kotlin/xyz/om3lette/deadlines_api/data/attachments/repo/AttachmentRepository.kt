package xyz.om3lette.deadlines_api.data.attachments.repo

import org.springframework.data.jpa.repository.JpaRepository
import xyz.om3lette.deadlines_api.data.attachments.model.Attachment
import xyz.om3lette.deadlines_api.data.scopes.event.model.Event

interface AttachmentRepository : JpaRepository<Attachment, Long> {
    fun countByEvent(event: Event): Long

    fun findAllByEventOrderByUploadedAtDesc(event: Event): List<Attachment>
}
