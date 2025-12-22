import type { ApplicationContext } from "@src/engine/types/Engine";
import { HTTPRouteHandler } from "@src/engine/types/Executors";
import { useImporterRecursive } from "@src/engine/utils/Importing";
import { debug, info, warn } from "@src/engine/utils/Logger";
import { getAppRootPath } from "@src/engine/utils/Runtime";
import { objectSchemaFrom, validateObject } from "parzival";
import fs from "fs";

export default async function (appCtx: ApplicationContext) {
	const validationSchema = objectSchemaFrom(HTTPRouteHandler);
	debug("Loading routes...");
	const routesDir = `${getAppRootPath()}/http/routes`;
	if (!fs.existsSync(routesDir)) {
		info(`No app routes directory found at ${routesDir}, skipping.`);
		return;
	}
	await useImporterRecursive(routesDir,
		function validator(routeFile: any, file, dir): routeFile is HTTPRouteHandler {
			if (!routeFile) {
				warn(`Route ${file} from ${dir} has no default export`);
				return false;
			}
			if (!validateObject(routeFile, validationSchema)) {
				warn(`Route ${file} from ${dir} is invalid`);
				return false;
			}
			return true;
		},
		function loader(routeModule, file, dir) {
			const parsedRoute = `${dir.replace(getAppRootPath() + "/http/routes", "")}/${file.split(".")[0]}`.replace(/\$/g, ":");
			debug(`Registering route ${file} as ${parsedRoute}`);
			const IRoute = appCtx.http.server.route(parsedRoute);
			appCtx.http.registeredAppRoutes.add(parsedRoute);
			const route = routeModule;
			if (route.get) IRoute.get(route.get);
			if (route.post) IRoute.post(route.post);
			if (route.put) IRoute.put(route.put);
			if (route.delete) IRoute.delete(route.delete);
			if (route.patch) IRoute.options(route.patch);
		});
	info("Finished loading routes");
}