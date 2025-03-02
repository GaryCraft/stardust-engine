import type { ApplicationContext } from "../types/Engine";
import { info } from "../utils/Logger";

export default async function(appCtx: ApplicationContext) {
	info("Stopping Application");
	await appCtx.events.emitAsync("http:terminate");
	await appCtx.events.emitAsync("database:disconnect");
	info("Application stopped, terminating process");
	process.exit(0);
}