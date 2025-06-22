import fs from "fs";
import Module, { getModule, NModuleCfgKey, XModuleConfigs } from "@src/engine/modules";
import type { ApplicationContext } from "@src/engine/types/Engine";
import { debug, info, warn } from "@src/engine/utils/Logger";
import { getProcessPath, getRootPath, isRunningAsCompiled } from "@src/engine/utils/Runtime";
import { objectSchemaFrom, validateObject } from "parzival";
import { getConfigProperty } from "@src/engine/utils/Configuration";
import { useImporterRecursive } from "@src/engine/utils/Importing";
import { CliCommand, HTTPRouteHandler, HookExecutor, ScheduledTask } from "@src/engine/types/Executors";
import { EventEmitter } from "events";
import type { GeneralEventEmitter } from "eventemitter2";
import ModuleConfigs from "@src/config/modules";
import path from "path";
import { declareTypings } from "@src/engine/utils/TypingsGen";

type GeneralEmmiterAdapted<T extends EventEmitter> = T & GeneralEventEmitter;

const adaptEmitter = <T extends EventEmitter>(emitter: T): GeneralEmmiterAdapted<T> => {
	// Bind addEventListener as alias for addListener
	Object.defineProperty(emitter, "addEventListener", {
		get: () => emitter.addListener,
	});
	// Bind removeEventListener as alias for removeListener
	Object.defineProperty(emitter, "removeEventListener", {
		get: () => emitter.removeListener,
	});
	return emitter as GeneralEmmiterAdapted<T>;
}

function interceptEmitter<
	E extends GeneralEmmiterAdapted<EventEmitter>,
	K extends keyof E & string,
	F extends E[K] & ((...args: any[]) => any)
>(
	emitter: E,
	method: K,
	intercept: (...args: Parameters<F>) => void,
	after?: (...args: Parameters<F>) => void
): void {
	debug(`Intercepting method ${method} in ${emitter.constructor.name}`);
	const original = emitter[method] as F;
	emitter[method] = function (this: E, ...args: Parameters<F>): ReturnType<F> {
		intercept.apply(this, args);
		const result = original.apply(this, args);
		if (after) after.apply(this, args);
		return result;
	} as E[K];
}


