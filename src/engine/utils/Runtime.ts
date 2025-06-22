import path from 'path';
import child_process from 'child_process';

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
 * Returns the root path of the project
 * @returns {string} The absolute path of the root directory
 */
export const getRootPath = () => {
	const processPath = getProcessPath();
	return isRunningAsCompiled() ? path.join(processPath, 'dist') : path.join(processPath, 'src');
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
 * Returns whether the project is running as a compiled JavaScript file
 * @returns {boolean} Whether the project is running as a compiled JavaScript file
 */
export const isRunningAsCompiled = () => {
	return getRunningFileExtension() === 'js';
};

/**
 * Returns the absolute path of the public directory
 * @returns {string} The absolute path of the public directory
 */
export const getWebPublicDir = () => {
	return path.join(getProcessPath(), '/public');
};

/**
 * Returns the absolute path of the modules directory
 * @returns {string} The absolute path of the modules directory
 */
export const getModulePath = (module: string) => {
	return path.join(getRootPath(), '/modules', module);
};

/**
 * Returns the absolute path of the temp directory
 * @returns {string} The absolute path of the temp directory
 */
export const getTempPath = () => {
	return path.join(getProcessPath(), '/.stardust');
}

// Execution 

// All of these functions are used to execute commands in the terminal and are deorecated

/**
 * Returns whether the current system is Windows
 * @returns {boolean} Whether the current system is Windows
 * @deprecated
 */
export const isWindows = () => {
	return process.platform === 'win32';
}

/**
 * Returns whether the current system is Linux
 * @returns {boolean} Whether the current system is Linux
 * @deprecated
 */
export const hasBash = () => {
	return !isWindows();
}

/**
 * Spawns a command in the terminal
 * @param {string} command The command to run
 * @param {string[]} args The arguments to pass to the command
 * @returns {child_process.ChildProcess} The child process of the spawned command
 * @deprecated
 * @throws {Error} If the system does not have Bash
 */
export const spawnBash = (command: string, args: string[]) => {
	if (!hasBash()) {
		throw new Error('Bash is not available on this system.');
	}
	return child_process.spawn(command, args);
}

