import path from 'path';
import fs from 'fs';
import Module from 'module';

// PackageJSON
export class PackageJSON {
	private singleton: PackageJSON | null = null;
	name?: string;
	version?: string;
	description?: string;
	main?: string;
	author?: string;
	license?: string;
	homepage?: string;
	type?: string;
	repository?: {
		type: string;
		url: string;
	};
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	bugs?: {
		url: string;
	};
	engines?: {
		node: string;
	};
	scripts?: Record<string, string>;
	constructor() {
		if (this.singleton) return this.singleton;
		const packageJSON = require(`${getProcessPath()}/package.json`);
		this.name = packageJSON.name;
		this.version = packageJSON.version;
		this.description = packageJSON.description;
		this.main = packageJSON.main;
		this.author = packageJSON.author;
		this.license = packageJSON.license;
		this.homepage = packageJSON.homepage;
		this.type = packageJSON.type;
		this.repository = packageJSON.repository;
		this.dependencies = packageJSON.dependencies;
		this.devDependencies = packageJSON.devDependencies;
		this.bugs = packageJSON.bugs;
		this.engines = packageJSON.engines;
		this.scripts = packageJSON.scripts;

		this.singleton = this;
		return this.singleton;
	}
}


export const getPackageJSON = () => {
	return new PackageJSON();
};


// Paths

/**
 * Returns the current working directory of the Node.js process
 * @returns {string} The absolute path of the current working directory
 */
export const getProcessPath = () => {
	return process.cwd();
};

/**
 * Holds the application (user space) root path if explicitly set
 */
let APP_ROOT_OVERRIDE: string | null = null;
const REGISTERED_NODE_MODULES = new Set<string>();

const normalizeNodeModulesPath = (dir: string) => path.resolve(dir);

const refreshNodeModuleResolution = () => {
	const moduleCtor = Module as unknown as { _initPaths?: () => void } & typeof Module;
	moduleCtor._initPaths?.();
};

const updateNodePathEnv = () => {
	const segments = new Set<string>();
	const existing = process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter).filter(Boolean) : [];
	for (const segment of existing) segments.add(segment);
	for (const dir of REGISTERED_NODE_MODULES) segments.add(dir);
	process.env.NODE_PATH = Array.from(segments).join(path.delimiter);
};

export const registerNodeModulesDir = (dir: string) => {
	const normalized = normalizeNodeModulesPath(dir);
	if (REGISTERED_NODE_MODULES.has(normalized)) return normalized;
	REGISTERED_NODE_MODULES.add(normalized);
	type ModuleWithPaths = typeof Module & { globalPaths?: string[] };
	const moduleWithPaths = Module as ModuleWithPaths;
	const globalPaths = moduleWithPaths.globalPaths;
	if (globalPaths && !globalPaths.includes(normalized)) {
		globalPaths.push(normalized);
	}
	updateNodePathEnv();
	refreshNodeModuleResolution();
	return normalized;
};

/**
 * Sets the application (user space) root path. If not set, defaults to process.cwd().
 */
export const setAppRootPath = (absPath: string) => {
	APP_ROOT_OVERRIDE = path.resolve(absPath);
	registerNodeModulesDir(path.join(APP_ROOT_OVERRIDE, "node_modules"));
};

/**
 * Returns the application (user space) root path
 */
export const getAppRootPath = () => {
	return APP_ROOT_OVERRIDE ?? getProcessPath();
};

export const getRootPath = () => {
	return getAppRootPath();
};

/**
 * Returns the file extension of the running file
 * @returns {string} The file extension of the current running file
 */
export const getRunningFileExtension = () => {
	const thisFilename = __filename;
	const lastDot = thisFilename.lastIndexOf('.');
	return thisFilename.slice(lastDot + 1);
};


/**
 * Returns the absolute path of the public directory
 * @returns {string} The absolute path of the public directory
 */
export const getWebPublicDir = () => {
	return path.join(getAppRootPath(), '/public');
};

/**
 * Returns the absolute path of the modules directory
 * @returns {string} The absolute path of the modules directory
 */
export const getModulePath = (module: string) => {
	const appPath = path.join(getAppRootPath(), '/modules', module);
	if (fs.existsSync(appPath)) return appPath;
	// Fallback to engine source modules for built-ins during dev/compiled runs
	const engineSrcPath = path.join(getProcessPath(), '/src/modules', module);
	return engineSrcPath;
};

/**
 * Returns the absolute path of the temp directory
 * @returns {string} The absolute path of the temp directory
 */
export const getTempPath = () => {
	return path.join(getAppRootPath(), '/.stardust');
}

// Execution helpers removed (previously deprecated):
// - isWindows
// - hasBash
// - spawnBash

