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
