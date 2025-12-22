import { DSCommand } from "../extendedclient";
export default {
	name: "ping",
	description: "Ping!",
	async execute(client, message) {
		message.reply("Pong!");
	},
} satisfies DSCommand;