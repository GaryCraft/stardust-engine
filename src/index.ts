import "reflect-metadata";
import path from "node:path";
import { init } from "./application";
import appCtx from "./application";
import { reloadAllHandlers } from "@src/engine/utils/HotReload";
import { registerNodeModulesDir, setAppRootPath } from "@src/engine/utils/Runtime";

(() => {
	const arg = process.argv.find((a) => a.startsWith("--app="));
	const env = process.env["STARDUST_APP"];
	const appRoot = arg ? arg.slice("--app=".length) : env;
	if (appRoot) setAppRootPath(appRoot);

	const argNodeModules = process.argv
		.filter((a) => a.startsWith("--node-modules="))
		.flatMap((a) => a.slice("--node-modules=".length).split(path.delimiter))
		.filter(Boolean);
	const envNodeModules = process.env["STARDUST_NODE_MODULES"]
		?.split(path.delimiter)
		.filter(Boolean)
		?? [];
	const customNodeModuleDirs = [...argNodeModules, ...envNodeModules];
	const seen = new Set<string>();
	for (const dir of customNodeModuleDirs) {
		const resolved = path.resolve(dir);
		if (seen.has(resolved)) continue;
		seen.add(resolved);
		registerNodeModulesDir(resolved);
	}
})();

init().then(() => {
	try {
		process.on("SIGUSR2", async () => {
			// Soft-reload user-space handlers in proper order without restarting the process
			await reloadAllHandlers(appCtx);
		});
	} catch { }
});