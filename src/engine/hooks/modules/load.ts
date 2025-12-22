import fs from "fs";
import Module, { getModule, NModuleCfgKey, XModuleConfigs } from "@src/engine/modules";
import type { ApplicationContext } from "@src/engine/types/Engine";
import { debug, info, warn } from "@src/engine/utils/Logger";
import { getAppRootPath, getProcessPath, getDisabledModules } from "@src/engine/utils/Runtime";
import { objectSchemaFrom, validateObject } from "parzival";
import { getConfigProperty } from "@src/engine/utils/Configuration";
import { useImporterRecursive } from "@src/engine/utils/Importing";
import { CliCommand, HTTPRouteHandler, HookExecutor, ScheduledTask } from "@src/engine/types/Executors";
import { EventEmitter } from "events";
import type { GeneralEventEmitter } from "eventemitter2";
import ModuleConfigs from "@src/config/modules";
import path from "path";
import { declareTypings } from "@src/engine/utils/TypingsGen";
import { BuiltinModules } from "@src/engine/modules/builtin";

type GeneralEmmiterAdapted<T extends EventEmitter> = T & GeneralEventEmitter;

const adaptEmitter = <T extends EventEmitter>(emitter: T): GeneralEmmiterAdapted<T> => {
	Object.defineProperty(emitter, "addEventListener", {
		get: () => emitter.addListener,
	});
	Object.defineProperty(emitter, "removeEventListener", {
		get: () => emitter.removeListener,
	});
	return emitter as GeneralEmmiterAdapted<T>;
};

const forwardModuleEvents = (appCtx: ApplicationContext, emitter: GeneralEmmiterAdapted<EventEmitter>, moduleName: string) => {
	const originalEmit = emitter.emit.bind(emitter);
	const wrappedEmit: typeof emitter.emit = function (event, ...args) {
		if (typeof event === "string" || typeof event === "symbol") {
			const namespacedEvent = `modules:${moduleName}:${String(event)}`;
			try {
				appCtx.events.emit(namespacedEvent, ...args);
			} catch { }
		}
		return originalEmit(event, ...args);
	};
	Object.defineProperty(emitter, "emit", { value: wrappedEmit });
};


