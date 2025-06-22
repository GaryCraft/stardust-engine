import { HttpHandler } from "@src/engine/http";
import CLI from "@src/engine/cli";
import EventEmitter2 from "eventemitter2";
import { getConfig, getConfigProperty } from "@src/engine/utils/Configuration";
import type { ApplicationContext } from "./engine/types/Engine";
import { debug, warn } from "@src/engine/utils/Logger";
import { getRootPath, getTempPath } from "@src/engine/utils/Runtime";
import { HookExecutor } from "./engine/types/Executors";
import { useImporterRecursive } from "./engine/utils/Importing";
import { DataSource } from "typeorm";
import DatabaseConfig from "./config/database";
import TaskManager from "./engine/tasks";
import { ModuleManager } from "./engine/modules";

async function emitAndAwaitMultiple(emitter: EventEmitter2, events: string[]) {
	for (const event of events) {
		await emitter.emitAsync(event);
	}
}
debug("Creating application context");
const appCtx = {
	events: new EventEmitter2({
		wildcard: true,
		delimiter: ":",
		newListener: false,
		removeListener: false,
		verboseMemoryLeak: false,
		ignoreErrors: false,
		maxListeners: 25,
	}),
	http: new HttpHandler(),
	cli: new CLI(process.stdout, process.stdin),
	config: getConfig(),
	database: new DataSource({
		type: getConfigProperty<DatabaseConfig["type"]>("database.type") || "sqlite",

		database: getConfigProperty<DatabaseConfig["type"]>("database.type") == "sqlite" ? `${getTempPath()}/database.sqlite` : (getConfigProperty<DatabaseConfig["database"]>("database.database") || "database"),
		port: getConfigProperty<DatabaseConfig["port"]>("database.port") || 3306,
		username: getConfigProperty<DatabaseConfig["user"]>("database.user") || "root",
		password: getConfigProperty<DatabaseConfig["password"]>("database.password") || "",

		synchronize: getConfigProperty<DatabaseConfig["sync"]>("database.sync") || false,
		logging: getConfigProperty<DatabaseConfig["logging"]>("database.logging") || false,
		entities: [
			`${getRootPath()}/database/models/**/*.js`,
			`${getRootPath()}/database/models/**/*.ts`,
		],

		charset: getConfigProperty<DatabaseConfig["type"]>("database.type") == "mysql" ? "utf8mb4" : undefined,
	}),
	tasks: new TaskManager(),
	modman: new ModuleManager(),

} satisfies ApplicationContext;
Object.freeze(appCtx);
debug("Application context created");

export const init = async () => {
	debug("Initializing application");
	await useImporterRecursive(`${getRootPath()}/engine/hooks`,
		function validator(hookModule: any, file, dir): hookModule is HookExecutor  {
			if (!hookModule) {
				warn(`Hook ${file} from ${dir} has no default export`);
				debug(hookModule);
				return false;
			}
			if (typeof hookModule !== "function") {
				warn(`Hook ${file} from ${dir} is invalid`);
				return false;
			}
			return true;
		},
		function loader(hookModule, file, dir) {
			const namespace = dir.split("/").slice(-1)[0];
			const namespaceName = namespace == "hooks" ? "engine" : namespace;
			const hookName = file.toLowerCase().slice(0, -3).replaceAll(".", ":");
			debug(`Binding hook ${hookName} from ${namespaceName}`);
			appCtx.events.on(
				`${namespaceName}:${hookName}`,
				hookModule.bind(null, appCtx)
			);
		});
	appCtx.events.onAny((event) => {
		debug(`Event ${event} emitted`);
	});
	await emitAndAwaitMultiple(appCtx.events, [
		"http:loadroutes",
		"http:loadmiddleware",
		"ws:loadhandlers",
		"cli:loadcommands",
		"tasks:loadtasks",
		"modules:load",
		"database:connect",
		"modules:init",
		"cli:start",
		"http:bindstatic",
		"http:listen",
		"tasks:start",
	]);
	appCtx.events.emit("engine:ready");
};

export default appCtx;