import type { ApplicationContext } from "@src/engine/types/Engine";
import { debug, info, warn } from "@src/engine/utils/Logger";
import { getAppRootPath } from "@src/engine/utils/Runtime";
import fs from "fs";
import path from "path";

export default async function (appCtx: ApplicationContext) {
	const candidates = [
		path.join(getAppRootPath(), "user/app.ts"),
		path.join(getAppRootPath(), "user/app.js"),
		path.join(getAppRootPath(), "app.ts"),
		path.join(getAppRootPath(), "app.js"),
		path.join(getAppRootPath(), "app/index.ts"),
		path.join(getAppRootPath(), "app/index.js"),
	];

	let found: string | null = null;
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			found = candidate;
			break;
		}
	}

	if (!found) {
		info("No user app wiring found (looked for user/app.ts or app.ts). Skipping.");
		return;
	}

	debug(`Loading user app wiring from ${found}`);
	try {
		const mod = await import(pathToFileURL(found).href);
		const fn = mod.default ?? mod;
		if (typeof fn !== "function") {
			warn(`User app module at ${found} does not export a function. Skipping.`);
			return;
		}
		await Promise.resolve(fn(appCtx));
		info("User app wiring loaded.");
	} catch (e) {
		warn(`Failed to load user app wiring from ${found}: ${(e as Error).message}`);
	}
}

function pathToFileURL(p: string) {
	const { pathToFileURL } = require("url") as typeof import("url");
	return pathToFileURL(p);
}
