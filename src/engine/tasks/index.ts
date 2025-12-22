import { ScheduledTask } from "../types/Executors";
import Schedule, { Job } from "node-schedule";
export default class TaskManager {
	readonly scheduler: typeof Schedule;
	readonly jobs: Map<string, ScheduledTask>;
	readonly runningJobs: Map<string, Job>;
	readonly appJobs: Set<string> = new Set();
	readonly moduleJobs: Map<string, Set<string>> = new Map();
	constructor() {
		this.jobs = new Map();
		this.scheduler = Schedule;
		this.runningJobs = new Map();
	}
}