import Module from "@src/engine/modules";
import { debug } from "@src/engine/utils/Logger";
import { I18nModule } from "./module";


export default {
	name: "i18n",
	paths: {
		hooks: "hooks",
	},
	create: async (config) => {
		return new I18nModule()
	},
	initFunction: async (ctx, config) => {
		await ctx.initialize(config)
		debug(ctx.t("default:i18nModuleInitialized") as string)
	}
} satisfies Module<I18nModule, "i18n">;