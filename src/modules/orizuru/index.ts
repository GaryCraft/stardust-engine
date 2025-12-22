import Module from "@src/engine/modules";
import { debug, warn } from "@src/engine/utils/Logger";
import { HANDLER_TYPE, HandlerFunction, HandlerType, Orizuru } from "@garycraft/orizuru";
import { getAppContext } from "@src/engine/utils/Composable";
import { useImporterRecursive } from "@src/engine/utils/Importing";
import { getModulePath } from "@src/engine/utils/Runtime";
import type { ApplicationContext } from "@src/engine/types/Engine";
export default {
	name: "orizuru",
	create: async (config) => {
		const o = new Orizuru(getAppContext());
		debug("Loading Orizuru handlers");
		useImporterRecursive(`${getModulePath("orizuru")}/handlers`, function validator(handlerImport: any, file, dir): handlerImport is {
			default: HandlerFunction<ApplicationContext, HandlerType>;
		} {
			if (!handlerImport?.default) {
				return false;
			}
			if (typeof handlerImport.default !== "function") {
				warn(`Handler ${file} from ${dir} does not export a function`);
				return false;
			}
			return true;
		}, function loader(handler, file, dir) {
			const handlerName = file.replace(".ts", "").replace(".js", "") as HandlerType;
			if (Object.values(HANDLER_TYPE).includes(handlerName)) {
				o.addHandler(handlerName, handler.default);
			}
			else {
				warn(`Handler ${handlerName} from ${dir} is not a valid handler type`);
			}
		});
		getAppContext().http.server.post("/orizuru", o.getExpressHandler());
		return o;
	},
	initFunction: async (ctx, config) => {
		debug("Orizuru module initialized");
	}
} satisfies Module<Orizuru, "orizuru">;
