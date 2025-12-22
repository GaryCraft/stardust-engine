import type { ApplicationContext } from "@src/engine/types/Engine";
import { HTTPMiddleware, HTTPRouteHandler } from "@src/engine/types/Executors";
import { useImporterRecursive } from "@src/engine/utils/Importing";
import { debug, info, warn } from "@src/engine/utils/Logger";
import { getAppRootPath } from "@src/engine/utils/Runtime";
import { objectSchemaFrom, validateObject } from "parzival";
import fs from "fs";

export default async function (appCtx: ApplicationContext) {
	const validationSchema = objectSchemaFrom(HTTPMiddleware);
	debug("Loading middleware...");
	const middlewareDir = `${getAppRootPath()}/http/middleware`;
	if (!fs.existsSync(middlewareDir)) {
		info(`No app middleware directory found at ${middlewareDir}, skipping.`);
		return;
	}
	await useImporterRecursive(middlewareDir,
		function validator(middlewareFile: any, file, dir): middlewareFile is HTTPMiddleware {
			if (!middlewareFile) {
				warn(`Middleware ${file} from ${dir} has no default export`);
				return false;
			}
			if (!validateObject(middlewareFile, validationSchema)) {
				warn(`Middleware ${file} from ${dir} is invalid`);
				return false;
			}
			return true;
		},
		function loader(middlewareModule, file, dir) {
			const parsedRoute = `${dir.replace(getAppRootPath() + "/http/middleware", "")}/${file.split(".")[0]}`.replace(/\$/g, ":");
			const midd = middlewareModule;
			if (parsedRoute.startsWith("/" + file.replace(/\.[tj]s$/, ""))) {
				debug(`Registering middleware ${file} as global middleware`);
				appCtx.http.server.use(midd.middleware);
			}
			else {
				debug(`Registering middleware ${file} at ${parsedRoute}`);
				appCtx.http.server.use(parsedRoute, midd.middleware);
			}
		});
	info("Finished loading middleware");
}