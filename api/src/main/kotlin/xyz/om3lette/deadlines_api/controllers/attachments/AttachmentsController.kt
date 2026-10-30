package xyz.om3lette.deadlines_api.controllers.attachments

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.headers.Header
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.parameters.RequestBody as OpenApiRequestBody
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.http.MediaType
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import xyz.om3lette.deadlines_api.data.attachments.request.PatchFileMetadataRequest
import xyz.om3lette.deadlines_api.data.user.model.User
import xyz.om3lette.deadlines_api.services.storage.AttachmentsService

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/attachments")
@Tag(name = "Attachments")
class AttachmentsController(
    private val attachmentsService: AttachmentsService
) {
    @PutMapping("/{attachmentId}", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Replace attachment", requestBody = OpenApiRequestBody(required = true))
    fun replaceAttachment(
        @AuthenticationPrincipal user: User,
        @PathVariable @Positive attachmentId: Long,
        @RequestPart("file") file: MultipartFile
    ) = attachmentsService.replaceAttachment(user, attachmentId, file)

    @GetMapping("/{attachmentId}")
    @Operation(
        summary = "Get attachment",
        responses = [ApiResponse(
            responseCode = "302",
            description = "Redirect to a presigned storage URL",
            headers = [Header(name = "Location", schema = Schema(type = "string", format = "uri"))]
        )]
    )
    fun getAttachment(
        @AuthenticationPrincipal user: User?,
        @PathVariable @Positive attachmentId: Long,
        @RequestParam("disposition", required = false) disposition: String?
    ) = attachmentsService.getAttachment(user, attachmentId, disposition)

    @DeleteMapping("/{attachmentId}")
    @Operation(summary = "Delete attachment")
    fun deleteAttachment(
        @AuthenticationPrincipal user: User,
        @PathVariable @Positive attachmentId: Long
    ) = attachmentsService.deleteAttachment(user, attachmentId)

    @GetMapping("/{attachmentId}/metadata")
    @Operation(summary = "Get attachment metadata")
    fun getAttachmentMetadata(
        @AuthenticationPrincipal user: User?,
        @PathVariable @Positive attachmentId: Long
    ) = attachmentsService.getAttachmentMetadata(user, attachmentId)

    @PatchMapping("/{attachmentId}/metadata")
    @Operation(summary = "Update attachment metadata")
    fun patchAttachmentMetadata(
        @AuthenticationPrincipal user: User,
        @PathVariable @Positive attachmentId: Long,
        @Valid @RequestBody request: PatchFileMetadataRequest
    ) = attachmentsService.patchAttachmentMetadata(user, attachmentId, request.filename)
}
