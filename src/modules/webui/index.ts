import path from "path";
import EventEmitter from "node:events";
import fs from "fs-extra";
import express from "express";
import axios from "axios";
import Module from "@src/engine/modules";
import { debug, error, info } from "@src/engine/utils/Logger";
import { getAppRootPath, getProcessPath, getWebPublicDir } from "@src/engine/utils/Runtime";
import { getAppContext } from "@src/engine/utils/Composable";
import { buildWebUI, devWebUI, listenSSR } from "./utilities";
const WebSourceFallbackPath = path.join(getProcessPath(), "web");
const WebUserSourcePath = path.join(getAppRootPath(), "web");
export const WebBuildFromPath = fs.existsSync(WebUserSourcePath) ? WebUserSourcePath : WebSourceFallbackPath;
const WebBuildToPath = path.join(getWebPublicDir());
export default {
	name: "webui",
	create: async (config) => {
		return new EventEmitter();
	},
	initFunction: async (ctx, config) => {
		const appCtx = getAppContext();
		const HMR_PORT = appCtx.config.http.port + 1;
		const isProduction = appCtx.config.node_env === "production";
		await import("vite");
		if (isProduction) {
			if (!fs.existsSync(WebBuildFromPath)) {
				info("No web source directory found, skipping webui build");
				return;
			}
			const result = await buildWebUI(WebBuildFromPath, WebBuildToPath);
			if (!result) {
				error("Failed to build webui");
				return;
			}
			else {
				info("WebUI built successfully");
			}
			const clientPath = path.join(WebBuildToPath, "client");
			if (!fs.existsSync(clientPath)) {
				error("Web build not found in public directory");
				return;
			}
			appCtx.http.server.use(express.static(clientPath, { index: false }));
			const manifestPath = path.join(WebBuildToPath, "/client/.vite/ssr-manifest.json");
			let ssrManifest: Record<string, unknown> | undefined;
			if (await fs.pathExists(manifestPath)) {
				ssrManifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
			} else {

			}
			const template = await fs.readFile(path.join(WebBuildToPath, '/client/index.html'), 'utf-8');
			let renderer;
			try {
				renderer = (require(`${WebBuildToPath}/server/entry-server.js`)).render;
			} catch (e) {
				error("Failed to load SSR entry-server.js", e);
			}
			if (ssrManifest && renderer) {
				listenSSR(appCtx.http.server, renderer, template, ssrManifest);
			} else {
				appCtx.http.server.use((req, res, next) => {
					if (req.method.toUpperCase() !== "GET") return next();
					res.send(template);
				});
			}
		}
		else {
			debug("Starting Vite dev server");
			devWebUI(WebBuildFromPath, HMR_PORT);
			appCtx.http.server.use("*", async (req, res) => {
				const response = await axios.get(`http://localhost:${HMR_PORT}${req.originalUrl}`, {
					headers: req.headers,
					validateStatus: () => true
				}).catch((e) => {
					error("Failed to forward request to vite dev server", e);
					res.status(500).send("Internal Server Error");
				});
				if (!response) {
					error("Failed to forward request to vite dev server");
					res.status(500).send("Internal Server Error");
					return;
				}
				res.status(response.status).set(response.headers).send(response.data);
			});
			debug("Vite dev server started");
			ctx.emit("ready");
		}
	}
} satisfies Module<EventEmitter, "none">;
