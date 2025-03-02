import type { ApplicationContext } from "@src/engine/types/Engine";
import { debug } from "@src/engine/utils/Logger";

export default async function(appCtx: ApplicationContext) {
	debug("Initializing CLI readline");
	await appCtx.cli.init();
}