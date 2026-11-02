package xyz.om3lette.deadlines_api.configs

import org.apache.tika.detect.DefaultDetector
import org.apache.tika.detect.Detector
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class TikaConfig {
    @Bean
    fun attachmentDetector(): Detector = DefaultDetector()
}
