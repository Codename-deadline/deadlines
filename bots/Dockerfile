FROM python:3.14-alpine AS builder

# Build context is the repo root
WORKDIR /bot
ARG PLATFORM
COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /uvx /bin/

RUN apk add --no-cache gcc musl-dev zlib-dev

COPY bots/pyproject.toml bots/uv.lock ./
RUN uv sync --locked --no-dev --extra "${PLATFORM}"

# Generate grpc stubs
COPY proto /proto
ENV PROTO_DIR=/proto
COPY bots/common common
RUN uv run --no-sync common/infrastructure/grpc/generate.py

# Copy the rest of the source code
COPY bots/${PLATFORM} ${PLATFORM}
COPY bots/translations translations
COPY bots/run.sh run.sh

RUN chmod +x run.sh

COPY bots/config.template.yaml config.yaml


FROM python:3.14-alpine

WORKDIR /bot
ARG PLATFORM
ENV PLATFORM=${PLATFORM}

COPY --from=builder /bot .

CMD [ "./run.sh" ]