export default async function (appCtx: ApplicationContext) {
	debug("Loading modules");

	// Check for disabled modules
	// Check for disabled modules
	const disabledModules = getDisabledModules();

	// Load engine-provided builtin modules
	for (const entry of BuiltinModules) {
		if (appCtx.modman.modules.has(entry.name)) continue;
		if (disabledModules.has(entry.name)) {
			warn(`Module ${entry.name} is disabled via .sd_mod_disabled`);
			continue;
		}

		try {
			const def = entry.def as Module<any, any>;
			const config = getConfigProperty(`modules.${entry.name}`) as XModuleConfigs[NModuleCfgKey];
			const moduleLoaded = await def.create(config!);
			debug(`Loaded builtin module context for ${entry.name}`);
			appCtx.modman.modules.set(entry.name, {
				module: def,
				absolutePath: entry.absSpecifier,
				ctx: moduleLoaded,
			});

			const moduleEmitterAdapted = adaptEmitter(getModule(entry.name as keyof ModuleConfigs)!);
			forwardModuleEvents(appCtx, moduleEmitterAdapted, entry.name);

			// Try to load builtin module assets from source tree when available (dev/uncompiled)
			try {
				if (def.paths?.hooks) {
					debug(`Loading Builtin Module Hooks for ${entry.name}`);
					if (entry.assets?.hooks && entry.assets.hooks.length) {
						for (const spec of entry.assets.hooks) {
							const hookModule = (await import(spec)).default as HookExecutor | undefined;
							if (!hookModule || typeof hookModule !== "function") continue;
							const file = spec.split("/").pop() || "";
							const hookName = file.slice(0, -3).replaceAll(".", ":");
							const namespacedName = `modules:${entry.name}:${hookName}`;
							debug(`Binding builtin hook ${namespacedName}`);
							const listener: (...args: unknown[]) => Promise<unknown> | unknown = (...args) => hookModule(moduleLoaded, ...args);
							appCtx.events.on(namespacedName, listener);
						}
					} else {
						await useImporterRecursive(path.join(entry.baseDir, def.paths?.hooks ?? "hooks"),
							function validator(hookModule: unknown, file, dir): hookModule is HookExecutor { return !!hookModule && typeof hookModule === "function"; },
							function loader(hookModule, file) {
								const hookName = file.slice(0, -3).replaceAll(".", ":");
								const namespacedName = `modules:${entry.name}:${hookName}`;
								debug(`Binding builtin hook ${namespacedName}`);
								const listener: (...args: unknown[]) => Promise<unknown> | unknown = (...args) => hookModule(moduleLoaded, ...args);
								appCtx.events.on(namespacedName, listener);
							}
						);
					}
				}
				if (def.paths?.commands) {
					debug(`Loading Builtin Module Commands for ${entry.name}`);
					const validationSchema = objectSchemaFrom(CliCommand);
					if (entry.assets?.commands && entry.assets.commands.length) {
						for (const spec of entry.assets.commands) {
							const commandModule = (await import(spec)).default as CliCommand | undefined;
							if (!commandModule || !validateObject(commandModule, validationSchema)) continue;
							const namespacedName = `${entry.name}-${commandModule.name}`;
							appCtx.cli.commands.set(namespacedName, commandModule);
							appCtx.cli.loadedFromModules.add(namespacedName);
							debug(`Loaded builtin command ${namespacedName}`);
						}
					} else {
						await useImporterRecursive(path.join(entry.baseDir, def.paths?.commands ?? "commands"),
							function validator(commandFile: any, file, dir): commandFile is CliCommand { return !!commandFile && validateObject(commandFile, validationSchema); },
							function loader(commandModule, file, dir) {
								const namespacedName = `${entry.name}-${commandModule.name}`;
								appCtx.cli.commands.set(namespacedName, commandModule);
								appCtx.cli.loadedFromModules.add(namespacedName);
								debug(`Loaded builtin command ${namespacedName}`);
							}
						);
					}
				}
				if (def.paths?.routes) {
					debug(`Loading Builtin Module Routes for ${entry.name}`);
					const validationSchema = objectSchemaFrom(HTTPRouteHandler);
					if (entry.assets?.routes && entry.assets.routes.length) {
						for (const spec of entry.assets.routes) {
							const routeModule = (await import(spec)).default as HTTPRouteHandler | undefined;
							if (!routeModule || !validateObject(routeModule, validationSchema)) continue;
							// For static specifiers we can't infer parsedRoute reliably; skip registration path calc
							// Expect specifiers array to mirror route tree if used.
							const file = spec.split("/").pop() || "";
							const base = def.paths?.routes ?? "routes";
							const parsedRoute = `/${file.split(".")[0]}`.replace(/\$/g, ":");
							const IRoute = appCtx.http.server.route(parsedRoute);
							appCtx.http.registeredModuleRoutes.get(entry.name)?.add(parsedRoute) || appCtx.http.registeredModuleRoutes.set(entry.name, new Set([parsedRoute]));
							if (routeModule.get) IRoute.get(routeModule.get);
							if (routeModule.post) IRoute.post(routeModule.post);
							if (routeModule.put) IRoute.put(routeModule.put);
							if (routeModule.delete) IRoute.delete(routeModule.delete);
							if (routeModule.patch) IRoute.options(routeModule.patch);
						}
					} else {
						await useImporterRecursive(path.join(entry.baseDir, def.paths?.routes ?? "routes"),
							function validator(routeFile: any, file, dir): routeFile is HTTPRouteHandler { return !!routeFile && validateObject(routeFile, validationSchema); },
							function loader(routeModule, file, dir) {
								const parsedRoute = `${dir.replace(path.join(entry.baseDir, def.paths?.routes ?? "routes"), "")}/${file.split(".")[0]}`.replace(/\$/g, ":");
								const IRoute = appCtx.http.server.route(parsedRoute);
								appCtx.http.registeredModuleRoutes.get(entry.name)?.add(parsedRoute) || appCtx.http.registeredModuleRoutes.set(entry.name, new Set([parsedRoute]));
								if (routeModule.get) IRoute.get(routeModule.get);
								if (routeModule.post) IRoute.post(routeModule.post);
								if (routeModule.put) IRoute.put(routeModule.put);
								if (routeModule.delete) IRoute.delete(routeModule.delete);
								if (routeModule.patch) IRoute.options(routeModule.patch);
							}
						);
					}
				}
				if (def.paths?.tasks) {
					debug(`Loading Builtin Module Tasks for ${entry.name}`);
					const validationSchema = objectSchemaFrom(ScheduledTask);
					if (entry.assets?.tasks && entry.assets.tasks.length) {
						for (const spec of entry.assets.tasks) {
							const taskMod = (await import(spec)).default as ScheduledTask | undefined;
							if (!taskMod || !validateObject(taskMod, validationSchema)) continue;
							appCtx.tasks.jobs.set(taskMod.name, taskMod);
							const set = appCtx.tasks.moduleJobs.get(entry.name) || new Set<string>();
							set.add(taskMod.name);
							appCtx.tasks.moduleJobs.set(entry.name, set);
							debug(`Loaded builtin task ${taskMod.name}`);
						}
					} else {
						await useImporterRecursive(path.join(entry.baseDir, def.paths?.tasks ?? "tasks"),
							function validator(taskFile: any, file, dir): taskFile is ScheduledTask { return !!taskFile && validateObject(taskFile, validationSchema); },
							function loader(taskMod, file, dir) {
								appCtx.tasks.jobs.set(taskMod.name, taskMod);
								const set = appCtx.tasks.moduleJobs.get(entry.name) || new Set<string>();
								set.add(taskMod.name);
								appCtx.tasks.moduleJobs.set(entry.name, set);
								debug(`Loaded builtin task ${taskMod.name}`);
							}
						);
					}
				}
			} catch { }

		} catch (e) {
			warn(`Failed to load builtin module ${entry.name}`);
			console.error(e);
		}
	}

	info(`Loaded ${appCtx.modman.modules.size} modules`);
	try { await declareTypings(); } catch { }
}