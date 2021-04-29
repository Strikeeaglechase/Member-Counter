import { Application } from "application";
import { BotCommand, CommandEvent } from "strike-discord-framework/dist/command";

const command: BotCommand = {
	allowDM: false,
	name: "remove",
	help: {
		msg: "Removes the faction entry for this server",
		usage: "%PREFIX%remove",
	},
	run: async function ({ message, framework, app }: CommandEvent<Application>) {
		if (!message.member.permissions.has("MANAGE_ROLES")) {
			return framework.error(`You must have the manage roles permission to make changes`);
		}
		const faction = await app.factions.get(message.guild.id);
		if (!faction) return framework.error(`This server does not have a faction entry`);
		await app.factions.remove(faction.serverID);
		return framework.success(`Faction entry removed`);
	}
}
export default command;