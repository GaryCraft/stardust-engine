FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies including native modules
COPY package.json bun.lock ./
# Ensure we have python/build tools for sqlite3 if needed, though bun usually handles it.
# We use --production to skip devDeps, but we might need tsc?
# Stardust uses runtime TS execution via bun, so no tsc build needed for runtime?
# package.json scripts say "deploy" -> "just run".
# "just run" isn't in package.json scripts shown earlier (only deploy -> just run).
# Let's just install all deps.
RUN bun install --production

FROM oven/bun:1-slim AS runner
WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Copy source code
COPY src ./src
COPY .justfile ./
COPY tsconfig.json ./
COPY user ./user
COPY config ./config
COPY lang ./lang

# Create necessary directories
RUN mkdir -p /app/bin /app/logs /app/temp

# Set environment variables
ENV NODE_ENV=production
ENV PARZIVAL_ENV=production
ENV SD_ENV=production

# Entrypoint via bun
ENTRYPOINT ["bun", "run", "src/index.ts"]
