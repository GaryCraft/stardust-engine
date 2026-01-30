import Module from "@src/engine/modules";
import { getConfigValue } from "@src/engine/utils/Configuration";
import { GatewayIntentBits } from "discord.js";
import ExtendedClient from "./extendedclient";
const nonPrivilegedIntents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildModeration,
	GatewayIntentBits.GuildEmojisAndStickers,
	GatewayIntentBits.GuildIntegrations,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.GuildInvites,
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.GuildMessageTyping,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.DirectMessageReactions,
	GatewayIntentBits.DirectMessageTyping,
	GatewayIntentBits.GuildScheduledEvents
];
const privilegedIntents = [
	GatewayIntentBits.MessageContent
];
export default {
	name: "discord",
	paths: {
		hooks: "hooks",
		commands: "cli",
	},
	dependencies: ["discord.js"],
	create: async (config) => {
		let intents: GatewayIntentBits[] = [];
		if (getConfigValue("node_env") === "development") {
			intents = nonPrivilegedIntents.concat(privilegedIntents);
		}
		else {
			intents = nonPrivilegedIntents;
		}
		return new ExtendedClient({
			intents,
		});
	},
	initFunction: async (ctx) => {
		ctx.login();
	}
} satisfies Module<ExtendedClient, "discord">;
