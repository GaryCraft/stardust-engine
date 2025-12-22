set shell := ["bash", "-c"]

depends:
	@echo "Verifying bun is installed"
	@bun --version || npm install -g bun
	@echo "Verifying node dependencies"
	@bun install

build-bin:
	@mkdir -p bin
	@bun build src/index.ts --compile --sourcemap --outfile=bin/stardust-engine

stop-all:
	@kill_matches() { \
	  local pattern="$1"; \
	  local label="$2"; \
	  local pids; \
	  pids=$(pgrep -f "$pattern" || true); \
	  if [ -n "$pids" ]; then \
	    local filtered=(); \
	    for pid in $pids; do \
	      if [ "$pid" = "$$" ] || [ "$pid" = "$PPID" ]; then continue; fi; \
	      filtered+=("$pid"); \
	    done; \
	    if [ ${#filtered[@]} -eq 0 ]; then return; fi; \
	    local joined="${filtered[*]}"; \
	    printf "Stopping %s (%s)\n" "${label:-$pattern}" "$joined"; \
	    kill "${filtered[@]}" 2>/dev/null || true; \
	    sleep 0.2; \
	    kill -9 "${filtered[@]}" 2>/dev/null || true; \
	  fi; \
	}; \
	kill_matches "bin/stardust-engine" "compiled engines"; \
	kill_matches "bun --hot src/index.ts" "hot TS engines"; \
	kill_matches "chokidar-cli" "file watchers"

dev-engine-changed:
	@printf "[dev] engine sources changed. rebuilding...\n"
	@pkill -f -x 'bin/stardust-engine' 2>/dev/null || true
	just build-bin

dev-user-changed:
	@printf "[dev] user-space changed. hot reloading...\n"
	@pkill -USR2 -f -x 'bin/stardust-engine' 2>/dev/null || true

docker-dev app="" cfg="" insecure="false":
	just docker-build
	just docker-run
	
docker-run:
	docker run -it --rm \
		--name stardust-engine \
		-p 5001:5001 \
		-v $(pwd)/config:/app/config \
		-v $(pwd)/modules:/app/modules \
		-v $(pwd)/user:/app/user \
		-v $(pwd)/public:/app/public \
		-v $(pwd)/lang:/app/lang \
		-v $(pwd)/.stardust:/app/.stardust \
		-e SD_CONFIG_PATH=/app/config \
		-e SD_ENV=production \
		-e SD_ALLOW_INSECURE_CONFIG=false \
		-e DISCORD_TOKEN \
		stardust-engine:latest

build:
	just depends
	@echo "Building executable..."
	just build-bin

check:
	@echo "Type-checking..."
	@bunx tsc --build tsconfig.json

clean:
	just stop-all
	@rm -rf bin node_modules

docker-build tag="stardust-engine:latest":
	docker build --file dockerfile -t "{{tag}}" .
