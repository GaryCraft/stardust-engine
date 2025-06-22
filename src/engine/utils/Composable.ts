import type { ApplicationContext } from "../types/Engine";
import type TaskManager from "@src/engine/tasks";
import appCtx from "@src/application";
import { ModuleCfgKey } from "../modules";
import { ModuleTypes } from "./TypingsGen";
import { DataSource } from "typeorm";

/**	
 * Get the Full Application Context
 */
export const getAppContext = (): ApplicationContext => appCtx;

/**
 * Get the database connection
 */
export const getDatabase = (): DataSource => appCtx.database;

type TaskScheduler = TaskManager["scheduler"];
/**
 * Get the task scheduler
 */
export const getScheduler = (): TaskScheduler => appCtx.tasks.scheduler;

/**
 * Get the HTTP Server (Express)
 */
export const getHttpServer = () => appCtx.http.server;
/**
 * Get the HTTP Websockets Server
 */
export const getHttpWSServer = () => appCtx.http.websockets;

/**
 * Get the CLI instance
 */
export const getCLI = () => appCtx.cli;

// Multiple signature function, either typed or untyped depending on receiver
type ModuleIdentifier<M extends ModuleTypes[keyof ModuleTypes]> = `modules:${M}:${string}`;
export function sendEvent<T>(event: ModuleIdentifier<ModuleTypes[keyof ModuleTypes]>, data: T): void;
export function sendEvent<T>(event: string, data: T): void;
export function sendEvent(event: string, data: any): void {
	appCtx.events.emit(event, data);
}

/**
 * Helper function to define an event handler, the event name is given by the type parameter
 */
export function defineEventhandler<S extends string>() {

}