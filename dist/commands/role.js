var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const command = {
    allowDM: false,
    name: "role",
    help: {
        msg: "Sets the member role of the faction",
        usage: "%PREFIX%role \"[role ID]\"",
        example: "%PREFIX%role \"583607081513385998\""
    },
    run: function ({ message, framework, app }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.member.permissions.has("MANAGE_ROLES")) {
                return framework.error(`You must have the manage roles permission to make changes`);
            }
            const faction = yield app.createDefaultOrGet(message.guild.id);
            const newRole = framework.utils.parseQuotes(message.content)[1];
            if (!newRole)
                return framework.error(`Please enter a member role ID`);
            const role = yield message.guild.roles.fetch(newRole).catch(() => { });
            if (!role)
                return framework.error(`Unable to resolve role with ID ${newRole}`);
            faction.roleID = role.id;
            yield app.factions.update(faction, faction.serverID);
            app.countMembers(faction, message.guild);
            return framework.success(`Faction member role updated to <@&${role.id}>`);
        });
    }
};
export default command;
