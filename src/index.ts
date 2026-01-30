import "reflect-metadata";
import path from "node:path";

import { reloadAllHandlers } from "@src/engine/utils/HotReload";
import { registerNodeModulesDir, setAppRootPath, validateDependencies } from "@src/engine/utils/Runtime";

(() => {
	const arg = process.argv.find((a) => a.startsWith("--app="));
	const env = process.env["STARDUST_APP"];
	const appRoot = arg ? arg.slice("--app=".length) : env;
	if (appRoot) setAppRootPath(appRoot);
	validateDependencies();

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

(async () => {

	const { init, default: appCtx } = await import("./application.ts");

	await init();
	try {
		process.on("SIGUSR2", async () => {

			await reloadAllHandlers(appCtx);
		});

		const stopHandler = async () => {
			appCtx.events.emit("engine:stop");
		};
		process.on("SIGTERM", stopHandler);
		process.on("SIGINT", stopHandler);

		if (process.env["SD_WATCH"] === "true") {
			import("chokidar").then((chokidar) => {
				const { getAppRootPath } = require("@src/engine/utils/Runtime");
				const watchPath = getAppRootPath();
				console.log(`[HotReload] Watching ${watchPath} for changes...`);

				let debounceTimer: NodeJS.Timeout | null = null;

				chokidar.watch(watchPath, {
					ignored: [
						/(^|[\/\\])\../,
						"**/node_modules/**",
						"**/.stardust/**",
						"**/dist/**",
						"**/*.d.ts",
						"**/*.map"
					],
					ignoreInitial: true,
					persistent: true
				}).on("all", (event, path) => {
					if (debounceTimer) clearTimeout(debounceTimer);
					debounceTimer = setTimeout(async () => {
						console.log(`[HotReload] File changed: ${path}`);
						console.log("[HotReload] Reloading handlers...");
						await reloadAllHandlers(appCtx);
						console.log("[HotReload] Reload complete.");
					}, 250);
				});
			});
		}
	} catch { }
})();