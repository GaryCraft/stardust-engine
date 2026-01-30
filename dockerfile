FROM oven/bun:1-slim
WORKDIR /app


COPY package.json ./
COPY package.json ./


COPY src ./src
COPY .justfile ./
COPY tsconfig.json ./
COPY config ./config
COPY lang ./lang

RUN mkdir -p /app/database /app/logs /app/temp

ENV NODE_ENV=production
ENV PARZIVAL_ENV=production
ENV SD_ENV=production
ENV SD_TEMP_DIR=/tmp/stardust


COPY .github/entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["/bin/bash", "/app/entrypoint.sh"]