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
	constructor() {
		this.server = express();
		this.httpServer = http.createServer(this.server);
		this.websockets = new Server(this.httpServer);

		// this will parse Content-Type: application/json
		this.server.use(express.json());
		// this will parse Content-Type:  application/x-www-form-urlencoded
		this.server.use(express.urlencoded({ extended: true }));
		// this will parse Cookies
		this.server.use(cookieParser.default());


		// Set the X-Powered-By header to SpaceProject
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
}