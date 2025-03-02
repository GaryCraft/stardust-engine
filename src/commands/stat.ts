import type { ApplicationContext } from "@src/engine/types/Engine";
import { CliCommand } from "@src/engine/types/Executors";
import { clear } from "@src/engine/utils/Logger";

export default {
	name: "stat",
	description: "Displays Values about the application",
	usage: "stat <uptime|memory|commands|routes|modules|hooks|tasks>",
	execute: async (app: ApplicationContext, args: string[]) => {
		const uptime = process.uptime();
		const memoryUsage = process.memoryUsage();

		let sub;
		sub = args[0];
		switch (sub) {
			case "uptime": {
				clear(`Uptime: ${uptime} seconds`);
				break;
			}
			case "memory": {
				clear(`Memory Usage: ${memoryUsage.rss} bytes`);
				break;
			}
			case "commands": {
				const cmdSize = app.cli.commands.size
				const table = [];
				table.push(`${cmdSize} commands loaded`);
				for (const [cmd, command] of app.cli.commands) {
					table.push(`(${cmd}) ${command.usage} - ${command.description}`);
				}
				clear(table.join("\n"));
				break;
			}
			case "routes": {
				let routesSize = 0
				let middlewareSize = 0
				const table = [];
				for (const layer of app.http.server._router.stack) {
					if(!layer.route) continue;
					routesSize++;
					table.push(`${layer.route.path}`);
				}
				for (const layer of app.http.server._router.stack) {
					if(layer.route) continue;
					middlewareSize++;
					table.push(`${layer.name} at ${layer.regexp.toString()}`);
				}
				table.unshift(`${routesSize} routes loaded`);
				table.unshift(`${middlewareSize} middlewares loaded`);
				clear(table.join("\n"));
				break;
			}
			case "modules": {
				const modulesSize = app.modman.modules.size;
				const table = [];
				table.push(`${modulesSize} modules loaded`);
				for (const [name,] of app.modman.modules) {
					table.push(name);
				}
				clear(table.join("\n"));
				break;
			}
			case "hooks": {
				const hooksSize = app.events.eventNames().length;
				const table = [];
				table.push(`${hooksSize} hooks loaded`);
				for (const event of app.events.eventNames()) {
					table.push(event);
				}
				clear(table.join("\n"));
				break;
			}
			case "tasks": {
				const tasksSize = app.tasks.jobs.size;
				const table = [];
				table.push(`${tasksSize} tasks loaded`);
				for (const [name,t] of app.tasks.jobs) {
					table.push(`${name} at ${t.cronInterval}`);
				}
				clear(table.join("\n"));
				break;
			}

			default: {
				const table = [
					`Uptime: ${uptime} seconds`,
					`Memory Usage: ${memoryUsage.rss} bytes`
				];
				const cmdSize = app.cli.commands.size
				const routesSize = app.http.server._router.length;
				const modulesSize = app.modman.modules.size;
				const hooksSize = app.events.eventNames().length;
				const tasksSize = app.tasks.jobs.size;
				table.push(`${cmdSize} commands loaded`);
				table.push(`${routesSize} routes loaded`);
				table.push(`${modulesSize} modules loaded`);
				table.push(`${hooksSize} hooks loaded`);
				table.push(`${tasksSize} tasks loaded`);
				clear(table.join("\n"));
			}
		}
	}
} satisfies CliCommand;