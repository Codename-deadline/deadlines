package xyz.om3lette.deadlines_api.configs

import org.apache.kafka.clients.CommonClientConfigs
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.config.SslConfigs
import org.apache.kafka.common.serialization.StringSerializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.core.DefaultKafkaProducerFactory
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.core.ProducerFactory
import org.springframework.kafka.support.serializer.JacksonJsonSerializer
import xyz.om3lette.deadlines_api.configs.properties.KafkaProperties
import xyz.om3lette.deadlines_api.data.integration.messengerAccount.event.UserMessengerAccountLinkageEvent
import xyz.om3lette.deadlines_api.data.notifications.event.DeadlineNotificationEvent
import xyz.om3lette.deadlines_api.data.otp.event.OtpEvent


@Configuration
class KafkaProducerConfig(
    kafkaProperties: KafkaProperties
) {

    private val configProps: Map<String, Any> = buildMap {
        put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperties.bootstrapServers)
        put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true)
        put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "gzip")
        put(ProducerConfig.BUFFER_MEMORY_CONFIG, kafkaProperties.producer.bufferMemory)
        put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, kafkaProperties.securityProtocol)

        kafkaProperties.ssl.truststoreLocation?.takeIf(String::isNotBlank)?.let {
            put(SslConfigs.SSL_TRUSTSTORE_LOCATION_CONFIG, it)
            put(SslConfigs.SSL_TRUSTSTORE_TYPE_CONFIG, "PKCS12")
        }
        kafkaProperties.ssl.truststorePassword?.takeIf(String::isNotBlank)?.let {
            put(SslConfigs.SSL_TRUSTSTORE_PASSWORD_CONFIG, it)
        }
        kafkaProperties.ssl.keystoreLocation?.takeIf(String::isNotBlank)?.let {
            put(SslConfigs.SSL_KEYSTORE_LOCATION_CONFIG, it)
            put(SslConfigs.SSL_KEYSTORE_TYPE_CONFIG, "PKCS12")
        }
        kafkaProperties.ssl.keystorePassword?.takeIf(String::isNotBlank)?.let {
            put(SslConfigs.SSL_KEYSTORE_PASSWORD_CONFIG, it)
        }
        kafkaProperties.ssl.keyPassword?.takeIf(String::isNotBlank)?.let {
            put(SslConfigs.SSL_KEY_PASSWORD_CONFIG, it)
        }
    }

    @Bean
    fun eventProducerFactory(): ProducerFactory<String, Any> =
        DefaultKafkaProducerFactory(
            configProps,
            StringSerializer(),
            JacksonJsonSerializer<Any>().apply {
                isAddTypeInfo = false
            }
        )

    // The shared serializer accepts every event type.
    @Suppress("UNCHECKED_CAST")
    private fun <T : Any> eventTemplate(factory: ProducerFactory<String, Any>): KafkaTemplate<String, T> =
        KafkaTemplate(factory as ProducerFactory<String, T>)

    @Bean
    fun notificationKafkaTemplate(eventProducerFactory: ProducerFactory<String, Any>): KafkaTemplate<String, DeadlineNotificationEvent> =
        eventTemplate(eventProducerFactory)

    @Bean
    fun accountLinkageKafkaTemplate(eventProducerFactory: ProducerFactory<String, Any>): KafkaTemplate<String, UserMessengerAccountLinkageEvent> =
        eventTemplate(eventProducerFactory)

    @Bean
    fun otpKafkaTemplate(eventProducerFactory: ProducerFactory<String, Any>): KafkaTemplate<String, OtpEvent> =
        eventTemplate(eventProducerFactory)
}
