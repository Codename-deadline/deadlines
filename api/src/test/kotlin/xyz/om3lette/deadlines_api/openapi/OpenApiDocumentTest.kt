package xyz.om3lette.deadlines_api.openapi

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class OpenApiDocumentTest {
    @Test
    fun `object ordering and deployment host do not change the snapshot`() {
        val first = """{
            "openapi": "3.1.0",
            "servers": [{"url": "http://localhost:8080"}],
            "paths": {"/api/example": {"get": {"responses": {"200": {"description": "OK"}}}}},
            "components": {"schemas": {"Example": {"type": "string", "enum": ["z", "a"]}}}
        }"""
        val second = """{
            "components": {"schemas": {"Example": {"enum": ["z", "a"], "type": "string"}}},
            "paths": {"/api/example": {"get": {"responses": {"200": {"description": "OK"}}}}},
            "servers": [{"url": "https://another-host.example"}],
            "openapi": "3.1.0"
        }"""

        val normalized = OpenApiDocument.normalize(first)
        assertEquals(normalized, OpenApiDocument.normalize(second))
        assertEquals(normalized, OpenApiDocument.normalize(normalized))
        assertTrue(normalized.endsWith("\n"))
    }

    @Test
    fun `array ordering and contract changes remain visible`() {
        val document = """{
            "openapi": "3.1.0",
            "paths": {"/api/example": {"get": {"description": "Original"}}},
            "components": {"schemas": {"Example": {"enum": ["z", "a"]}}}
        }"""
        assertNotEquals(
            OpenApiDocument.normalize(document),
            OpenApiDocument.normalize(document.replace("[\"z\", \"a\"]", "[\"a\", \"z\"]")),
        )
        assertNotEquals(
            OpenApiDocument.normalize(document),
            OpenApiDocument.normalize(document.replace("Original", "Changed")),
        )
    }

    @Test
    fun `an empty document cannot replace the contract`() {
        assertThrows<IllegalArgumentException> {
            OpenApiDocument.normalize("""{"openapi": "3.1.0", "paths": {}}""")
        }
    }

    @Test
    fun `test-only paths cannot enter the production contract`() {
        assertThrows<IllegalArgumentException> {
            OpenApiDocument.normalize("""{"openapi": "3.1.0", "paths": {"/validation/body": {}}}""")
        }
    }
}
