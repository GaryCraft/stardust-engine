import fs from "fs";
import Module, { ModuleCfgKey, XModuleConfigs } from "@src/engine/modules";
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

type GeneralEmmiterAdapted<T extends EventEmitter> = T & GeneralEventEmitter;

const adaptEmitter = <T extends EventEmitter>(emitter: T): GeneralEmmiterAdapted<T> => {
	// Bind addEventListener as alias for addListener
	Object.defineProperty(emitter, "addEventListener", {
		value: emitter.addListener,
	});
	// Bind removeEventListener as alias for removeListener
	Object.defineProperty(emitter, "removeEventListener", {
		value: emitter.removeListener,
	});
	return emitter as GeneralEmmiterAdapted<T>;
}


export default async function (appCtx: ApplicationContext) {
	debug("Loading modules");
	const fsdirs = fs.readdirSync(`${getRootPath()}/modules`);
	// Stat .ud_mod_disabled file
	const disabled = fs.statSync(`${getProcessPath()}/.ud_mod_disabled`);
	if (disabled.isFile()) {
		// Disable modules contained in the file
		const disabledModules = fs.readFileSync(`${getProcessPath()}/.ud_mod_disabled`, "utf-8").split("\n");
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
			const config = getConfigProperty(`modules.${fsdir}`) as XModuleConfigs[ModuleCfgKey]
			const moduleLoaded = await def.loadFunction(config!); // Not actually NON-null but typescript is dumb
			debug(`Loaded module context for ${fsdir}`);
			appCtx.modman.modules.set(fsdir, {
				module: def,
				ctx: moduleLoaded,
			});

			// Relay all events from the module to the main event bus
			appCtx.events.listenTo(adaptEmitter(moduleLoaded), {
				"*": `modules:${fsdir}:*`,
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