export default async function (appCtx: ApplicationContext) {
	debug("Loading modules");
	const fsdirs = fs.readdirSync(`${getRootPath()}/modules`);
	// Stat .sd_mod_disabled file
	const disabledExists = fs.existsSync(`${getProcessPath()}/.sd_mod_disabled`);
	if (disabledExists) {
		// Disable modules contained in the file
		const disabledModules = fs.readFileSync(`${getProcessPath()}/.sd_mod_disabled`, "utf-8").split("\n");
		for (const disabledModule of disabledModules) {
			if (fsdirs.includes(disabledModule)) {
				fsdirs.splice(fsdirs.indexOf(disabledModule), 1);
				warn(`Disabled module ${disabledModule}`);
			}
		}
	}
	const moduleSchema = objectSchemaFrom(Module);
	for (const fsdir of fsdirs) {
		if (fs.statSync(`${getRootPath()}/modules/${fsdir}`).isDirectory()) {
			debug(`Loading module ${fsdir}`);
			const module = (await import(`${getRootPath()}/modules/${fsdir}/index${isRunningAsCompiled() ? ".js" : ".ts"}`)).default;
			const def = module;
			if (!validateObject<Module<EventEmitter, keyof ModuleConfigs>>(def, moduleSchema)) {
				debug("Invalid Module", def);
				throw new Error(`Module ${fsdir} is invalid`);
			}
			const config = getConfigProperty(`modules.${fsdir}`) as XModuleConfigs[NModuleCfgKey]
			const moduleLoaded = await def.create(config!); // Not actually NON-null but typescript is dumb
			debug(`Loaded module context for ${fsdir}`);
			appCtx.modman.modules.set(fsdir, {
				module: def,
				absolutePath: path.resolve(`${getRootPath()}/modules/${fsdir}`),
				ctx: moduleLoaded,
			});

			const moduleEmitterAdapted = adaptEmitter(getModule(fsdir as keyof ModuleConfigs)!)

			// Intercept any addition of listeners to the module context and relay them to the main event bus
			interceptEmitter(moduleEmitterAdapted, "on", (event, listener) => {
				appCtx.events.listenTo(moduleEmitterAdapted, {
					[event]: `modules:${fsdir}:${event}`
				})
			});
			// Intercept any removal of listeners to the module context and relay them to the main event bus
			interceptEmitter(moduleEmitterAdapted, "off", (event, listener) => {
				appCtx.events.stopListeningTo(moduleEmitterAdapted, event)
			});

			// Load hooks if present
			if (def.paths?.hooks) {
				debug(`Loading Module Hooks for ${fsdir}`);
				await useImporterRecursive(`${getRootPath()}/modules/${fsdir}/${def.paths?.hooks ?? "hooks"}`,
					function validator(hookModule: any, file, dir): hookModule is HookExecutor {
						if (!hookModule) {
							warn(`Hook ${file} from ${dir} has no default export`);
							return false;
						}
						if (typeof hookModule !== "function") {
							warn(`Hook ${file} from ${dir} is invalid`);
							return false;
						}
						return true;
					},
					function loader(hookModule, file, dir) {
						const hookName = file.slice(0, -3).replaceAll(".", ":");
						const namespacedName = `modules:${fsdir}:${hookName}`;
						debug(`Binding hook ${namespacedName}`);
						appCtx.events.on(
							namespacedName,
							// @ts-ignore
							hookModule.bind(null, moduleLoaded)
						);
						debug(`Propagating hook ${namespacedName}`);
						appCtx.events.listenTo(appCtx.modman.modules.get(fsdir)!.ctx, {
							[hookName]: namespacedName,
						});
					}
				);
			}
			// Load commands if present
			if (def.paths?.commands) {
				debug(`Loading Module Commands for ${fsdir}`);
				const validationSchema = objectSchemaFrom(CliCommand);
				await useImporterRecursive(`${getRootPath()}/modules/${fsdir}/${def.paths?.commands ?? "commands"}`,
					function validator(commandFile: any, file, dir): commandFile is CliCommand {
						if (!commandFile) {
							warn(`Command ${file} from ${dir} has no default export`);
							return false;
						}
						if (!validateObject(commandFile, validationSchema)) {
							warn(`Command ${file} from ${dir} is invalid`);
							return false;
						}
						return true;
					},
					function loader(commandModule, file, dir) {
						const command = commandModule;
						const namespacedName = `${fsdir}-${command.name}`;
						appCtx.cli.commands.set(namespacedName, command);
						debug(`Loaded command ${namespacedName}`);
					}
				);
			}
			// Load http routes if present
			if (def.paths?.routes) {
				debug(`Loading Module Routes for ${fsdir}`);
				const validationSchema = objectSchemaFrom(HTTPRouteHandler);
				await useImporterRecursive(`${getRootPath()}/modules/${fsdir}/${def.paths?.routes ?? "routes"}`,
					function validator(routeFile: any, file, dir): routeFile is HTTPRouteHandler {
						if (!routeFile) {
							warn(`Route ${file} from ${dir} has no default export`);
							return false;
						}
						if (!validateObject(routeFile, validationSchema)) {
							warn(`Route ${file} from ${dir} is invalid`);
							return false;
						}
						return true;
					},
					function loader(routeModule, file, dir) {
						const parsedRoute = `${dir.replace(getRootPath() + `/modules/${fsdir}/${def.paths?.routes ?? "routes"}`, "")}/${file.split(".")[0]}`.replace(/\$/g, ":");
						const namespacedName = `${parsedRoute}`;
						debug(`Registering route ${file} as ${parsedRoute}`);
						const IRoute = appCtx.http.server.route(parsedRoute);
						const route = routeModule;
						if (route.get) IRoute.get(route.get);
						if (route.post) IRoute.post(route.post);
						if (route.put) IRoute.put(route.put);
						if (route.delete) IRoute.delete(route.delete);
						if (route.patch) IRoute.options(route.patch);
					}
				);
			}
			// Load tasks if present
			if (def.paths?.tasks) {
				debug(`Loading Module Tasks for ${fsdir}`);
				const validationSchema = objectSchemaFrom(ScheduledTask);
				await useImporterRecursive(`${getRootPath()}/modules/${fsdir}/${def.paths?.tasks ?? "tasks"}`,
					function validator(taskFile: any, file, dir): taskFile is ScheduledTask {
						if (!taskFile) {
							warn(`Task ${file} from ${dir} has no default export`);
							return false;
						}
						if (!validateObject(taskFile, validationSchema)) {
							warn(`Task ${file} from ${dir} is invalid`);
							return false;
						}
						return true;
					},
					function loader(taskMod, file, dir) {
						const task = taskMod;
						appCtx.tasks.jobs.set(task.name, task);
						debug(`Loaded task ${task.name}`);
					}
				);
			}
		}
	}
	info(`Loaded ${appCtx.modman.modules.size} modules`);
}