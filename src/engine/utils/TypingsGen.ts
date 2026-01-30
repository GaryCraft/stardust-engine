
import fs from 'fs/promises';
import path from 'path';
import { getAppRootPath, getTempPath } from './Runtime';
import { debug, error } from './Logger';
import { getAppContext } from './Composable';

async function generateStardustTypes(typingsDir: string) {
	const typingsFile = path.join(typingsDir, 'stardust.d.ts');

	const context = getAppContext();


	const moduleEntries = Array.from(context.modman.modules.entries());
	const moduleTypes = moduleEntries
		.map(([name, module]) => `		'${name}': Awaited<ReturnType<typeof import('${module.absolutePath}/index').default["create"]>>;`)
		.join('\n');


	const taskNames = Array.from(context.tasks.jobs.keys());
	const taskUnion = taskNames.map(n => `'${n}'`).join(' | ') || 'string';


	const commandNames = Array.from(context.cli.commands.keys());
	const commandUnion = commandNames.map(n => `'${n}'`).join(' | ') || 'string';


	const hasDiscord = context.modman.modules.has('discord');
	const discordEvents = hasDiscord
		? `
		export type DiscordEventName = keyof import('discord.js').ClientEvents;
		export type DiscordEvent<E extends DiscordEventName = DiscordEventName> = \`modules:discord:\${E}\`;
		`
		: '';



	const content = `
import 'stardust';

declare module "stardust" {
	export namespace Modules {
		export interface ModuleContexts {
${moduleTypes}
		}
		export type ModuleName = keyof ModuleContexts;
	}

	export type TaskName = ${taskUnion};
	export type CommandName = ${commandUnion};


	export const modules: Modules.ModuleContexts;


	${discordEvents}
	

}
`;

	await fs.writeFile(typingsFile, content).catch((e) => {
		error('Failed to write stardust.d.ts', e);
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
	await generateStardustTypes(targetDir);
}

export async function declareTypings() {
	const tempTypingsDir = path.join(getTempPath(), 'typings');
	await resetTypingsDir(tempTypingsDir, 'temporary typings folder');
	await emitTypingsBundle(tempTypingsDir);


	const appTypingsDir = path.join(getAppRootPath(), '..', '.stardust', 'typings');
	await resetTypingsDir(appTypingsDir, 'app typings folder');
	await emitTypingsBundle(appTypingsDir);

	debug('Declared centralized stardust types');
}
