import type { ApplicationContext } from "@src/engine/types/Engine";
import { ScheduledTask } from "@src/engine/types/Executors";
import { info } from "@src/engine/utils/Logger";

export default {
	name: "ExampleJob",
	cronInterval: "0 * * * *",
	async task(app) {
		info("ExampleJob ran!");
	},
} satisfies ScheduledTask;