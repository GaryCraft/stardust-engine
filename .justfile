depends:
	# Verify bun is installed
	@echo "Verifying bun is installed"
	@npm -g list bun || npm install -g bun

	# Verify node Dependencies
	@echo "Verifying node dependencies"
	@bun install

run:
	#Depends
	just depends

	# Start Engine
	@echo "Starting"
	@bun src/index.ts

dev:
	#Depends
	just depends

	# Start Engine
	@echo "Starting"
	@bun dev
