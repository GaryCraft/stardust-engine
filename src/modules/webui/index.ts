import path from "path";
import EventEmitter from "node:events";
import fs from "fs-extra";
import express from "express";
import axios from "axios";

import Module from "@src/engine/modules";
import { debug, error, info } from "@src/engine/utils/Logger";
import { getProcessPath, getWebPublicDir } from "@src/engine/utils/Runtime";
import { getAppContext } from "@src/engine/utils/Composable";

import { buildWebUI, devWebUI, listenSSR } from "./utilities";


/* WebUI Module
 * This module is responsible for serving the web interface to the user.
 * Builds with vite the application in the web directory to temp/web and serves it.
 */
export const WebBuildFromPath = path.join(getProcessPath(), "web");
const WebBuildToPath = path.join(getWebPublicDir());

export default {
	name: "webui",
	loadFunction: async (config) => {
		return new EventEmitter();
	},
	initFunction: async (ctx, config) => {
		
		const appCtx = getAppContext();
		const HMR_PORT = appCtx.config.http.port + 1;
		const isProduction = appCtx.config.node_env === "production";
		const v = await import("vite");
		let vite;

		// Watch for changes in the web directory and rebuild
		/* fs.watch(path.join(
			WebBuildFromPath,
			"src"
		), { recursive: true }, async (event, filename) => {
			if (filename) {
				const result = await buildWebUI(WebBuildFromPath, WebBuildToPath);
				if (!result) {
					error("Failed to build webui");
					return;
				} else {
					info("WebUI built successfully");
				}
			}
		}); */
		const ssrManifest = await fs.readFile(path.join(WebBuildToPath, '/client/.vite/ssr-manifest.json'), 'utf-8')
		if (isProduction) {
			const result = await buildWebUI(WebBuildFromPath, WebBuildToPath);
			if (!result) {
				error("Failed to build webui");
				return;
			} else {
				info("WebUI built successfully");
			}
			const clientPath = path.join(WebBuildToPath, "client");
			// Expect the web build to be in the public directory
			if (!fs.existsSync(clientPath)) {
				error("Web build not found in public directory");
				return;
			}
			appCtx.http.server.use(express.static("web/dist/client"));

			listenSSR(
				appCtx.http.server,
				(require(`${WebBuildToPath}/server/entry-server.js`)).render,
				(await fs.readFile(path.join(WebBuildToPath, '/client/index.html'), 'utf-8')),
				JSON.parse(ssrManifest)
			);
		} else {
			// Vite dev server (HMR, NOT WORKING)
			// TODO: Fix HMR
			debug("Starting Vite dev server");
			/* vite = await v.createServer({
				configFile: path.join(WebBuildFromPath, "vite.config.ts"),
				root: WebBuildFromPath,
				server: { middlewareMode: true, hmr: { port: HMR_PORT } },
				appType: "custom",
			}).catch((e: any) => {
				error("Error starting vite dev server", e);
			})
			const viteDevMiddleware = vite?.middlewares;
			if (!viteDevMiddleware) {
				error("Vite dev server failed to start");
				return;
			}
			appCtx.http.server.use(viteDevMiddleware); */
			/* 
						if (!vite) {
							error("Vite not initialized")
							return
						}
						listenSSR(
							appCtx.http.server,
							(
								await vite.ssrLoadModule(
									path.join(WebBuildFromPath, '/src/entry-server')
								)
							).render,
							(
								await vite.transformIndexHtml(
									"",
									await fs.readFile(path.join(WebBuildFromPath, '/index.html'), 'utf-8')
								)
							),
							undefined
						); 
			*/
			// Start vite in dev mode
			devWebUI(WebBuildFromPath, HMR_PORT)
			// Forward catch-all to vite, passing along the request and return the response
			appCtx.http.server.use("*", async (req, res) => {
				//debug("Forwarding request to vite dev server", req.originalUrl, req.headers, req.cookies);
				const response = await axios.get(`http://localhost:${HMR_PORT}${req.originalUrl}`,{
					headers: req.headers,
					validateStatus: () => true
				}).catch((e) => {
					error("Failed to forward request to vite dev server", e)
					res.status(500).send("Internal Server Error")
				})
				if (!response) {
					error("Failed to forward request to vite dev server")
					res.status(500).send("Internal Server Error")
					return;
				}
				res.status(response.status).set(response.headers).send(response.data)
			});
			debug("Vite dev server started");
			ctx.emit("ready");
		}
	}
} satisfies Module<EventEmitter, "none">;