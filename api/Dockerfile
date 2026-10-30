# The prebuilt gRPC code generator requires glibc.
FROM eclipse-temurin:25-jdk-resolute AS builder

WORKDIR /backend
COPY proto/ proto/

WORKDIR /backend/api
COPY --chmod=700 api/gradlew ./
COPY api/gradle/ gradle/
COPY api/settings.gradle.kts api/build.gradle.kts api/gradle.lockfile ./

COPY api/src/main/ src/main/
RUN --mount=type=cache,id=deadlines-gradle,target=/root/.gradle,sharing=locked \
    ./gradlew bootJar --no-daemon

FROM eclipse-temurin:25-jre-alpine-3.24

WORKDIR /app
COPY --from=builder --chmod=644 /backend/api/build/libs/deadlines_api.jar ./deadlines_api.jar
USER 10001:10001

CMD ["java", "-jar", "/app/deadlines_api.jar"]
