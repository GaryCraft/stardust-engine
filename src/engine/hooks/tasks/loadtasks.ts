import type { ApplicationContext } from "@src/engine/types/Engine";
import { CliCommand, HTTPRouteHandler, ScheduledTask } from "@src/engine/types/Executors";
import { useImporterRecursive } from "@src/engine/utils/Importing";
import { debug, info, warn } from "@src/engine/utils/Logger";
import { getAppRootPath, getWebPublicDir } from "@src/engine/utils/Runtime";
import express from "express";
import { objectSchemaFrom, validateObject } from "parzival";
import fs from "fs";
import { declareTypings } from "@src/engine/utils/TypingsGen";

export default async function (appCtx: ApplicationContext) {
	const validationSchema = objectSchemaFrom(ScheduledTask);
	debug("Loading Tasks...");
	const tasksDir = `${getAppRootPath()}/tasks`;
	if (!fs.existsSync(tasksDir)) {
		info(`No app tasks directory found at ${tasksDir}, skipping.`);
		return;
	}
	await useImporterRecursive(tasksDir,
		function validator(taskFile: any, file, dir): taskFile is ScheduledTask {
			if (!taskFile) {
				warn(`Task ${file} from ${dir} has no default export`);
				return false;
			}
			if (!validateObject(taskFile, validationSchema)) {
				warn(`Task ${file} from ${dir} is invalid`);
				return false;
			}
			return true;
		},
		function loader(taskMod, file, dir) {
			const task = taskMod;
			appCtx.tasks.jobs.set(task.name, task);
			appCtx.tasks.appJobs.add(task.name);
			debug(`Loaded task ${task.name}`);
		});
	info("Finished loading tasks");
	try { await declareTypings(); } catch {}
}