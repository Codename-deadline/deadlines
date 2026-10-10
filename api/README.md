# Deadlines API

## OpenAPI contract

[`openapi.json`](openapi.json) is the generated, version-controlled HTTP contract.
The source of truth is the application's controllers, DTOs, OpenAPI annotations,
and Springdoc customizers. Change those sources and regenerate the snapshot;
do not edit the JSON by hand.

Run these commands from `api/` with JDK 25 and Docker available:

```sh
# Export a fresh candidate to build/openapi/openapi.json.
./gradlew exportOpenApi

# Regenerate openapi.json after changing the API.
./gradlew updateOpenApi
git diff -- openapi.json

# Verify the snapshot without modifying it.
./gradlew checkOpenApi
```

Commit the reviewed snapshot together with the corresponding backend changes.
Frontend generators such as Orval can read `../api/openapi.json` without starting
the backend.

### How export works

The exporter loads the full application with the `test` profile, the existing
PostgreSQL Testcontainer and mocked S3 clients, then requests `/v3/api-docs` through
MockMvc. It uses the real controller mappings and OpenAPI customizers, including
the `/api` prefix and validation-error schemas. Documentation scanning is limited
to the production controller package so test-only controllers cannot enter the
contract, and export rejects paths outside `/api/`. A separately running API is
not required. Local `.env` imports are disabled for the exporter, and gRPC uses an
ephemeral port.

The snapshot is normalized to make diffs reproducible:

- JSON object keys are sorted recursively; array order and contract values are preserved.
- The top-level deployment server is replaced with the relative URL `/`. Paths
  already contain `/api`; the frontend transport supplies the runtime host.
- JSON uses two-space indentation, LF line endings, UTF-8, and a final newline.

Export always runs afresh rather than restoring a cached candidate. A failed or
empty export cannot update the snapshot. `checkOpenApi` fails if the snapshot is
missing or differs, prints a Git diff for changes, and asks you to regenerate it.

### CI

The Gradle `check` task depends on `checkOpenApi`, so `./gradlew build` verifies the
contract alongside the tests. The backend workflow runs this on pushes and pull
requests affecting `api/`, protobuf sources, or the workflow itself.

The full build requires JDK 25 and Docker and runs both Docker-backed tests and
OpenAPI verification. GitHub-hosted Ubuntu runners provide Docker; Testcontainers
starts PostgreSQL automatically.

### Inspecting documentation on a running API

Enable the docs endpoint when starting the API with its usual infrastructure:

```sh
SPRINGDOC_API_DOCS_ENABLED=true ./gradlew bootRun
```

Then request `http://localhost:8080/v3/api-docs`. The documentation endpoint does
not have the application controllers' `/api` prefix. Use the Gradle tasks above to
produce the normalized committed snapshot.

Snapshot verification detects drift from Springdoc's output; it does not prove
every response conforms to the contract. Review operation IDs, nullability,
request/response schemas, error responses, and multipart/binary endpoints before
using the contract for generated clients.
