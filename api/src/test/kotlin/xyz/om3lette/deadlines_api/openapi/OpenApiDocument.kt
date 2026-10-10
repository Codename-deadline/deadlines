package xyz.om3lette.deadlines_api.openapi

import tools.jackson.core.util.DefaultIndenter
import tools.jackson.core.util.DefaultPrettyPrinter
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

internal object OpenApiDocument {
    private val mapper = JsonMapper.builder().build()

    fun normalize(json: String): String {
        val document = mapper.readTree(json).asObject()
        require(document.path("openapi").isString) { "Missing OpenAPI version" }
        require(document.path("paths").isObject && !document.path("paths").isEmpty) {
            "OpenAPI document has no paths"
        }
        require(document.path("paths").propertyNames().all { it.startsWith("/api/") }) {
            "OpenAPI document contains paths outside the production /api/ prefix"
        }

        // The contract uses /api/... paths; deployment hosts belong to client configuration.
        document.set("servers", mapper.createArrayNode().add(mapper.createObjectNode().put("url", "/")))

        val indenter = DefaultIndenter("  ", "\n")
        val printer = DefaultPrettyPrinter()
            .withObjectIndenter(indenter)
            .withArrayIndenter(indenter)
        return mapper.writer().with(printer).writeValueAsString(sortKeys(document)) + "\n"
    }

    private fun sortKeys(node: JsonNode): JsonNode = when {
        node.isObject -> mapper.createObjectNode().also { sorted ->
            node.properties().sortedBy { it.key }.forEach { (key, value) ->
                sorted.set(key, sortKeys(value))
            }
        }
        node.isArray -> mapper.createArrayNode().also { sorted ->
            node.forEach { sorted.add(sortKeys(it)) }
        }
        else -> node
    }
}
