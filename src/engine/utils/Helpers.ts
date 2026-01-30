
import { HTTPRouteHandler, CliCommand, ScheduledTask, HookExecutor } from "@src/engine/types/Executors";

/**
 * proper typing for route definitions
 * @param route 
 * @returns 
 */
export const defineRoute = (route: HTTPRouteHandler) => route;

/**
 * proper typing for command definitions
 * @param command 
 * @returns 
 */
export const defineCommand = (command: CliCommand) => command;

/**
 * proper typing for task definitions
 * @param task 
 * @returns 
 */
export const defineTask = (task: ScheduledTask) => task;

/**
 * proper typing for hook definitions
 * @param hook 
 * @returns 
 */
export const defineHook = <Args extends unknown[]>(hook: HookExecutor<any, Args>) => hook;
