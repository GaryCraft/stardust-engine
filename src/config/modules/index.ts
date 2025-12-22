import { Parseable, ValidateProperty } from "parzival";
import DiscordConfig from "./discord";
import I18nConfig from "./i18n";
import OrizuruConfig from "./orizuru";
@Parseable()
export default class ModuleConfigs {
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "DiscordConfig",
		optional: true,
	})
	discord!: DiscordConfig;
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "I18nConfig",
		optional: true,
	})
	i18n!: I18nConfig;
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "OrizuruConfig",
		optional: true,
	})
	orizuru!: OrizuruConfig;
}
