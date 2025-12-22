import type { ApplicationContext } from "@src/engine/types/Engine";

import cliLoadCommands from "@src/engine/hooks/cli/loadcommands";
import cliStart from "@src/engine/hooks/cli/start";
import cliLoadBuiltin from "@src/engine/hooks/cli/loadbuiltin";
import databaseConnect from "@src/engine/hooks/database/connect";
import httpLoadRoutes from "@src/engine/hooks/http/loadroutes";
import httpLoadMiddleware from "@src/engine/hooks/http/loadmiddleware";
import httpListen from "@src/engine/hooks/http/listen";
import modulesLoad from "@src/engine/hooks/modules/load";
import modulesInit from "@src/engine/hooks/modules/init";
import tasksLoadTasks from "@src/engine/hooks/tasks/loadtasks";
import tasksStart from "@src/engine/hooks/tasks/start";
import wsLoadHandlers from "@src/engine/hooks/ws/loadhandlers";
import engineReady from "@src/engine/hooks/ready";
import engineStop from "@src/engine/hooks/stop";
import appLoad from "@src/engine/hooks/app/load";
import loadUserSpace from "@src/engine/user/Loader";

export function registerEngineHooks(appCtx: ApplicationContext) {
	const bind = (event: string, fn: (...args: any[]) => any) => {
		appCtx.events.on(event, fn.bind(null, appCtx));
	};

	bind("cli:loadbuiltin", cliLoadBuiltin);
	bind("cli:loadcommands", cliLoadCommands);
	bind("cli:start", cliStart);

	bind("database:connect", databaseConnect);

	bind("http:loadroutes", httpLoadRoutes);
	bind("http:loadmiddleware", httpLoadMiddleware);
	bind("http:listen", httpListen);

	bind("ws:loadhandlers", wsLoadHandlers);

	bind("modules:load", modulesLoad);
	bind("modules:init", modulesInit);

	bind("user:load", loadUserSpace);

	bind("tasks:loadtasks", tasksLoadTasks);
	bind("tasks:start", tasksStart);

	bind("app:load", appLoad);

	bind("engine:ready", engineReady);
	bind("engine:stop", engineStop);
}

export default registerEngineHooks;
