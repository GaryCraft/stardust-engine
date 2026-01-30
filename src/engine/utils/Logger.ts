import winston, { format } from "winston";
import chalk from "chalk";
import { getTempPath } from "./Runtime";
import path from "path";
import fs from "fs";

const logTypes = {
	error: "error",
	warn: "warn",
	clear: "clear",
	info: "info",
	debug: "debug",
} as const;
export type LogType = keyof typeof logTypes;
const getLogTypesAsLevels = () => {
	const copy: { [key: string]: unknown } = { ...logTypes };
	let i = 0;
	for (const key in copy) {
		copy[key] = i;
		i++;
	}
	return copy as { [key: string]: number };
};

const getColor = (type: LogType) => {
	switch (type) {
		case "info":
			return chalk.blue;
		case "warn":
			return chalk.yellow;
		case "error":
			return chalk.red;
		case "clear":
			return chalk.white;
		default:
			return chalk.green;
	}
};
function getLoggingPath() {
	return path.join(getTempPath(), "logs");
}
const moduleRegex = /((?:src|node_modules)[\/\\])(.*?)(\.ts|\.js)/g;

export function getCurrentModule(stack: string) {
	try {
		const allMatches = Array.from(stack.matchAll(moduleRegex));
		const match = allMatches[allMatches.length - 1] || allMatches[0];

		if (!match) return "unknown";

		const type = match[1];
		const pathPart = match[2];

		if (type.includes("node_modules")) {
			const parts = pathPart.split("/");
			let libName = parts[0];
			let restPath = parts.slice(1).join("/");

			if (libName.startsWith("@") && parts.length > 1) {
				libName = `${parts[0]}/${parts[1]}`;
				restPath = parts.slice(2).join("/");
			}

			return `${libName}:${restPath}`;
		} else {
			return pathPart.replace(/\.(ts|js)$/i, "");
		}
	} catch {
		return "unknown";
	}
}

function getLogDate() {
	const date = new Date();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${mm}-${dd}`;
}

const stardustformat = format.printf(({ level, message, ...meta }) => {
	const color = getColor(level as LogType);
	const timestamp = new Date().toISOString();
	const metaError = meta.error ? (meta.error as Error) : undefined;
	const callermodule = getCurrentModule(`${meta.stack}` || `${metaError?.stack}` || "");
	return `[${chalk.underline(timestamp)}](${chalk.magenta(callermodule)}) ${level}: ${color(message)}`;
});

try { fs.mkdirSync(getLoggingPath(), { recursive: true }); } catch { }

const logger = winston.createLogger({
	level: "debug",
	levels: getLogTypesAsLevels(),
	format: stardustformat,
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: `${getLoggingPath()}/${getLogDate()}.log`, level: "debug" })
	],
	exceptionHandlers: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: `${getLoggingPath()}/${getLogDate()}-errors.log` })
	],
});

function streamlineArgs(args: unknown[]) {
	const newargs: string[] = [];
	for (const arg of args) {
		if (!arg) continue;
		if (arg instanceof Error) {
			newargs.push(arg.stack || arg.message);
		} else if (arg instanceof String) {
			newargs.push(arg as string);
		} else {
			newargs.push(JSON.stringify(arg));
		}
	}
	return newargs;
}

export default function log(level: LogType, message: string, ...args: any[]) {
	const stack = new Error().stack || "";
	if (level === "clear") {
		const mod = getCurrentModule(stack);
		console.log(chalk.white(`[${mod}] ${message}`));
		return;
	}
	logger.log(
		level,
		args.length > 0 ? `${message}\n${streamlineArgs(args).join(" ")}` : message,
		{
			stack: stack,
		}
	);
}

export function info(message: string, ...args: any[]) {
	log("info", message, ...args);
}
export function warn(message: string, ...args: any[]) {
	log("warn", message, ...args);
}
export function error(message: string, ...args: any[]) {
	log("error", message, ...args);
}
export function debug(message: string, ...args: any[]) {
	log("debug", message, ...args);
}
export function clear(message: string) {
	log("clear", message, "");
}