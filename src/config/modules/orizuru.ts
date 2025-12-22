import { Parseable, ValidateProperty } from "parzival";
@Parseable()
export default class OrizuruConfig {
	@ValidateProperty({
		type: "string",
		optional: true
	})
	serverName?: string;
}