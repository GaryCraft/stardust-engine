import type { ApplicationContext } from "@src/engine/types/Engine";
import { CliCommand } from "@src/engine/types/Executors";
import { useImporterRecursive } from "@src/engine/utils/Importing";
import { debug, info, warn } from "@src/engine/utils/Logger";
import { getRootPath } from "@src/engine/utils/Runtime";
import { objectSchemaFrom, validateObject } from "parzival";

export default async function (appCtx: ApplicationContext) {
	const validationSchema = objectSchemaFrom(CliCommand);
	debug("Loading commands...");
	await useImporterRecursive(`${getRootPath()}/commands`,
		function validator(commandFile: any, file, dir): commandFile is CliCommand {
			if (!commandFile) {
				warn(`Command ${file} from ${dir} has no default export`);
				return false;
			}
			if (!validateObject(commandFile, validationSchema)) {
				warn(`Command ${file} from ${dir} is invalid`);
				return false;
			}
			return true;
		},
		function loader(commandModule, file, dir) {
			const command = commandModule;
			appCtx.cli.commands.set(command.name, command);
			debug(`Loaded command ${command.name}`);
		});
	info("Finished loading commands");
}