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
    name: "name",
    help: {
        msg: "Sets the name of the faction",
        usage: "%PREFIX%name \"[new name]\"",
        example: "%PREFIX%name \"Red Wood Industries\""
    },
    run: function ({ message, framework, app }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.member.permissions.has("MANAGE_ROLES")) {
                return framework.error(`You must have the manage roles permission to make changes`);
            }
            const faction = yield app.createDefaultOrGet(message.guild.id);
            const newName = framework.utils.parseQuotes(message.content)[1];
            if (!newName)
                return framework.error(`Please enter a new faction name`);
            if (newName == faction.name)
                return framework.error(`That is already the current name for the faction`);
            const factions = yield app.factions.get();
            if (factions.some(faction => faction.name == newName)) {
                return framework.error(`Another faction already has that name`);
            }
            faction.name = newName;
            yield app.factions.update(faction, faction.serverID);
            return framework.success(`Faction name updated to ${newName}`);
        });
    }
};
export default command;
