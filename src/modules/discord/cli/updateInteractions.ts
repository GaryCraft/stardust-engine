import { getModule } from "@src/engine/modules";
import { CliCommand } from "@src/engine/types/Executors";
import { error, info } from "@src/engine/utils/Logger";
import ExtendedClient from "@src/modules/discord/extendedclient";
export default {
	name: "update-interactions",
	description: "Updates all interactions",
	usage: "update-interactions <guildId>",
	async execute(ctx, args) {
		const guildId = args[0];
		const discord = getModule<ExtendedClient>("discord");
		if (!discord) {
			error("discord module not found");
			return;
		}
		if (!guildId) {
			info("Updating all interactions");
			ctx.events.emit("modules:discord:updateInteractions");
			for await (const [, guild] of discord.guilds.cache) {
				ctx.events.emit("modules:discord:updateInteractions", { guild });
			}
		}
		else {
			info(`Updating interactions for guild ${guildId}`);
			const guild = discord.guilds.cache.get(guildId);
			if (!guild) {
				error("Guild not found");
				return;
			}
			ctx.events.emit("modules:discord:updateInteractions", { guild });
		}
	}
} satisfies CliCommand;
