import { Parseable, ValidateProperty } from "parzival";
import type { Response, Request } from "express";
import type { ApplicationContext } from "./Engine";
import SocketIO from "socket.io";

@Parseable()
export class CliCommand {
	@ValidateProperty({
		type: "string"
	})
	name!: string;
	@ValidateProperty({
		type: "string"
	})
	description!: string;
	@ValidateProperty({
		type: "string"
	})
	usage!: string;
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false
	})
	async execute(app: ApplicationContext, args: string[]): Promise<unknown> {
		throw new Error("Method not implemented.");
	}
}

@Parseable()
export class ScheduledTask {
	@ValidateProperty({
		type: "string"
	})
	name!: string;
	@ValidateProperty({
		type: "string",
		validateName: true
	})
	cronInterval!: string;
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false
	})
	async task(app: ApplicationContext): Promise<void> {
		throw new Error("Method not implemented.");
	}
}


@Parseable()
export class HTTPRouteHandler {
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false,
		optional: true
	})
	get?(req: Request, res: Response): Promise<void> {
		throw new Error("Method not implemented.");
	}
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false,
		optional: true
	})
	post?(req: Request, res: Response): Promise<void> {
		throw new Error("Method not implemented.");
	}
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false,
		optional: true
	})
	put?(req: Request, res: Response): Promise<void> {
		throw new Error("Method not implemented.");
	}
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false,
		optional: true
	})
	delete?(req: Express.Request, res: Response): Promise<void> {
		throw new Error("Method not implemented.");
	}
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false,
		optional: true
	})
	patch?(req: Request, res: Response): Promise<void> {
		throw new Error("Method not implemented.");
	}
}

@Parseable()
export class HTTPMiddleware {
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false
	})
	middleware(req: Request, res: Response, next: () => void): void {
		throw new Error("Method not implemented.");
	}
}

class WSHandlerSettings {
	@ValidateProperty({
		type: "string",
		optional: true
	})
	event?: string;
}
@Parseable()
export class WSHandler {
	@ValidateProperty({
		type: "object",
		recurse: true,
		className: "WSHandlerSettings",
		optional: true
	})
	settings?: WSHandlerSettings;
	// TODO: Select handling strategy
}

export interface HookExecutor {
	(ctx: ApplicationContext): Promise<void>;
}