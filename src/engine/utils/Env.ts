// Static equivalent of process.env
/* 
*/
import { getProcessPath } from "./Runtime";

export const validcfgpathrgx = /^(\/[^\/]+)+$/;
export const defaultcfgpath = `${getProcessPath()}/config`;

export class InherentConfig {
	private singleton: InherentConfig | null = null;
	node_env = process.env.SD_ENV || "production";
	cfg_path = process.env.SD_CONFIG_PATH || defaultcfgpath;
	allow_insecure_config = process.env.SD_ALLOW_INSECURE_CONFIG === "true" || false;
	constructor() {
		if (this.singleton) return this.singleton;
		this.singleton = this;
		return this.singleton;
	}
	static get node_env() {
		return new InherentConfig().node_env;
	}
	static get cfg_path() {
		const path = new InherentConfig().cfg_path;
		if (validcfgpathrgx.test(path)) return path;
		return defaultcfgpath;
	}
	static get cfg_path_secure() {
		return new InherentConfig().allow_insecure_config;
	}
}