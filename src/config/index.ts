import { Parseable, ValidateProperty } from "parzival";
import HttpConfig from "./http";
import DatabaseConfig from "./database";
import ModuleConfigs from "./modules";
@Parseable()
export default class DefGlobalConfig {
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "HttpConfig"
	})
	http!: HttpConfig;
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "DatabaseConfig"
	})
	database!: DatabaseConfig;
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "ModuleConfigs",
	})
	modules!: ModuleConfigs;
}