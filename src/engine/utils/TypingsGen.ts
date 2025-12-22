import fs from 'fs/promises';
import path from 'path';
import { getAppRootPath, getTempPath } from './Runtime';
import { debug, error } from './Logger';
import { getAppContext } from './Composable';

async function declareModuleTypings(typingsDir: string) {
	const modulesFile = path.join(typingsDir, 'modules.d.ts');
	const moduleEntries = Array.from(getAppContext().modman.modules.entries());
	const typeLines = moduleEntries
		.map(([name, module]) => `  '${name}': Awaited<ReturnType<typeof import('${module.absolutePath}/index').default["create"]>>;`)
		.join('\n');
	const moduleBlock = typeLines ? `${typeLines}\n` : '';
	const moduleFileContent = `declare module "stardust:modules" {\n  export type ModuleContexts = {\n${moduleBlock}  };\n  export type ModuleName = keyof ModuleContexts;\n  const modules: ModuleContexts;\n  export default modules;\n}\n`;
	await fs.writeFile(modulesFile, moduleFileContent).catch(() => {
		error('Failed to write types modules file');
	});
}

async function declareEventTypings(typingsDir: string) {
	const eventsFile = path.join(typingsDir, 'events.d.ts');
	const moduleNames = Array.from(getAppContext().modman.modules.keys());
	const moduleNameUnion = moduleNames.map(n => `'${n}'`).join(' | ') || 'string';
	const discordTyping = `\n  export type DiscordEventName = keyof import('discord.js').ClientEvents;\n  export type DiscordEvent<E extends DiscordEventName = DiscordEventName> = \`modules:discord:\${E}\`;\n  export type EventArgs<E extends EventName> = E extends DiscordEvent<infer D> ? import('discord.js').ClientEvents[D] : any[];\n`;
	const content = `declare module "stardust:events" {\n  export type ModuleName = ${moduleNameUnion};\n  export type EventName = \`modules:\${ModuleName}:\${string}\`;${discordTyping}}\n`;
	await fs.writeFile(eventsFile, content).catch(() => {
		error('Failed to write types events file');
	});
}

async function declareConfigTypings(typingsDir: string) {
	const configFile = path.join(typingsDir, 'config.d.ts');
	const content = `declare module "stardust:config" {\n  export type Config = import("@src/config").default;\n  const config: Config;\n  export default config;\n}\n`;
	await fs.writeFile(configFile, content).catch(() => {
		error('Failed to write types config file');
	});
}

async function declareCommandTypings(typingsDir: string) {
	const commandsFile = path.join(typingsDir, 'commands.d.ts');
	const names = Array.from(getAppContext().cli.commands.keys());
	const union = names.map(n => `'${n}'`).join(' | ') || 'string';
	const content = `declare module "stardust:commands" {\n  export type CommandName = ${union};\n}\n`;
	await fs.writeFile(commandsFile, content).catch(() => {
		error('Failed to write types commands file');
	});
}

async function declareTaskTypings(typingsDir: string) {
	const tasksFile = path.join(typingsDir, 'tasks.d.ts');
	const names = Array.from(getAppContext().tasks.jobs.keys());
	const union = names.map(n => `'${n}'`).join(' | ') || 'string';
	const content = `declare module "stardust:tasks" {\n  export type TaskName = ${union};\n}\n`;
	await fs.writeFile(tasksFile, content).catch(() => {
		error('Failed to write types tasks file');
	});
}


async function declareExecutorTypings(typingsDir: string) {
	const executorsFile = path.join(typingsDir, 'executors.d.ts');
	const content = `declare module "stardust:executors" {\n  import type { Request, Response } from 'express';\n  import type { ApplicationContext } from 'stardust:engine';\n\n  export interface CliCommand {\n    name: string;\n    description: string;\n    usage: string;\n    execute(app: ApplicationContext, args: string[]): unknown | Promise<unknown>;\n  }\n\n  export interface ScheduledTask {\n    name: string;\n    cronInterval: string;\n    task(app: ApplicationContext): unknown | Promise<unknown>;\n  }\n\n  export interface HTTPRouteHandler {\n    get?(req: Request, res: Response): unknown | Promise<unknown>;\n    post?(req: Request, res: Response): unknown | Promise<unknown>;\n    put?(req: Request, res: Response): unknown | Promise<unknown>;\n    delete?(req: Request, res: Response): unknown | Promise<unknown>;\n    patch?(req: Request, res: Response): unknown | Promise<unknown>;\n  }\n\n  export interface HTTPMiddleware {\n    middleware(req: Request, res: Response, next: () => void): unknown;\n  }\n\n  export interface WSHandlerSettings {\n    event?: string;\n  }\n\n  export interface WSHandler {\n    settings?: WSHandlerSettings;\n  }\n\n  export type HookExecutor<Context = ApplicationContext, Args extends unknown[] = unknown[]> = (ctx: Context, ...args: Args) => unknown | Promise<unknown>;\n}\n`;
	await fs.writeFile(executorsFile, content).catch(() => {
		error('Failed to write types executors file');
	});
}

