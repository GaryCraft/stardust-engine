# Stardust Engine Documentation

## Overview
Stardust Engine is a modular, event-driven application engine designed for extensibility and dynamic runtime behavior. It supports loading modules, language files, database models, configuration, webpage handlers, and more, all orchestrated through a centralized application context and event bus.

---

## Architecture

### Application Context
The engine centers around an `ApplicationContext` object, which holds:
- **Event Bus**: `EventEmitter2` for all engine and module events
- **HTTP Server**: Express-based handler for web APIs and static assets
- **CLI**: Interactive command-line interface
- **Config**: Loaded and validated global configuration
- **Database**: TypeORM data source, auto-configured
- **Task Manager**: Schedules and manages background jobs
- **Module Manager**: Loads, validates, and manages modules

### Boot Process
- Entry point (`src/index.ts`) calls `init()` from `application.ts`
- All engine hooks in `src/engine/hooks` are loaded and executed
- Hooks wire up HTTP routes, middleware, CLI commands, tasks, modules, database, etc.
- Modules are loaded from `modules/`, validated, and their contexts injected
- Each module can register hooks, commands, routes, and tasks
- Engine emits events for each major lifecycle step

### Module System
- Modules are folders in `modules/`, each exporting a `Module` object:
  - `name`: Unique identifier
  - `create(config)`: Async factory for module context (usually an EventEmitter)
  - `initFunction(ctx, config)`: Finalizes module setup
  - `paths`: Optional object specifying locations for hooks, routes, commands, tasks
- Modules can add hooks, CLI commands, HTTP routes, scheduled tasks
- All module contexts inherit from `EventEmitter` for event-driven communication

### Runtime Hierarchy
- Engine loads all modules, language files, configs, database models, and webpage handlers at startup
- Directory structure is currently flat, with modules and engine code side-by-side
- All extensibility is handled via dynamic imports and event wiring

---

## Separation of Concerns for Bun Bundling

### End Goal
Distribute a single engine binary (via Bun) that can be used on other codebases. The engine will load the target codebase as input and handle its modules, configuration, and assets dynamically.

### What Gets Bundled
- **Core Engine Logic**: Application context, event bus, boot sequence, hook loader, module manager, CLI, HTTP server, config loader, database manager, task manager
- **Helper APIs**: Functions for defining hooks, commands, modules, etc. (inspired by Nuxt's type helpers)
- **Minimal Default Assets**: Only what is needed for the engine to start and serve basic endpoints

### What Is Loaded Dynamically
- **User Modules**: External codebases provide their own modules, which are loaded and validated at runtime
- **User Configuration**: Config files are loaded from the target codebase
- **User Assets**: Static files, language packs, database models, etc. are loaded as needed
- **Webpage/Frontend**: The engine can serve or inject user-provided web UIs

### Separation Strategy
- **Engine as Binary**: The engine is compiled into a single Bun binary, containing only core logic and helpers
- **User Codebase as Input**: At runtime, the engine receives a path to the user codebase, loads its modules/config/assets, and wires them up
- **Extensibility**: All extension points (hooks, commands, routes, tasks) are exposed via helper APIs, allowing user codebases to define their own features
- **No Manifest Needed**: Modules are TypeScript files, imported and handled as-is

---

## Next Steps
- Refactor directory structure to cleanly separate engine code from user code
- Implement helper APIs for defining hooks, commands, modules, etc.
- Prepare Bun build scripts for bundling the engine as a binary
- Document the refactor plan and migration steps for existing codebases

---

*Last updated: 2025-10-20*
