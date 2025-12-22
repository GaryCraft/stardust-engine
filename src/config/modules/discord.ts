import { Parseable, ValidateProperty } from "parzival";
@Parseable()
export class ActivityConfig {
	@ValidateProperty({
		type: "string",
	})
	name!: string;
	@ValidateProperty({
		type: "string",
		match: /(PLAYING|STREAMING|LISTENING|WATCHING|COMPETING)/,
	})
	type!: "PLAYING" | "STREAMING" | "LISTENING" | "WATCHING" | "COMPETING";
}
@Parseable()
export default class DiscordConfig {
	@ValidateProperty({
		type: "string",
	})
	token!: string;
	@ValidateProperty({
		type: "string",
	})
	prefix!: string;
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "ActivityConfig",
	})
	activity!: ActivityConfig;
	@ValidateProperty({
		type: "array",
		subTypeOptions: {
			type: "string",
		},
	})
	admins!: string[];
	@ValidateProperty({
		type: "string",
	})
	defaultEmbedColor!: string;
}
