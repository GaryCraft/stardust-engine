import { Parseable, ValidateProperty } from "parzival";
@Parseable()
export default class HttpConfig {
	@ValidateProperty({
		type: "number",
	})
	port!: number;
}