import { Parseable, ValidateProperty } from "parzival";
@Parseable()
export default class I18nConfig {
	@ValidateProperty({
		type: "string",
	})
	baseLanguage!: string;
}