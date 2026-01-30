import type { ApplicationContext } from "@src/engine/types/Engine";
import { getConfigProperty } from "@src/engine/utils/Configuration";
import { debug, error, info } from "@src/engine/utils/Logger";
export default async function (appCtx: ApplicationContext) {
	debug("Calling Initializer functions for modules");
	appCtx.modman.modules.forEach(async (m) => {
		debug(`Initializing module ${m.module.name}`);
		const moduleConfig = getConfigProperty(`modules.${m.module.name}`);
		if (!moduleConfig) {
			error(`Module ${m.module.name} has no configuration on initialization`);
		}
		await m.module.initFunction(m.ctx, moduleConfig);
	});
	info(`Initialized ${appCtx.modman.modules.size} modules`);
}