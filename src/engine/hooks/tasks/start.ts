import type { ApplicationContext } from "@src/engine/types/Engine";
import { debug, info } from "@src/engine/utils/Logger";
export default async function (appCtx: ApplicationContext) {
	appCtx.tasks.jobs.forEach((task) => {
		debug(`Scheduling task ${task.name} with cron interval ${task.cronInterval}`);
		const job = appCtx.tasks.scheduler.scheduleJob(task.name, task.cronInterval, task.task.bind(null, appCtx));
		if (job) appCtx.tasks.runningJobs.set(task.name, job);
	});
	info("Finished scheduling tasks");
}