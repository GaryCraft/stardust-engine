import EventEmitter from "node:events";
import { Parseable, ValidateProperty } from "parzival";
import { GlobalConfig } from "../utils/Configuration";
import { getAppContext } from "../utils/Composable";
import { error } from "../utils/Logger";
import ModuleConfigs from "@src/config/modules";

export type XModuleConfigs = GlobalConfig["modules"] & {
	none: undefined;
};

@Parseable()
class ModulePaths {
	@ValidateProperty({
		type: "string",
		optional: true,
	})
	hooks?: string;

	@ValidateProperty({
		type: "string",
		optional: true,
	})
	commands?: string;

	@ValidateProperty({
		type: "string",
		optional: true,
	})
	tasks?: string;

	@ValidateProperty({
		type: "string",
		optional: true,
	})
	routes?: string;
}

export type NModuleCfgKey = keyof XModuleConfigs
export type ModuleCfgKey = keyof GlobalConfig["modules"]

@Parseable()
export default class Module<CTX extends EventEmitter, CFGKey extends NModuleCfgKey = "none"> {
	@ValidateProperty({
		type: "string",
	})
	name!: string;

	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "ModulePaths",
		optional: true,
	})
	paths?: ModulePaths;

	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false,
	})
	create!: (
		config: CFGKey extends "none" ? undefined : XModuleConfigs[CFGKey]
	) => Promise<CTX>;

	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false,
	})
	initFunction!: (
		ctx: CTX,
		config: CFGKey extends "none" ? undefined : XModuleConfigs[CFGKey]
	) => Promise<void>;
}

export class ModuleManager {
	readonly modules: Map<string, {
		module: Module<any, any>,
		absolutePath: string,
		ctx: any,
	}>;
	constructor() {
		this.modules = new Map();
	}
}

export function getModule<CTX extends EventEmitter>(name: keyof ModuleConfigs): CTX | undefined {
	const modman = getAppContext().modman;
	const mod = modman.modules.get(name);
	if (!mod) {
		error("Module not found", name)
		return undefined;
	}
	return mod.ctx as CTX;
}