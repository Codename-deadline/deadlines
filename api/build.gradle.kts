plugins {
	kotlin("jvm") version "2.4.20-RC3"
	kotlin("plugin.spring") version "2.4.20-RC3"
    kotlin("plugin.jpa") version "2.4.20-RC3"
	id("org.springframework.boot") version "4.1.1"
	id("io.spring.dependency-management") version "1.1.7"
    id("com.google.protobuf") version "0.10.0"
	id("io.github.ben-manes.versions") version "0.61.0"
}

group = "xyz.om3lette"
version = "0.0.1-SNAPSHOT"

sourceSets {
    main {
        proto {
            srcDir("../proto")
        }
    }
}

// https://github.com/spring-projects/spring-boot/issues/50822
protobuf {
    plugins {
        create("grpc") { }
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

// GHSA-9xv2-5v5q-p794, GHSA-h3x4-894j-xpx5, GHSA-gcx9-497g-6cp6
extra["tomcat.version"] = "11.0.25"

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
        // GHSA-xx22-p4ch-683r
        exclude(module = "lz4-java")
    }
    // Original package is archived. Community maintained fork.
    implementation("at.yawk.lz4:lz4-java:1.11.2")

    implementation("io.hypersistence:hypersistence-utils-hibernate-73:3.15.5")
    implementation("tools.jackson.module:jackson-module-kotlin:3.2.2")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("redis.clients:jedis")
	implementation(platform("software.amazon.awssdk:bom:2.54.11"))
	implementation("software.amazon.awssdk:s3")
	implementation("software.amazon.awssdk:apache-client")
	implementation("org.apache.tika:tika-core:4.0.0")
    implementation("org.apache.tika:tika-parsers-standard-package:4.0.0")

    implementation("io.jsonwebtoken:jjwt-api:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

	implementation("org.postgresql:postgresql:42.7.13")

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
		freeCompilerArgs.addAll(
			"-Xjsr305=strict",
			// Without this, annotations written on a generic type argument (e.g. List<@Valid Foo>)
			// are emitted as plain field annotations instead of JVM type annotations
			"-Xemit-jvm-type-annotations",
		)
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
