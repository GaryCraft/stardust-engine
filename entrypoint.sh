#!/bin/sh
cd /app
exec bun run src/index.ts "$@"
