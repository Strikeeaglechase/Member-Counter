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
    name: "remove",
    help: {
        msg: "Removes the faction entry for this server",
        usage: "%PREFIX%remove",
    },
    run: function ({ message, framework, app }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.member.permissions.has("MANAGE_ROLES")) {
                return framework.error(`You must have the manage roles permission to make changes`);
            }
            const faction = yield app.factions.get(message.guild.id);
            if (!faction)
                return framework.error(`This server does not have a faction entry`);
            yield app.factions.remove(faction.serverID);
            return framework.success(`Faction entry removed`);
        });
    }
};
export default command;
