FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

COPY src ./src
COPY .justfile ./
COPY tsconfig.json ./
COPY config ./config
COPY lang ./lang

RUN mkdir -p /app/bin /app/logs /app/temp

ENV NODE_ENV=production
ENV PARZIVAL_ENV=production
ENV SD_ENV=production

ENTRYPOINT ["bun", "run", "src/index.ts"]
