import { fileURLToPath } from "url";
import fs from "fs-extra";
import { Application } from "express";
import { spawnChild } from "@src/engine/utils/Process";
import { debug, error } from "@src/engine/utils/Logger";

export async function buildWebUI(from: string, to: string) {
	const fromPath = from;
	const toPath = to;

	await fs.remove(toPath);
	await fs.mkdir(toPath, { recursive: true });

	let errored = false;
	await spawnChild("bun install", { cwd: fromPath }).catch((e) => {
		error("Failed to install dependencies for webui", e);
		errored = true;
	}).then((result) => {
		debug("bun install result", result);
	});
	if (errored) return false;

	await spawnChild("bun run build", { cwd: fromPath }).catch((e) => {
		error("Failed to build webui", e);
		errored = true;
	}).then((result) => {
		debug("bun run build result", result);
	});
	if (errored) return false;

	await fs.copy(fromPath + "/dist", toPath, {
		overwrite: true,
	}).catch((e) => {
		error("Failed to copy build to webui", e);
		errored = true;
	});
	if (errored) return false;

	return true;
}

export async function devWebUI(from: string, port: number) {
	const fromPath = from;
	let errored = false;
	await spawnChild(`bun run dev -- --port ${port} --host`, { cwd: fromPath }).catch((e) => {
		error("Failed to start vite in dev mode", e);
		errored = true;
		return e;
	});
	if (errored) return false;
	return true;
}

export function listenSSR(http: Application, render: any, template: string, ssrManifest: any) {
	http.use('*', async (req, res) => {
		try {
			debug(`SSR request: ${req.originalUrl}`)
			const url = req.originalUrl.replace("/", '')
			const { stream } = render(url, ssrManifest, 'utf-8')

			const [htmlStart, htmlEnd] = template.split('<!--app-html-->')

			res.status(200).set({ 'Content-Type': 'text/html' })

			res.write(htmlStart)
			for await (const chunk of stream) {
				if (res.closed) break
				res.write(chunk)
			}
			res.write(htmlEnd)
			res.end()
		} catch (e) {
			error("Error serving web page", e)
			res.status(500).send("Internal Server Error")
		}
	})
}