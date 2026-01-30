FROM oven/bun:1-slim
WORKDIR /app


COPY package.json ./
RUN bun install --production


COPY src ./src
COPY .justfile ./
COPY tsconfig.json ./
COPY config ./config
COPY lang ./lang



RUN mkdir -p /app/database /app/logs /app/temp

ENV NODE_ENV=production
ENV PARZIVAL_ENV=production
ENV SD_ENV=production


ENTRYPOINT ["bun", "run", "src/index.ts"]
