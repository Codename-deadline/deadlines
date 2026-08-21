plugins {
	kotlin("jvm") version "2.4.20-RC"
	kotlin("plugin.spring") version "2.4.20-RC"
    kotlin("plugin.jpa") version "2.4.20-RC"
	id("org.springframework.boot") version "4.1.0"
	id("io.spring.dependency-management") version "1.1.7"
    id("com.google.protobuf") version "0.10.0"
	id("io.github.ben-manes.versions") version "0.61.0"
}

group = "xyz.om3lette"
version = "0.0.1-SNAPSHOT"

// Override Spring Boot BOM-managed versions to pick up security fixes.
// GHSA-8c42-7qj2-3j46
extra["netty.version"] = "4.2.17.Final"
extra["jackson-2-bom.version"] = "2.22.2"
extra["jackson-bom.version"] = "3.2.2"
// GHSA-hjcp-jmpx-g3qm
extra["httpclient5.version"] = "5.6.4"
// GHSA-hf6x-8p5f-cgmf, GHSA-v3jc-474w-2wm6
extra["httpcore5.version"] = "5.4.3"
// GHSA-qv9r-c865-cp47
extra["log4j2.version"] = "2.25.5"

sourceSets {
    main {
        proto {
            srcDir("../proto")
        }
    }
}

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.security:spring-security-crypto")
	implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-grpc-server")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.0")

	implementation("org.springframework.boot:spring-boot-flyway")
	implementation("org.flywaydb:flyway-core")
	runtimeOnly("org.flywaydb:flyway-database-postgresql")

    implementation("org.springframework.kafka:spring-kafka") {
        exclude(module = "lz4-java")
    }
    // Original package is archived. Community maintained fork.
    implementation("at.yawk.lz4:lz4-java:1.11.2")

    implementation("io.hypersistence:hypersistence-utils-hibernate-73:3.15.5")
    implementation("tools.jackson.module:jackson-module-kotlin:3.2.2")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("redis.clients:jedis")
	implementation(platform("software.amazon.awssdk:bom:2.54.1"))
	implementation("software.amazon.awssdk:s3")
	implementation("software.amazon.awssdk:apache-client")
	implementation("org.apache.tika:tika-core:3.3.2")
    implementation("org.apache.tika:tika-parsers-standard-package:3.3.2")

    implementation("io.jsonwebtoken:jjwt-api:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

	implementation("org.postgresql:postgresql:42.7.13")

	constraints {
		// Tika tika-parser-html-module / tika-parser-code-module 3.3.2 pull jsoup 1.22.2;
		// GHSA-pmhh-3w7g-xqp8 needs >= 1.23.1.
		implementation("org.jsoup:jsoup:1.23.1")
	}

	testImplementation("org.springframework.boot:spring-boot-starter-test") {
		exclude(module = "mockito-core")
	}
	testImplementation("org.springframework.boot:spring-boot-testcontainers")
	testImplementation("org.testcontainers:testcontainers-postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-grpc-server-test")
    testImplementation("org.springframework.security:spring-security-test")
	testImplementation("io.mockk:mockk:1.14.11")
	testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	compileOnly("jakarta.servlet:jakarta.servlet-api:6.1.0")
}

dependencyLocking {
	lockAllConfigurations()
}

kotlin {
	compilerOptions {
		freeCompilerArgs.addAll("-Xjsr305=strict")
	}
}

allOpen {
	annotation("jakarta.persistence.Entity")
	annotation("jakarta.persistence.MappedSuperclass")
	annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
	useJUnitPlatform {
		if (providers.gradleProperty("excludeTestcontainersTests").getOrElse("false").toBoolean()) {
			excludeTags("testcontainers")
		}
	}
	testLogging {
		events("SKIPPED", "FAILED")
	}
}
