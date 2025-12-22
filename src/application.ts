import { HttpHandler } from "@src/engine/http";
import CLI from "@src/engine/cli";
import EventEmitter2 from "eventemitter2";
import { getConfig, getConfigProperty } from "@src/engine/utils/Configuration";
import type { ApplicationContext } from "./engine/types/Engine";
import { debug, warn } from "@src/engine/utils/Logger";
import { getAppRootPath, getTempPath } from "@src/engine/utils/Runtime";
import { DataSource } from "typeorm";
import type { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import type { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions";
import TaskManager from "./engine/tasks";
import { ModuleManager } from "./engine/modules";
import { registerEngineHooks } from "@src/engine/hooks/register";

async function emitAndAwaitMultiple(emitter: EventEmitter2, events: string[]) {
	for (const event of events) {
		await emitter.emitAsync(event);
	}
}
debug("Creating application context");
const databaseTypeRaw = (getConfigProperty("database.type") || "sqlite") as string;
const databaseType = databaseTypeRaw === "mysql" ? "mysql" : "sqlite";

const sqliteOptions = (): SqliteConnectionOptions => ({
	type: "sqlite",
	database: `${getTempPath()}/database.sqlite`,
	synchronize: (getConfigProperty("database.sync") as boolean | undefined) ?? false,
	logging: (getConfigProperty("database.logging") as boolean | undefined) ?? false,
	entities: [
		`${getAppRootPath()}/database/models/**/*.js`,
		`${getAppRootPath()}/database/models/**/*.ts`,
	],
});

const mysqlOptions = (): MysqlConnectionOptions => ({
	type: "mysql",
	host: (getConfigProperty("database.host") as string | undefined) ?? "localhost",
	port: (getConfigProperty("database.port") as number | undefined) ?? 3306,
	username: (getConfigProperty("database.user") as string | undefined) ?? "root",
	password: (getConfigProperty("database.password") as string | undefined) ?? "",
	database: (getConfigProperty("database.database") as string | undefined) ?? "database",
	synchronize: (getConfigProperty("database.sync") as boolean | undefined) ?? false,
	logging: (getConfigProperty("database.logging") as boolean | undefined) ?? false,
	entities: [
		`${getAppRootPath()}/database/models/**/*.js`,
		`${getAppRootPath()}/database/models/**/*.ts`,
	],
	charset: "utf8mb4",
});

const databaseOptions = databaseType === "mysql" ? mysqlOptions() : sqliteOptions();

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
	database: new DataSource(databaseOptions),
	tasks: new TaskManager(),
	modman: new ModuleManager(),

} satisfies ApplicationContext;
Object.freeze(appCtx);
debug("Application context created");

export const init = async () => {
	debug("Initializing application");
	registerEngineHooks(appCtx);
	appCtx.events.onAny((event) => {
		debug(`Event ${event} emitted`);
	});
	await emitAndAwaitMultiple(appCtx.events, [
		"http:loadroutes",
		"http:loadmiddleware",
		"ws:loadhandlers",
		"cli:loadbuiltin",
		"cli:loadcommands",
		"tasks:loadtasks",
		"modules:load",
		"app:load",
		"database:connect",
		"modules:init",
		"user:load",
		"cli:start",
		"http:bindstatic",
		"http:listen",
		"tasks:start",
	]);
	appCtx.events.emit("engine:ready");
};

export default appCtx;