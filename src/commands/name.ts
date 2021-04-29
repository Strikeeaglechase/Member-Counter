import { Application } from "application";
import { BotCommand, CommandEvent } from "strike-discord-framework/dist/command";

const command: BotCommand = {
	allowDM: false,
	name: "name",
	help: {
		msg: "Sets the name of the faction",
		usage: "%PREFIX%name \"[new name]\"",
		example: "%PREFIX%name \"Red Wood Industries\""
	},
	run: async function ({ message, framework, app }: CommandEvent<Application>) {
		if (!message.member.permissions.has("MANAGE_ROLES")) {
			return framework.error(`You must have the manage roles permission to make changes`);
		}
		const faction = await app.createDefaultOrGet(message.guild.id);
		const newName = framework.utils.parseQuotes(message.content)[1];
		if (!newName) return framework.error(`Please enter a new faction name`);
		if (newName == faction.name) return framework.error(`That is already the current name for the faction`);
		const factions = await app.factions.get();
		if (factions.some(faction => faction.name == newName)) {
			return framework.error(`Another faction already has that name`);
		}

		faction.name = newName;
		await app.factions.update(faction, faction.serverID);
		return framework.success(`Faction name updated to ${newName}`);
	}
}
export default command;