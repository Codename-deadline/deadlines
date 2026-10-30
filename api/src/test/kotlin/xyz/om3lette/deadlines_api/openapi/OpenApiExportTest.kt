package xyz.om3lette.deadlines_api.openapi

import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.WebApplicationContext
import tools.jackson.databind.json.JsonMapper
import xyz.om3lette.deadlines_api.config.TestInfraMocks
import xyz.om3lette.deadlines_api.db.TestDatabaseConfig
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@SpringBootTest(properties = [
    "spring.config.import=",
    "springdoc.api-docs.enabled=true",
    "springdoc.packages-to-scan=xyz.om3lette.deadlines_api.controllers",
    "springdoc.swagger-ui.enabled=false",
    "spring.grpc.server.port=0",
])
@Tag("testcontainers")
@Tag("openapi-export")
@ActiveProfiles("test")
@Import(TestInfraMocks::class, TestDatabaseConfig::class)
class OpenApiExportTest {
    @Autowired
    private lateinit var context: WebApplicationContext

    @Test
    fun exportOpenApi() {
        val output = Path.of(requireNotNull(System.getProperty("openapi.output")) {
            "Run this exporter with ./gradlew exportOpenApi."
        })
        val response = MockMvcBuilders.webAppContextSetup(context).build()
            .get("/v3/api-docs")
            .andExpect {
                status { isOk() }
                jsonPath("$.paths['/api/user'].get") { exists() }
                jsonPath("$.components.schemas.ValidationViolation.discriminator.propertyName") {
                    value("reason")
                }
            }
            .andReturn().response.contentAsString

        val document = JsonMapper.builder().build().readTree(response)
        val schemas = document.path("components").path("schemas")

        val nullableResponseFields = mapOf(
            "OrganizationDTO" to listOf("description"),
            "OrganizationResponse" to listOf("description"),
            "OrganizationResponseWithRole" to listOf("description"),
            "ThreadResponse" to listOf("description"),
            "ThreadResponseWithRole" to listOf("description", "role", "globalRole"),
            "DeadlineResponseWithRole" to listOf("description", "role", "globalRole"),
            "OrganizationInvitationResponse" to listOf("answeredAt"),
            "AttachmentResponse" to listOf("uploadedBy")
        )
        nullableResponseFields.forEach { (name, fields) ->
            val schema = schemas.path(name)
            val required = schema.path("required").values().map { it.asString() }.toSet()
            fields.forEach { field ->
                assertTrue(field in required, "$name.$field must be a required nullable response property")
                val property = schema.path("properties").path(field)
                assertTrue(
                    property.path("type").any { it.asString() == "null" } ||
                        property.path("oneOf").any { it.path("type").asString() == "null" },
                    "$name.$field must allow null"
                )
            }
        }

        val paths = document.path("paths")
        val operationIds = paths.flatMap { path -> path.properties().filter { it.value.has("operationId") }.map { it.value.path("operationId").asString() } }
        assertEquals(operationIds.size, operationIds.toSet().size)
        assertFalse(operationIds.any { it.matches(Regex(".*_[0-9]+")) })

        Files.createDirectories(output.parent)
        Files.writeString(output, OpenApiDocument.normalize(response))
    }
}
