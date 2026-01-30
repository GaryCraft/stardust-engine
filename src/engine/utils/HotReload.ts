import type { ApplicationContext } from "@src/engine/types/Engine";
import { unloadUserSpace } from "../user/Loader";

type EventBridge = ApplicationContext["events"] & {
	stopListeningTo(target: unknown, event?: string | symbol): void;
	eventNames(): Array<string | symbol>;
	removeAllListeners(event?: string | symbol): void;
	emitAsync(event: string | symbol, ...values: unknown[]): Promise<unknown[]>;
};

const getEventBridge = (appCtx: ApplicationContext): EventBridge => appCtx.events as EventBridge;

export function unloadAppCommands(appCtx: ApplicationContext) {
	for (const name of appCtx.cli.loadedFromApp) {
		appCtx.cli.commands.delete(name);
	}
	appCtx.cli.loadedFromApp.clear();
}

export function unloadModuleCommands(appCtx: ApplicationContext, moduleName?: string) {
	const predicate = (name: string) => name.startsWith(`${moduleName}-`);
	for (const name of appCtx.cli.loadedFromModules) {
		if (!moduleName || predicate(name)) {
			appCtx.cli.commands.delete(name);
			appCtx.cli.loadedFromModules.delete(name);
		}
	}
}

export function unloadAppRoutes(appCtx: ApplicationContext) {
	for (const path of appCtx.http.registeredAppRoutes) {
		appCtx.http.removeRoute(path);
	}
	appCtx.http.registeredAppRoutes.clear();
}

export function unloadModuleRoutes(appCtx: ApplicationContext, moduleName: string) {
	const set = appCtx.http.registeredModuleRoutes.get(moduleName);
	if (!set) return;
	for (const path of set) {
		appCtx.http.removeRoute(path);
	}
	set.clear();
	appCtx.http.registeredModuleRoutes.delete(moduleName);
}

export function unloadAppTasks(appCtx: ApplicationContext) {
	for (const name of appCtx.tasks.appJobs) {
		const job = appCtx.tasks.runningJobs.get(name);
		if (job) job.cancel();
		appCtx.tasks.runningJobs.delete(name);
		appCtx.tasks.jobs.delete(name);
	}
	appCtx.tasks.appJobs.clear();
}

export function unloadModuleTasks(appCtx: ApplicationContext, moduleName: string) {
	const set = appCtx.tasks.moduleJobs.get(moduleName);
	if (!set) return;
	for (const name of set) {
		const job = appCtx.tasks.runningJobs.get(name);
		if (job) job.cancel();
		appCtx.tasks.runningJobs.delete(name);
		appCtx.tasks.jobs.delete(name);
	}
	set.clear();
	appCtx.tasks.moduleJobs.delete(moduleName);
}

export function unloadModuleEvents(appCtx: ApplicationContext, moduleName: string) {
	const mod = appCtx.modman.modules.get(moduleName);
	if (!mod) return;
	const bridge = getEventBridge(appCtx);
	try { bridge.stopListeningTo(mod.ctx); } catch { }
	const names = bridge.eventNames?.() ?? [];
	const prefix = `modules:${moduleName}:`;
	for (const eventName of names) {
		if (typeof eventName === 'string' && eventName.startsWith(prefix)) {
			bridge.removeAllListeners(eventName);
		}
	}
}

export async function unloadAllHandlers(appCtx: ApplicationContext) {
	unloadAppCommands(appCtx);
	for (const cmd of [...appCtx.cli.loadedFromModules]) {
		const dash = cmd.indexOf("-");
		if (dash > 0) unloadModuleCommands(appCtx, cmd.slice(0, dash));
	}
	unloadAppRoutes(appCtx);
	for (const [mod] of appCtx.http.registeredModuleRoutes) unloadModuleRoutes(appCtx, mod);
	unloadAppTasks(appCtx);
	for (const [mod] of appCtx.tasks.moduleJobs) unloadModuleTasks(appCtx, mod);
	for (const [mod] of appCtx.modman.modules) unloadModuleEvents(appCtx, mod[0]);
	await unloadUserSpace(appCtx);
}

export async function reloadAllHandlers(appCtx: ApplicationContext) {
	await unloadAllHandlers(appCtx);
	const seq = [
		"http:loadroutes",
		"http:loadmiddleware",
		"ws:loadhandlers",
		"cli:loadbuiltin",
		"cli:loadcommands",
		"tasks:loadtasks",
		"modules:load",
		"app:load",
		"modules:init",
		"user:load",
		"tasks:start",
	];
	const bridge = getEventBridge(appCtx);
	for (const ev of seq) {
		await bridge.emitAsync(ev);
	}
}
