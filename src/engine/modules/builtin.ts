import path from "path";

export type BuiltinModuleAssets = {
	hooks?: string[];
	commands?: string[];
	routes?: string[];
	tasks?: string[];
};

export type BuiltinModuleEntry = {
	name: string;
	def: any;
	absSpecifier: string;
	baseDir: string;
	assets?: BuiltinModuleAssets;
};

export type LazyBuiltinModuleEntry = Omit<BuiltinModuleEntry, "def"> & {
	load: () => Promise<any>;
};

function engineModuleBase(name: string) {
	return path.resolve(__dirname, "../../../modules", name);
}

export const LazyBuiltinModules: LazyBuiltinModuleEntry[] = [
	{ name: "discord", load: () => import("@src/modules/discord").then(m => m.default), absSpecifier: "@src/modules/discord", baseDir: engineModuleBase("discord") },
	{ name: "i18n", load: () => import("@src/modules/i18n").then(m => m.default), absSpecifier: "@src/modules/i18n", baseDir: engineModuleBase("i18n") },
	{ name: "webui", load: () => import("@src/modules/webui").then(m => m.default), absSpecifier: "@src/modules/webui", baseDir: engineModuleBase("webui") },
	{ name: "twitch", load: () => import("@src/modules/twitch").then(m => m.default), absSpecifier: "@src/modules/twitch", baseDir: engineModuleBase("twitch") },
];

/** @deprecated Use LazyBuiltinModules instead */
export const BuiltinModules: BuiltinModuleEntry[] = [];
