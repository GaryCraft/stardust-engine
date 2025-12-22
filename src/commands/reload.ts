import type { ApplicationContext } from "@src/engine/types/Engine";
import { CliCommand } from "@src/engine/types/Executors";
import { info } from "@src/engine/utils/Logger";
import { reloadAllHandlers } from "@src/engine/utils/HotReload";

export default {
	name: "reload",
	description: "Reload handlers (commands, routes, tasks, modules) in correct order",
	usage: "reload",
	execute: async (app: ApplicationContext) => {
		info("Reloading all handlers...");
		await reloadAllHandlers(app);
		info("Reload complete.");
	}
} satisfies CliCommand;
