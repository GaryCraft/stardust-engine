import path from "path";
import DiscordModule from "@src/modules/discord";
import I18nModule from "@src/modules/i18n";
import WebUIModule from "@src/modules/webui";
import TwitchModule from "@src/modules/twitch";

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

function engineModuleBase(name: string) {
	return path.resolve(__dirname, "../../../modules", name);
}

export const BuiltinModules: BuiltinModuleEntry[] = [
	{ name: "discord", def: DiscordModule, absSpecifier: "@src/modules/discord", baseDir: engineModuleBase("discord") },
	{ name: "i18n", def: I18nModule, absSpecifier: "@src/modules/i18n", baseDir: engineModuleBase("i18n") },
	{ name: "webui", def: WebUIModule, absSpecifier: "@src/modules/webui", baseDir: engineModuleBase("webui") },
	{ name: "twitch", def: TwitchModule, absSpecifier: "@src/modules/twitch", baseDir: engineModuleBase("twitch") },
];
