import type Module from "@src/engine/modules";
import type { CliCommand, HookExecutor, HTTPRouteHandler, ScheduledTask } from "@src/engine/types/Executors";
import type { EventEmitter } from "events";

export const defineModule = <CTX extends EventEmitter, CFGKey extends string = "none">(mod: Module<CTX, any>): Module<CTX, any> => mod;
export const defineCommand = <T extends CliCommand>(cmd: T): T => cmd;
export const defineHook = <T extends HookExecutor>(hook: T): T => hook;
export const defineRoute = <T extends HTTPRouteHandler>(route: T): T => route;
export const defineTask = <T extends ScheduledTask>(task: T): T => task;
