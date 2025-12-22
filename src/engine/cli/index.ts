import readline from "readline";
import { CliCommand } from "@src/engine/types/Executors";
import { getAppContext } from "../utils/Composable";
import { error, info } from "../utils/Logger";
export default class CLI {
	readonly input: NodeJS.ReadableStream;
	readonly output: NodeJS.WritableStream;
	readonly interface: readline.Interface;
	readonly commands = new Map<string, CliCommand>();
	readonly loadedFromApp = new Set<string>();
	readonly loadedFromModules = new Set<string>();
	constructor(output: NodeJS.WritableStream, input: NodeJS.ReadableStream) {
		this.input = input;
		this.output = output;
		this.interface = readline.createInterface({
			input: this.input,
			output: this.output,
			prompt: ""
		});
	}
	async init() {
		this.interface.on("line", (line) => {
			const args = line.trim().split(/ +/g);
			const command = args.shift();
			if (!command) {
				info("No command specified");
				return;
			}
			const c = this.commands.get(command);
			if (!c) {
				info("Command not found");
				return;
			}
			c.execute(getAppContext(), args).catch((err) => {
				error("Error executing command: ", err);
			});
		});
	}
}
