import { SpawnOptionsWithoutStdio, spawn } from 'child_process';
import { clear } from './Logger';
type SpawnChildResult = {
	code: number | null;
	stdout: string;
	stderr: string;
};
export function spawnChild(command: string, options?: SpawnOptionsWithoutStdio, log: boolean = false): Promise<SpawnChildResult> {
	const actualCommand = command.split(" ")[0];
	const args = command.split(" ").slice(1);
	let p = spawn(actualCommand, args, options);
	return new Promise((resolve) => {
		const stdout: string[] = [];
		const stderr: string[] = [];
		p.stdout.on("data", (x) => {
			if (log)
				clear(x.toString());
			stdout.push(x.toString());
		});
		p.stderr.on("data", (x) => {
			if (log)
				clear(x.toString());
			clear(x.toString());
		});
		p.on("exit", (code) => {
			resolve({ code, stdout: stdout.join(""), stderr: stderr.join("") });
		});
	});
}