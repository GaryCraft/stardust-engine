import type { ApplicationContext } from "@src/engine/types/Engine";
import { CliCommand } from "@src/engine/types/Executors";
import { getDatabase } from "@src/engine/utils/Composable";
import { getConfig } from "@src/engine/utils/Configuration";
import { clear, error, info, debug } from "@src/engine/utils/Logger";

export default {
	name: "enginetest",
	description: "Tests some parts of the application",
	usage: "enginetest [database|http|cli|tasks|engine] <args>",
	execute: async (app: ApplicationContext, args: string[]) => {
		if (getConfig().node_env !== "development") {
			error("This command can only be used in development mode, please enable only in a development environment");
			return;
		}
		switch (args[0]) {
			case "cli":
				app.cli.commands.forEach(async (command) => {
					debug("Command: ", command);
				});
				break;
			case "engine": {
				debug("Trying to register an arbitrary event");
				app.events.once("arbitrary", () => {
					debug("Arbitrary event fired");
				});
				const res = app.events.emit("arbitrary");
				if (!res) {
					error("Arbitrary event failed");
				}
				try {
					(app as any).http = "arbitrary";
				}
				catch (err) {
					error("Arbitrary assignment failed successfully: ", err);
				}
				break;
			}
			case "database": {
				const db = getDatabase();
				const allRepos = db.entityMetadatas.map((x) => x.name);
				debug("All repositories: ", allRepos);
				// Make the database do something
				const res = await db.query("SELECT 1+1 AS result").catch((err) => {
					error("Error: ", err);
				});
				debug("Result of query: ", res);
				break;
			}
			default:
				clear("No test specified");
				break;
		}
		info("Test completed");
	}

} satisfies CliCommand;