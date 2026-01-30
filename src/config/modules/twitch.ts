import { Parseable, ValidateProperty } from "parzival";

@Parseable()
export default class TwitchConfig {
	@ValidateProperty({
		type: "string",
		optional: true
	})
	username?: string;
	@ValidateProperty({
		type: "string",
		optional: true
	})
	password?: string;
	@ValidateProperty({
		type: "array",
		subTypeOptions: { type: "string" },
		optional: true
	})
	channels?: string[];
	@ValidateProperty({
		type: "string",
		optional: true
	})
	prefix?: string;
}
