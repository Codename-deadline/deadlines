package xyz.om3lette.deadlines_api.configs

import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.header.internals.RecordHeaders
import org.junit.jupiter.api.Test
import org.springframework.kafka.core.DefaultKafkaProducerFactory
import org.springframework.kafka.support.serializer.JacksonJsonSerializer
import tools.jackson.databind.json.JsonMapper
import xyz.om3lette.deadlines_api.configs.properties.KafkaProperties
import xyz.om3lette.deadlines_api.data.integration.bot.enums.Language
import xyz.om3lette.deadlines_api.data.integration.messengerAccount.event.UserMessengerAccountLinkageEvent
import xyz.om3lette.deadlines_api.data.notifications.enums.TimeRemaining
import xyz.om3lette.deadlines_api.data.notifications.event.*
import xyz.om3lette.deadlines_api.data.otp.event.OtpEvent
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertSame

class KafkaProducerConfigTest {
    @Test
    fun `all event templates share one factory and honor the buffer budget`() {
        val bufferMemory = 8L * 1024 * 1024
        val config = KafkaProducerConfig(KafkaProperties(producer = KafkaProperties.Producer(bufferMemory)))
        val factory = config.eventProducerFactory() as DefaultKafkaProducerFactory<String, Any>

        assertSame<Any>(factory, config.notificationKafkaTemplate(factory).producerFactory)
        assertSame<Any>(factory, config.accountLinkageKafkaTemplate(factory).producerFactory)
        assertSame<Any>(factory, config.otpKafkaTemplate(factory).producerFactory)
        assertEquals(bufferMemory, factory.configurationProperties[ProducerConfig.BUFFER_MEMORY_CONFIG])
        assertEquals(true, factory.configurationProperties[ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG])
        assertEquals("gzip", factory.configurationProperties[ProducerConfig.COMPRESSION_TYPE_CONFIG])
    }

    @Test
    fun `shared serializer preserves each event payload without type headers`() {
        val factory = KafkaProducerConfig(KafkaProperties()).eventProducerFactory() as DefaultKafkaProducerFactory<String, Any>
        val shared = requireNotNull(factory.valueSerializer)
        val mapper = JsonMapper.builder().findAndAddModules().build()
        val events = listOf(
            OtpEvent("123456", 42, Language.EN),
            UserMessengerAccountLinkageEvent("request", 42),
            DeadlineNotificationEvent(42, "UTC", Language.EN,
                RawDeadline(1, Instant.EPOCH, "Deadline"), TimeRemaining.entries.first(),
                RawOrganization(2, "Organization"), RawThread(3, "Thread"))
        )

        events.forEach { event ->
            val headers = RecordHeaders()
            val expected = JacksonJsonSerializer<Any>().apply { isAddTypeInfo = false }.serialize("events", event)
            val actual = shared.serialize("events", headers, event)
            assertEquals(mapper.readTree(expected), mapper.readTree(actual))
            assertFalse(headers.iterator().hasNext())
        }
    }
}
