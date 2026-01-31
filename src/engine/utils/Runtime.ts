import path from 'path';
import fs from 'fs';
import Module from 'module';
import { warn, error, info, debug } from './Logger';


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
	peerDependencies?: Record<string, string>;
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

		let packageJSON;
		try {
			packageJSON = require(path.join(getProcessPath(), 'package.json'));
		} catch (e) {
			warn("Could not load engine package.json");
			packageJSON = {};
		}
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
		this.peerDependencies = packageJSON.peerDependencies;
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




/**
 * Returns the current working directory of the process
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
	const resolved = path.resolve(absPath);
	if (!fs.existsSync(resolved)) {
		warn(`App root path does not exist: ${resolved}`);
	}
	APP_ROOT_OVERRIDE = resolved;

	const appNodeModules = path.join(APP_ROOT_OVERRIDE, "node_modules");
	if (fs.existsSync(appNodeModules)) {
		registerNodeModulesDir(appNodeModules);
	}
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
 * Validates that the current environment's node_modules satisfies the engine's requirements.
 * Exits the process if dependencies are missing.
 */
export const validateDependencies = () => {
	const enginePkg = getPackageJSON();
	if (!enginePkg.dependencies) return;

	debug("Validating dependencies against host environment...");
	const missing: string[] = [];


	const depsToCheck = {
		...enginePkg.dependencies,
		...enginePkg.peerDependencies
	};


	for (const dep of Object.keys(depsToCheck)) {
		try {
			require.resolve(dep);
		} catch (e) {
			missing.push(dep);
		}
	}

	if (missing.length > 0) {
		error("CRITICAL: Missing dependencies in host environment!");
		error("The following packages are required by the engine but not found:");
		missing.forEach(m => console.error(` - ${m}`));
		console.error("\nPlease install them in your application's package.json");
		process.exit(1);
	}
	info("Dependency validation passed.");
};


/**
 * Checks if a specific dependency is available in the environment.
 * Does NOT throw or exit.
 */
export const checkDependency = (pkgName: string): boolean => {
	try {
		require.resolve(pkgName);
		return true;
	} catch (e) {
		return false;
	}
};


/**
 * Returns the absolute path of the public directory
 * @returns {string} The absolute path of the public directory
 */
export const getWebPublicDir = () => {
	return path.join(getAppRootPath(), '/public');
};

/**
 * Returns the absolute path of the modules directory.

 */
export const getModulePath = (module: string) => {

	const appModulePath = path.join(getAppRootPath(), 'modules', module);
	if (fs.existsSync(appModulePath)) return appModulePath;





	const engineModulePath = path.resolve(__dirname, '../../modules', module);
	if (fs.existsSync(engineModulePath)) return engineModulePath;


};

/**
 * Returns the absolute path of the temp directory
 * @returns {string} The absolute path of the temp directory
 */
export const getTempPath = () => {
	return path.join(getAppRootPath(), '/.stardust');
}

/**
 * Returns a Set of disabled module names from the .sd_mod_disabled file
 * @returns {Set<string>} Set of disabled module names
 */
export const getDisabledModules = (): Set<string> => {
	const disabledPath = path.join(getAppRootPath(), ".sd_mod_disabled");
	const disabledModules = new Set<string>();
	if (fs.existsSync(disabledPath)) {
		const content = fs.readFileSync(disabledPath, "utf-8");
		content.split("\n").map(s => s.trim()).filter(Boolean).forEach(m => disabledModules.add(m));
	}
	return disabledModules;
};
