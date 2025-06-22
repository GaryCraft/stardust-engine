import type { ApplicationContext } from "@src/engine/types/Engine";
import { CliCommand } from "@src/engine/types/Executors";
import { getConfig } from "@src/engine/utils/Configuration";
import { error, debug, warn } from "@src/engine/utils/Logger";

export default {
	name: "eval",
	description: "Evaluate some code in the context of the application",
	usage: "eval <code>",
	execute: async (app: ApplicationContext, args: string[]) => {
		if (getConfig().node_env !== "development") {
			warn("This command should only be used in development mode, please enable only in a development environment");
			return;
		}
		const code = args.join(" ");
		debug("Evaling: ", code);
		try {
			const context ={
				app
			};
			// Eval the code passing in the context
			const res = eval(code);
			debug("Result: ", res);
		}
		catch (err) {
			error("Error: ", err);
		}
	}

} satisfies CliCommand;