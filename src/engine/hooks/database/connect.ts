import type { ApplicationContext } from "@src/engine/types/Engine";
import { debug } from "@src/engine/utils/Logger";
export default async function (appCtx: ApplicationContext) {
	debug("Initializing Database connection");
	await appCtx.database.initialize();
}