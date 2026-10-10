plugins {
	kotlin("jvm") version "2.4.21"
	kotlin("plugin.spring") version "2.4.21"
    kotlin("plugin.jpa") version "2.4.21"
	id("org.springframework.boot") version "4.1.1"
	id("io.spring.dependency-management") version "1.1.7"
    id("com.google.protobuf") version "0.10.0"
	id("io.github.ben-manes.versions") version "0.65.0"
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
extra["tomcat.version"] = "11.0.26"

extra["jackson-2-bom.version"] = "2.21.7"
extra["jackson-bom.version"] = "3.1.7"

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.security:spring-security-crypto")
	implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-grpc-server")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1")

	implementation("org.springframework.boot:spring-boot-flyway")
	implementation("org.flywaydb:flyway-core")
	runtimeOnly("org.flywaydb:flyway-database-postgresql")

    implementation("org.springframework.kafka:spring-kafka") {
        // GHSA-xx22-p4ch-683r
        exclude(module = "lz4-java")
    }
    // Original package is archived. Community maintained fork.
    implementation("at.yawk.lz4:lz4-java:1.12.0")

    implementation("io.hypersistence:hypersistence-utils-hibernate-73:3.16.0")
    implementation("tools.jackson.module:jackson-module-kotlin:3.2.3")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("redis.clients:jedis")
	implementation(platform("software.amazon.awssdk:bom:2.55.13"))
	implementation("software.amazon.awssdk:s3")
	implementation("software.amazon.awssdk:apache5-client")
	implementation("org.apache.tika:tika-core:4.1.0")
    implementation("org.apache.tika:tika-parsers-standard-package:4.1.0")

    implementation("io.jsonwebtoken:jjwt-api:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

	implementation("org.postgresql:postgresql:42.7.14")

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
	useJUnitPlatform()
	testLogging {
		events("SKIPPED", "FAILED")
	}
}

tasks.named<Test>("test") {
    useJUnitPlatform { excludeTags("openapi-export") }
}

val openApiSnapshot = layout.projectDirectory.file("openapi.json")
val openApiCandidate = layout.buildDirectory.file("openapi/openapi.json")
val testSourceSet = sourceSets["test"]

val exportOpenApi = tasks.register<Test>("exportOpenApi") {
    group = "documentation"
    description = "Exports the current OpenAPI contract using the application test context (requires Docker)."
    testClassesDirs = testSourceSet.output.classesDirs
    classpath = testSourceSet.runtimeClasspath
    useJUnitPlatform { includeTags("openapi-export") }
    systemProperty("openapi.output", openApiCandidate.get().asFile.absolutePath)
    outputs.file(openApiCandidate)

    // Always inspect the current context; never accept a stale or cached export.
    outputs.upToDateWhen { false }
    outputs.cacheIf { false }
    doFirst { openApiCandidate.get().asFile.delete() }
    doLast {
        check(openApiCandidate.get().asFile.isFile) {
            "OpenAPI export did not produce ${openApiCandidate.get().asFile}."
        }
    }
}

tasks.register("updateOpenApi") {
    group = "documentation"
    description = "Regenerates the committed openapi.json contract (requires Docker)."
    dependsOn(exportOpenApi)
    doLast {
        openApiCandidate.get().asFile.copyTo(openApiSnapshot.asFile, overwrite = true)
        logger.lifecycle("Updated openapi.json. Review the contract diff before committing.")
    }
}

val checkOpenApi = tasks.register("checkOpenApi") {
    group = "verification"
    description = "Verifies that the committed openapi.json matches the API (requires Docker)."
    dependsOn(exportOpenApi)
    doLast {
        val snapshot = openApiSnapshot.asFile
        val candidate = openApiCandidate.get().asFile
        if (!snapshot.isFile) {
            throw GradleException("openapi.json is missing. Run ./gradlew updateOpenApi and commit it.")
        }
        if (!snapshot.readBytes().contentEquals(candidate.readBytes())) {
            val diff = providers.exec {
                commandLine("git", "diff", "--no-index", "--", snapshot.absolutePath, candidate.absolutePath)
                isIgnoreExitValue = true
            }
            logger.error(diff.standardOutput.asText.get())
            throw GradleException("openapi.json is out of date. Run ./gradlew updateOpenApi and review the diff.")
        }
    }
}

tasks.named("check") {
    dependsOn(checkOpenApi)
}
