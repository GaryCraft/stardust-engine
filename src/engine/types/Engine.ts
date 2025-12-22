import EventEmitter2 from "eventemitter2";
import CLI from "../cli";
import { HttpHandler } from "../http";
import { GlobalConfig } from "../utils/Configuration";
import { DataSource } from "typeorm";
import TaskManager from "../tasks";
import { ModuleManager } from "../modules";
export type ApplicationContext = {
	readonly events: EventEmitter2;
	readonly http: HttpHandler;
	readonly cli: CLI;
	readonly config: GlobalConfig;
	readonly database: DataSource;
	readonly tasks: TaskManager;
	readonly modman: ModuleManager;
};