import Module from "@src/engine/modules";
import { debug, error, info } from "@src/engine/utils/Logger";
import { Client } from "tmi.js";
import { getAppContext } from "@src/engine/utils/Composable";
import EventEmitter from "events";

export default {
	name: "twitch",
	paths: {
		routes: "http",
	},
	dependencies: ["tmi.js"],
	create: async (twitchConfig) => {
		if (!twitchConfig || !twitchConfig.username || !twitchConfig.password) {
			debug("Twitch module disabled or missing credentials");
			return new EventEmitter();
		}

		info("Initializing Twitch Client...");
		const client = new Client({
			options: { debug: false },
			identity: {
				username: twitchConfig.username,
				password: twitchConfig.password,
			},
			channels: twitchConfig.channels || [],
		});

		return client;
	},
	initFunction: async (client, config) => {
		const appCtx = getAppContext();

		if (client instanceof Client) {
			client.on("message", (channel, tags, message, self) => {
				const prefix = config?.prefix || "!";
				let isCommand = false;
				let command = "";
				let args: string[] = [];

				if (message.startsWith(prefix)) {
					isCommand = true;
					const split = message.slice(prefix.length).split(" ");
					command = split[0];
					args = split.slice(1);
				}

				appCtx.events.emit("twitch:message", { channel, tags, message, self, isCommand, command, args });
			});

			client.on("connected", (addr, port) => {
				info(`Twitch Connected to ${addr}:${port}`);
				appCtx.events.emit("twitch:connected", { addr, port });
			});

			client.on("disconnected", (reason) => {
				debug(`Twitch Disconnected: ${reason}`);
				appCtx.events.emit("twitch:disconnected", { reason });
			});

			client.connect().catch((e) => {
				error("Failed to connect to Twitch", e);
			});
		}
	}
} satisfies Module<EventEmitter, "twitch">;