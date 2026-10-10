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
import xyz.om3lette.deadlines_api.config.TestInfraMocks
import xyz.om3lette.deadlines_api.db.TestDatabaseConfig
import java.nio.file.Files
import java.nio.file.Path

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

        Files.createDirectories(output.parent)
        Files.writeString(output, OpenApiDocument.normalize(response))
    }
}
