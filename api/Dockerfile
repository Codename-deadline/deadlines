FROM gradle:9.7.1-jdk25 AS builder

WORKDIR /backend
COPY proto proto

COPY api api
WORKDIR /backend/api

RUN gradle build -PexcludeTestcontainersTests=true --no-daemon

FROM eclipse-temurin:25-jre-alpine-3.23
COPY --from=builder /backend/api/build/libs/*.jar /app/deadlines_api.jar

CMD ["java", "-jar", "/app/deadlines_api.jar"]
