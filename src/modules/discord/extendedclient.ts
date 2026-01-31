import { useImporterRecursive } from "@src/engine/utils/Importing";
import { warn } from "@src/engine/utils/Logger";
import { getModulePath, getProcessPath } from "@src/engine/utils/Runtime";
import fs from "fs";
import path from "path";
import { ApplicationCommandOptionData, ChatInputCommandInteraction, Client, ClientOptions, Interaction, Message, MessageContextMenuCommandInteraction, MessageInteraction, ModalSubmitInteraction, UserContextMenuCommandInteraction, UserSelectMenuInteraction } from "discord.js";
import { Parseable, ValidateProperty, objectSchemaFrom, validateObject } from "parzival";
@Parseable()
export class DSCommand {
	@ValidateProperty({
		type: "string"
	})
	name!: string;
	@ValidateProperty({
		type: "string"
	})
	description!: string;
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false
	})
	execute!: (client: ExtendedClient, message: Message, args: string[]) => void;
}
@Parseable()
export class BaseDSInteraction<T extends Interaction> {
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
	type!: "chat" | "user" | "message" | "modal";
	@ValidateProperty({
		type: "string",
		optional: true
	})
	registerTo!: "app" | "guild";
	options?: ApplicationCommandOptionData[];
	@ValidateProperty({
		type: "function",
		validateArguments: false,
		validateReturns: false
	})
	execute!: (client: ExtendedClient, message: T) => void;
}
type ChatDSInteraction = BaseDSInteraction<ChatInputCommandInteraction> & {
	type: "chat";
	options?: ApplicationCommandOptionData[];
};
type UserDSInteraction = BaseDSInteraction<UserContextMenuCommandInteraction> & {
	type: "user";
};
type MessageDSInteraction = BaseDSInteraction<MessageContextMenuCommandInteraction> & {
	type: "message";
};
type ModalDSInteraction = BaseDSInteraction<ModalSubmitInteraction> & {
	type: "modal";
	registerTo: "app";
	description: "";
};
type AnyDSInteraction = ChatDSInteraction | UserDSInteraction | MessageDSInteraction | ModalDSInteraction;
type AutoDSInteraction<T extends AnyDSInteraction['type']> = T extends "chat" ? ChatDSInteraction : T extends "user" ? UserDSInteraction : T extends "message" ? MessageDSInteraction : T extends "modal" ? ModalDSInteraction : AnyDSInteraction;
export type DSInteraction = AutoDSInteraction<AnyDSInteraction['type']>;
export default class ExtendedClient extends Client {
	commands: Map<string, DSCommand>;
	interactions: Map<string, DSInteraction>;
	constructor(opts: ClientOptions) {
		super(opts);
		this.commands = new Map();
		this.interactions = new Map();
		const commandSchema = objectSchemaFrom(DSCommand);
		const resolve = (sub: string) => {
			const appBase = getModulePath("discord");
			if (appBase) {
				const appDir = path.join(appBase, sub);
				if (fs.existsSync(appDir)) return appDir;
			}
			return path.join(__dirname, sub);
		};
		useImporterRecursive(resolve("commands"), function validator(i: any, f, d): i is DSCommand {
			if (!i) {
				warn(`Command ${f} from ${d} has no default export`);
				return false;
			}
			if (!validateObject(i, commandSchema)) {
				warn(`Command ${f} from ${d} is invalid`);
				return false;
			}
			return true;
		}, async (i, f, d) => {
			this.commands.set(i.name, i);
		});
		const interactionSchema = objectSchemaFrom(BaseDSInteraction);
		useImporterRecursive(resolve("interactions"), function validator(i: any, f, d): i is DSInteraction {
			if (!i) {
				warn(`Interaction ${f} from ${d} has no default export`);
				return false;
			}
			if (!validateObject(i, interactionSchema)) {
				warn(`Interaction ${f} from ${d} is invalid`);
				return false;
			}
			return true;
		}, async (i, f, d) => {
			this.interactions.set(i.name, i);
		});
	}
}
