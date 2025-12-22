import type { ApplicationContext } from "@src/engine/types/Engine";
import { getConfigProperty, getConfigValue } from "@src/engine/utils/Configuration";
import { debug, error, info } from "@src/engine/utils/Logger";
import type { Request, Response } from "express";
export default async function (appCtx: ApplicationContext) {
	debug("Initializing HTTP server");
	appCtx.http.listen(getConfigProperty("http.port") ?? 3000, () => {
		info(`HTTP server listening on port ${getConfigProperty("http.port") ?? 3000}`);
	});
}