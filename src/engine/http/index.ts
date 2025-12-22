import { Server } from "socket.io";
import Express from "express";
import express from "express";
import * as cookieParser from "cookie-parser";
import { getProcessPath, getWebPublicDir } from "../utils/Runtime";
import { error } from "../utils/Logger";
import http from "node:http";
export class HttpHandler {
	private httpServer: http.Server;
	readonly server: Express.Application;
	readonly websockets: Server;
	readonly registeredAppRoutes: Set<string> = new Set();
	readonly registeredModuleRoutes: Map<string, Set<string>> = new Map();
	constructor() {
		this.server = express();
		this.httpServer = http.createServer(this.server);
		this.websockets = new Server(this.httpServer);
		this.server.use(express.json());
		this.server.use(express.urlencoded({ extended: true }));
		this.server.use(cookieParser.default());
		this.server.use((req, res, next) => {
			res.setHeader("X-Powered-By", "SpaceProject");
			next();
		});
		this.server.get("/api-info", function (req, res) {
			return res.send("This is an stardust-engine based API");
		});
	}
	listen(port: number, cb?: () => void) {
		this.httpServer.listen(port, cb);
	}
	removeRoute(path: string) {
		type Layer = { route?: { path?: string } };
		type ExpressWithRouter = Express.Application & { _router?: { stack?: Layer[] } };
		const appWithRouter = this.server as ExpressWithRouter;
		const stack = appWithRouter._router?.stack;
		if (!Array.isArray(stack)) return;
		appWithRouter._router!.stack = stack.filter((layer) => !(layer.route && layer.route.path === path));
	}
}
