package xyz.om3lette.deadlines_api.openapi

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyLong
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.mock.web.MockMultipartFile
import tools.jackson.databind.json.JsonMapper
import xyz.om3lette.deadlines_api.config.TestInfraMocks
import xyz.om3lette.deadlines_api.data.attachments.reponse.AttachmentCreatedResponse
import xyz.om3lette.deadlines_api.data.scopes.deadline.dto.DeadlineDTO
import xyz.om3lette.deadlines_api.data.scopes.deadline.dto.DeadlinePermissions
import xyz.om3lette.deadlines_api.data.scopes.deadline.response.DeadlineResponse
import xyz.om3lette.deadlines_api.data.scopes.deadline.response.DeadlineStatsResponse
import xyz.om3lette.deadlines_api.data.user.model.User
import xyz.om3lette.deadlines_api.data.user.repo.UserRepository
import xyz.om3lette.deadlines_api.db.TestDatabaseConfig
import xyz.om3lette.deadlines_api.services.DeadlineService
import xyz.om3lette.deadlines_api.services.JwtService
import xyz.om3lette.deadlines_api.services.storage.AttachmentsService
import org.springframework.web.multipart.MultipartFile
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Instant
import java.util.Optional
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = [
    "spring.config.import=",
    "springdoc.api-docs.enabled=true",
    "springdoc.packages-to-scan=xyz.om3lette.deadlines_api.controllers",
    "spring.grpc.server.port=0",
])
@ActiveProfiles("test")
@Tag("testcontainers")
@Import(TestInfraMocks::class, TestDatabaseConfig::class)
class OpenApiWireContractTest {
    @LocalServerPort private var port: Int = 0
    @Autowired private lateinit var jwtService: JwtService
    @MockitoBean private lateinit var users: UserRepository
    @MockitoBean private lateinit var attachments: AttachmentsService
    @MockitoBean private lateinit var deadlines: DeadlineService

    private val client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build()
    private val mapper = JsonMapper.builder().build()
    private val user = User(id = 7, _username = "wire-test", joinedAt = Instant.EPOCH, fullName = "Wire Test", timeZone = "UTC")
    private lateinit var token: String

    @BeforeEach
    fun authenticate() {
        Mockito.`when`(users.findByUsernameIgnoreCase(user.username)).thenReturn(Optional.of(user))
        token = jwtService.generateAccessToken(user).first
    }

    @Test
    fun `live JSON serialization agrees with the documented Kotlin property names`() {
        Mockito.`when`(deadlines.getDeadline(any(User::class.java), anyLong())).thenReturn(
            DeadlineResponse(
                DeadlineDTO(42, "Deadline", null, Instant.EPOCH, Instant.EPOCH, true, 3),
                DeadlineStatsResponse(0, 0), DeadlinePermissions(false, false, false, false)
            ).withRole(null, null)
        )
        val response = send("/api/deadlines/42")
        assertEquals(200, response.statusCode())
        assertTrue(response.headers().firstValue("content-type").orElse("").startsWith("application/json"))
        val body = mapper.readTree(response.body())
        assertTrue(body.path("isCompleted").asBoolean())
        assertFalse(body.has("completed"))
        listOf("description", "role", "globalRole").forEach { field ->
            assertTrue(body.path(field).isNull, "$field must be present with a null value")
        }

        var completed: Boolean? = null
        Mockito.doAnswer { invocation ->
            completed = invocation.getArgument(4)
            null
        }.`when`(deadlines).patchDeadline(any(User::class.java) ?: user, anyLong(), Mockito.isNull(), Mockito.isNull(), Mockito.anyBoolean(), Mockito.isNull())
        val patch = send("/api/deadlines/42", "PATCH", "application/json", """{"isCompleted":true}""".toByteArray())
        assertEquals(200, patch.statusCode())
        assertEquals(true, completed)

        val docs = mapper.readTree(send("/v3/api-docs").body())
        val properties = docs.path("components").path("schemas").path("DeadlineResponseWithRole").path("properties")
        assertTrue(properties.has("isCompleted"))
        assertFalse(properties.has("completed"))
    }

    @Test
    fun `live multipart upload accepts the documented JSON Blob part and preserves binary data`() {
        val bytes = byteArrayOf(0, 1, 2, 127, -1)
        var receivedBytes = byteArrayOf()
        var receivedName = ""
        var receivedFilename = ""
        Mockito.`when`(attachments.createAttachment(
            any(User::class.java) ?: user,
            anyLong(),
            any(MultipartFile::class.java) ?: MockMultipartFile("file", bytes),
            any(String::class.java) ?: ""
        ))
            .thenAnswer { invocation ->
                val file = invocation.getArgument<MultipartFile>(2)
                receivedBytes = file.bytes
                receivedName = file.originalFilename.orEmpty()
                receivedFilename = invocation.getArgument(3)
                AttachmentCreatedResponse(99)
            }
        val boundary = "wire-contract-boundary"
        val prefix = (
            "--$boundary\r\n" +
            "Content-Disposition: form-data; name=\"meta\"; filename=\"blob\"\r\n" +
            "Content-Type: application/json\r\n\r\n{\"filename\":\"report.txt\"}\r\n" +
            "--$boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"original.txt\"\r\n" +
            "Content-Type: application/octet-stream\r\n\r\n"
        ).toByteArray()
        val payload = prefix + bytes + "\r\n--$boundary--\r\n".toByteArray()
        val response = send("/api/deadlines/42/attachments", "POST", "multipart/form-data; boundary=$boundary", payload)
        assertEquals(200, response.statusCode(), response.body())
        assertEquals(99, mapper.readTree(response.body()).path("attachmentId").asInt())
        assertContentEquals(bytes, receivedBytes)
        assertEquals("original.txt", receivedName)
        assertEquals("report.txt", receivedFilename)

        // The same metadata as text/plain must not pass as a JSON request part.
        val invalid = prefix.toString(Charsets.UTF_8).replace("Content-Type: application/json", "Content-Type: text/plain").toByteArray() + bytes + "\r\n--$boundary--\r\n".toByteArray()
        assertEquals(415, send("/api/deadlines/42/attachments", "POST", "multipart/form-data; boundary=$boundary", invalid).statusCode())
    }

    @Test
    fun `live download returns the documented redirect without a JSON body`() {
        val location = URI.create("https://storage.example/file?signature=test")
        Mockito.`when`(attachments.getAttachment(any(User::class.java), anyLong(), any(String::class.java)))
            .thenReturn(ResponseEntity.status(HttpStatus.FOUND).location(location).build())
        val response = send("/api/attachments/99?disposition=attachment")
        assertEquals(302, response.statusCode())
        assertEquals(location.toString(), response.headers().firstValue("location").orElse(""))
        assertEquals("", response.body())
        val docs = mapper.readTree(send("/v3/api-docs").body())
        val responses = docs.path("paths").path("/api/attachments/{attachmentId}").path("get").path("responses")
        assertTrue(responses.path("302").path("headers").has("Location"))
        assertFalse(responses.has("200"))
    }

    private fun send(path: String, method: String = "GET", contentType: String? = null, body: ByteArray = byteArrayOf()): HttpResponse<String> {
        val request = HttpRequest.newBuilder(URI.create("http://localhost:$port$path"))
            .header("Authorization", "Bearer $token")
            .method(method, HttpRequest.BodyPublishers.ofByteArray(body))
        if (contentType != null) request.header("Content-Type", contentType)
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString())
    }
}
