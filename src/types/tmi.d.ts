declare module 'tmi.js' {
	import { EventEmitter } from 'events';
	export class Client extends EventEmitter {
		constructor(options: any);
		connect(): Promise<[string, number]>;
	}
}
