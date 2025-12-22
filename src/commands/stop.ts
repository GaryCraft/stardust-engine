import type { ApplicationContext } from "@src/engine/types/Engine";
import { CliCommand } from "@src/engine/types/Executors";
import { info } from "console";
export default {
	name: "stop",
	description: "Stops the application",
	usage: "stop",
	execute: async (app: ApplicationContext) => {
		await app.events.emitAsync("engine:stop");
	}
} satisfies CliCommand;