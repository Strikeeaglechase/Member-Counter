import { Application } from "application";
import { BotCommand, CommandEvent } from "strike-discord-framework/dist/command";

const command: BotCommand = {
	allowDM: false,
	name: "role",
	help: {
		msg: "Sets the member role of the faction",
		usage: "%PREFIX%role \"[role ID]\"",
		example: "%PREFIX%role \"583607081513385998\""
	},
	run: async function ({ message, framework, app }: CommandEvent<Application>) {
		if (!message.member.permissions.has("MANAGE_ROLES")) {
			return framework.error(`You must have the manage roles permission to make changes`);
		}
		const faction = await app.createDefaultOrGet(message.guild.id);
		const newRole = framework.utils.parseQuotes(message.content)[1];
		if (!newRole) return framework.error(`Please enter a member role ID`);
		const role = await message.guild.roles.fetch(newRole).catch(() => { });
		if (!role) return framework.error(`Unable to resolve role with ID ${newRole}`);

		faction.roleID = role.id;
		await app.factions.update(faction, faction.serverID);
		app.countMembers(faction, message.guild);
		return framework.success(`Faction member role updated to <@&${role.id}>`);
	}
}
export default command;