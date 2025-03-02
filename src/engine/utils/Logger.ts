import winston, { format } from "winston";
import chalk from "chalk";
import { InherentConfig } from "./Env";

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
	return `temp/logs`;
}
const moduleRegex = /(src|dist)\/(.*)(\.ts|\.js)/g;

export function getCurrentModule(stack: string) {
	const lines = stack.split("\n");
	const filtered = lines.filter((line) => {
		return line.match(moduleRegex);
	});
	const matches = filtered[2]?.match(moduleRegex) || filtered[0]?.match(moduleRegex);
	const cont = matches ? matches[0] : "unknown";
	return cont.slice(0, -3).slice(4);
}
function getLogDate() {
	const date = new Date();
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
const utilitydustformat = format.printf(({ level, message, ...meta }) => {
	const color = getColor(level as LogType);
	const timestamp = new Date().toISOString();
	const metaError = meta.error ? (meta.error as Error) : undefined;
	const callermodule = getCurrentModule(`${meta.stack}` || `${metaError?.stack}` || "");
	return `[${chalk.underline(timestamp)}](${chalk.magenta(callermodule)}) ${level}: ${color(message)}`;
});

const logger = winston.createLogger({
	level: InherentConfig.node_env === "development" ? "debug" : "info",
	levels: getLogTypesAsLevels(),
	format: utilitydustformat,
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
	// This function takes the import context and uses it to determine the calling module
	// This is used to determine the module name for the log
	const stack = new Error().stack || "";
	if(level === "clear") {
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
/* export function clearLog(...text: TemplateStringsArray[]) {
	// TODO: Make this work
	console.log(text.join("\n"));
} */