async function declareEngineTypings(typingsDir: string) {
	const engineFile = path.join(typingsDir, 'engine.d.ts');
	const content = `declare module "stardust:engine" {\n  import type EventEmitter2 from 'eventemitter2';\n  import type { Application } from 'express';\n  import type { Server as SocketIOServer } from 'socket.io';\n  import type { DataSource } from 'typeorm';\n  import type { Interface as ReadlineInterface } from 'readline';\n  import type { CliCommand, ScheduledTask } from 'stardust:executors';\n  import type { Config } from 'stardust:config';\n\n  export interface HttpHandler {\n    readonly server: Application;\n    readonly websockets: SocketIOServer;\n    readonly registeredAppRoutes: Set<string>;\n    readonly registeredModuleRoutes: Map<string, Set<string>>;\n    listen(port: number, cb?: () => void): void;\n    removeRoute(path: string): void;\n  }\n\n  export interface CLI {\n    readonly input: NodeJS.ReadableStream;\n    readonly output: NodeJS.WritableStream;\n    readonly interface: ReadlineInterface;\n    readonly commands: Map<string, CliCommand>;\n    readonly loadedFromApp: Set<string>;\n    readonly loadedFromModules: Set<string>;\n    init(): Promise<void>;\n  }\n\n  export interface TaskManager {\n    readonly scheduler: unknown;\n    readonly jobs: Map<string, ScheduledTask>;\n    readonly runningJobs: Map<string, unknown>;\n    readonly appJobs: Set<string>;\n    readonly moduleJobs: Map<string, Set<string>>;\n  }\n\n  export interface ModuleManager {\n    readonly modules: Map<string, {\n      module: unknown;\n      absolutePath: string;\n      ctx: unknown;\n    }>;\n  }\n\n  export type GlobalConfig = Config;\n\n  export interface ApplicationContext {\n    readonly events: EventEmitter2;\n    readonly http: HttpHandler;\n    readonly cli: CLI;\n    readonly config: GlobalConfig;\n    readonly database: DataSource;\n    readonly tasks: TaskManager;\n    readonly modman: ModuleManager;\n  }\n\n  export { HookExecutor } from 'stardust:executors';\n}\n`;
	await fs.writeFile(engineFile, content).catch(() => {
		error('Failed to write types engine file');
	});
}

async function resetTypingsDir(dir: string, label: string) {
	await fs.rm(dir, { recursive: true, force: true }).catch(() => {
		error(`Failed to delete ${label}`);
	});
	await fs.mkdir(dir, { recursive: true }).catch(() => {
		error(`Failed to create ${label}`);
	});
}

async function emitTypingsBundle(targetDir: string) {
	await declareModuleTypings(targetDir);
	await declareEventTypings(targetDir);
	await declareConfigTypings(targetDir);
	await declareCommandTypings(targetDir);
	await declareTaskTypings(targetDir);
	await declareExecutorTypings(targetDir);
	await declareEngineTypings(targetDir);
}

export async function declareTypings() {
	const tempTypingsDir = path.join(getTempPath(), 'typings');
	await resetTypingsDir(tempTypingsDir, 'temporary typings folder');
	await emitTypingsBundle(tempTypingsDir);

	// typings are generated in the project root, not src
	const appTypingsDir = path.join(getAppRootPath(), '..', '.stardust', 'typings');
	await resetTypingsDir(appTypingsDir, 'app typings folder');
	await emitTypingsBundle(appTypingsDir);

	debug('Declared typings for IDE');
}
