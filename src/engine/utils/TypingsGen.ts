import fs from 'fs/promises';
import path from 'path';
import { getTempPath } from './Runtime';
import { debug, error } from './Logger';
import { getAppContext } from './Composable';

async function declareModuleTypings(typingsDir: string) {
	const modulesFile = path.join(typingsDir, 'modules.ts');

	// Declare typings
	const lidLeft = `export default {`
	const lidRight = `} as const;`;

	const moduleImports = getAppContext().modman.modules.entries().map(([name, module]) => {
		return `import ${name} from '${module.absolutePath}';`;
	}).toArray().join('\n');

	const moduleDeclarations = getAppContext().modman.modules.entries().map(([name, module]) => {
		return `'${name}': typeof ${name},`;
	}).toArray().join('\n');

	const moduleFileContent = `${moduleImports}\n\n${lidLeft}\n${moduleDeclarations}\n${lidRight}`;
	await fs.writeFile(modulesFile, moduleFileContent).catch(() => {
		error('Failed to write types modules file');
	});
}
export type ModuleTypes = typeof import('../../../.stardust/typings/modules').default;
export type ModuleName = keyof ModuleTypes;

async function declareEventTypings(typingsDir: string) {
	const eventsFile = path.join(typingsDir, 'events.ts');

	// Declare typings
	const lidLeft = `export default {`
	const lidRight = `} as const;`;
}

/**
 * Generate all typings for the IDE
 */
export async function declareTypings() {
	// Check .stardust folder
	const tempDir = getTempPath();
	const typingsDir = path.join(tempDir, 'typings');
	// Delete always
	const failDeleted = await fs.rm(typingsDir, { recursive: true, force: true }).catch(() => {
		error('Failed to delete typings folder');
		return true;
	});
	// Create typings folder
	if (!failDeleted) await fs.mkdir(typingsDir, { recursive: true }).catch(() => {
		error('Failed to create typings folder');
	});

	await declareModuleTypings(typingsDir);
	debug('Declared typings for IDE');
}
