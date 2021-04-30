import { Application } from "application";
import { BotCommand, CommandEvent } from "strike-discord-framework/dist/command";

const command: BotCommand = {
	allowDM: false,
	name: "role",
	help: {
		msg: "Sets the member role of the faction. You may enter more than one if you have multiple member roles",
		usage: "%PREFIX%role \"[role ID]\" {role ID} {role ID}",
		example: "%PREFIX%role \"583607081513385998\""
	},
	run: async function ({ message, framework, app }: CommandEvent<Application>) {
		if (!message.member.permissions.has("MANAGE_ROLES")) {
			return framework.error(`You must have the manage roles permission to make changes`);
		}
		const faction = await app.createDefaultOrGet(message.guild.id);
		const newRoles = framework.utils.parseQuotes(message.content);
		newRoles.shift(); // Remove command name

		if (newRoles.length == 0) return framework.error(`Please enter a member role ID`);
		const roleProms = newRoles.map(async rId => {
			const role = await message.guild.roles.fetch(rId).catch(() => { });
			if (role) return role;
		});
		const roles = (await Promise.all(roleProms)).filter(r => r != undefined);
		if (roles.length == 0) return framework.error(`Unable to resolve roles`);

		faction.roleIDs = roles.map(r => r.id);
		await app.factions.update(faction, faction.serverID);
		app.countMembers(faction, message.guild);
		const roleStrs = roles.map(r => `<@&${r.id}>`);
		return framework.success(`Faction member roles updated to ${roleStrs.join(" ")}`);
	}
}
export default command;