package xyz.om3lette.deadlines_api.configs.properties

import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Min
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.validation.annotation.Validated

@Validated
@ConfigurationProperties("spring.kafka")
data class KafkaProperties(
    @field:NotBlank
    val bootstrapServers: String = "localhost:9092",

    @field:NotBlank
    val securityProtocol: String = "PLAINTEXT",

    @field:Valid
    val ssl: Ssl = Ssl(),

    @field:Valid
    val producer: Producer = Producer()
) {
    data class Producer(
        @field:Min(1048576)
        val bufferMemory: Long = 8L * 1024 * 1024
    )

    data class Ssl(
        val truststoreLocation: String? = null,
        val truststorePassword: String? = null,
        val keystoreLocation: String? = null,
        val keystorePassword: String? = null,
        val keyPassword: String? = null
    )
}
