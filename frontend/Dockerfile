FROM oven/bun:1.3-alpine AS builder
WORKDIR /deadlines

COPY patches patches
COPY package.json bun.lock ./
RUN bun i --frozen-lock

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src src

RUN bun run build

FROM nginx
COPY --from=builder /deadlines/dist /usr/share/nginx/html
COPY frontend.conf /etc/nginx/conf.d/default.conf
