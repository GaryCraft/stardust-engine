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

dev-compiled app="" cfg="" insecure="false":
	just stop-all
	just build
	@stopping=0; \
	 cleaned=0; \
	 engine_watcher_pid=""; \
	 user_watcher_pid=""; \
	 start_watchers() { \
	   echo "Watching engine sources for rebuild/restart..."; \
	   bunx chokidar-cli "src/**/*.ts" \
	     -i "src/engine/utils/TypingsGen.ts.d.ts" \
	     --throttle 300 \
	     --debounce 100 \
	     -c "just dev-engine-changed" & \
	   engine_watcher_pid=$!; \
	   echo "Watching user space for hot reload..."; \
	   bunx chokidar-cli "user/**/*.{ts,js,json}" "modules/**/*.{ts,js}" "config/**/*.{ts,js,json}" \
	     --throttle 200 \
	     --debounce 75 \
	     -c "just dev-user-changed" & \
	   user_watcher_pid=$!; \
	 }; \
	 cleanup() { \
	   if [ "$cleaned" -eq 1 ]; then return; fi; \
	   cleaned=1; \
	   if [ -n "$engine_watcher_pid" ]; then kill "$engine_watcher_pid" 2>/dev/null || true; fi; \
	   if [ -n "$user_watcher_pid" ]; then kill "$user_watcher_pid" 2>/dev/null || true; fi; \
	   pkill -f -x 'bin/stardust-engine' 2>/dev/null || true; \
	 }; \
	 start_watchers; \
	 trap 'stopping=1; cleanup; exit 0' INT TERM; \
	 trap 'cleanup' EXIT; \
	 echo "Starting compiled binary in foreground (CLI attached)"; \
	 run_engine() { \
	   if [ -n "{{app}}" ]; then \
	     PARZIVAL_ENV="development" SD_ENV="development" STARDUST_APP="{{app}}" SD_CONFIG_PATH="{{cfg}}" SD_ALLOW_INSECURE_CONFIG="{{insecure}}" bin/stardust-engine; \
	   else \
	     PARZIVAL_ENV="development" SD_ENV="development" SD_CONFIG_PATH="{{cfg}}" SD_ALLOW_INSECURE_CONFIG="{{insecure}}" bin/stardust-engine; \
	   fi; \
	 }; \
	 while [ "$stopping" -eq 0 ]; do \
	   status=0; \
	   run_engine || status=$?; \
	   if [ "$stopping" -ne 0 ]; then break; fi; \
	   if [ "$status" -ne 0 ] && [ "$status" -ne 130 ] && [ "$status" -ne 137 ] && [ "$status" -ne 143 ]; then \
	     printf "[dev] engine exited with status %s; stopping.\n" "$status"; \
	     exit "$status"; \
	   fi; \
	   printf "[dev] engine exited. waiting briefly before restart...\n"; \
	   sleep 0.25; \
	 done

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
