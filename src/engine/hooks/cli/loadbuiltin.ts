import type { ApplicationContext } from "@src/engine/types/Engine";
import { debug } from "@src/engine/utils/Logger";
import help from "@src/commands/help";
import stat from "@src/commands/stat";
import stop from "@src/commands/stop";
import evalCmd from "@src/commands/eval";
import test from "@src/commands/test";
import reload from "@src/commands/reload";

export default async function (appCtx: ApplicationContext) {
	debug("Loading built-in CLI commands...");
	const pairs = [
		[help.name, help],
		[stat.name, stat],
		[stop.name, stop],
		[evalCmd.name, evalCmd],
		[test.name, test],
		[reload.name, reload],
	] as const;
	for (const [name, cmd] of pairs) {
		appCtx.cli.commands.set(name, cmd);
	}
	debug("Built-in CLI commands registered");
}
