import { objectSchemaFrom, validateObject } from "parzival";
import { getProcessPath } from "@src/engine/utils/Runtime";
import DefGlobalConfig from "@src/config";
import { Result } from "@src/engine/utils/ActualUtils";
import { debug, error, warn } from "./Logger";
import { InherentConfig, defaultcfgpath } from "./Env";
import { isSecure } from "./Permissions";
export type GlobalConfig = DefGlobalConfig & InherentConfig;
let cachedConfig: GlobalConfig | null = null;

const getBaseConfigPath = (): string => {
	if (!isSecure(InherentConfig.cfg_path) && !InherentConfig.cfg_path_secure) {
		error("Configuration file is not secure. Defaulting to base configuration path.");
		return defaultcfgpath;
	}
	return InherentConfig.cfg_path;
}

const mergeConfig = (config: DefGlobalConfig): GlobalConfig => {
	const inherentConfig = new InherentConfig();
	const mergedConfig = Object.assign(inherentConfig, config);
	return mergedConfig;
};

function maskString(value: string): string {
	if (value.length <= 4) return "[redacted]";
	const tail = value.slice(-4);
	return "[redacted]" + tail;
}

function redactConfig(obj: any, depth = 0, seen = new WeakSet()): any {
	if (obj === null || typeof obj !== "object") return obj;
	if (seen.has(obj)) return obj;
	seen.add(obj);
	const SENSITIVE_KEYS = new Set([
		"token",
		"secret",
		"password",
		"pass",
		"apiKey",
		"clientSecret",
		"webhook",
		"accessToken",
		"refreshToken",
	]);
	const out: any = Array.isArray(obj) ? [] : {};
	for (const [k, v] of Object.entries(obj)) {
		const keyLower = k.toLowerCase();
		const isSensitive = Array.from(SENSITIVE_KEYS).some(s => keyLower === s.toLowerCase() || keyLower.endsWith(s.toLowerCase()));
		if (isSensitive && typeof v === "string") {
			out[k] = maskString(v);
		} else if (isSensitive && typeof v === "object" && v !== null) {
			// If an object under a sensitive key, redact all string leaves shallowly
			const inner: any = Array.isArray(v) ? [] : {};
			for (const [ik, iv] of Object.entries(v)) {
				inner[ik] = typeof iv === "string" ? maskString(iv) : iv;
			}
			out[k] = inner;
		} else if (typeof v === "object" && v !== null && depth < 5) {
			out[k] = redactConfig(v, depth + 1, seen);
		} else {
			out[k] = v;
		}
	}
	return out;
}

const loadConfig = (): Result<GlobalConfig, Error> => {
	const path = getBaseConfigPath();
	const configObject = require(`${path}`);
	try { debug("Loaded configuration file.", redactConfig(configObject)); } catch { }
	const schema = objectSchemaFrom(DefGlobalConfig);
	const isValid = validateObject(configObject, schema);
	if (!isValid) return new Error("Invalid configuration file.");
	const merged = mergeConfig(configObject);
	cachedConfig = merged;
	return cachedConfig;
};

export const getConfig = (): GlobalConfig => {
	if (!cachedConfig) {
		const result = loadConfig();
		if (result instanceof Error) throw result;
		return result;
	}
	return cachedConfig;
};

export const reloadConfig = (): Result<GlobalConfig, Error> => {
	const result = loadConfig();
	if (result instanceof Error) return result;
	return result;
};

export const getConfigValue = <T extends keyof GlobalConfig>(key: T): GlobalConfig[T] | null => {
	if (!cachedConfig) return null;
	return cachedConfig[key];
};

type DotPathImpl<T> = {
	[K in keyof T & string]: T[K] extends Record<string, any>
	? K | `${K}.${DotPathImpl<T[K]>}`
	: K
}[keyof T & string];

export type DotPath<T> = DotPathImpl<T>;

export type PathValue<T, P extends string> =
	P extends `${infer K}.${infer R}`
	? K extends keyof T
	? PathValue<T[K], R>
	: never
	: P extends keyof T
	? T[P]
	: never;

export function getConfigProperty<P extends DotPath<GlobalConfig>>(cfgPath: P): PathValue<GlobalConfig, P> | null;
export function getConfigProperty(cfgPath: string): unknown | null;
export function getConfigProperty(cfgPath: string) {
	if (!cachedConfig) return null;
	const parts = cfgPath.split(".");
	let current: unknown = cachedConfig;
	for (const key of parts) {
		if (typeof current !== "object" || current === null) {
			warn(`Config property ${key} not found in ${cfgPath}`);
			return null;
		}
		const next = (current as Record<string, unknown>)[key];
		if (next === undefined || next === null) {
			warn(`Config property ${key} not found in ${cfgPath}`);
			return null;
		}
		current = next;
	}
	return current;
}