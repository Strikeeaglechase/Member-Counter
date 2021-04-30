var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GoogleSpreadsheet } from "google-spreadsheet";
import creds from "./creds.js";
const SHEET_TITLE = "Sheet1";
const START_ROW = 0;
function timestamp() {
    const str = new Date().toString();
    const space = str.indexOf(" ") + 1;
    return str.substring(space, str.indexOf(" ", space + "MMM DD ".length));
}
function hasAnyRole(roles, ids) {
    return ids.some(id => roles.has(id));
}
class Application {
    constructor(framework) {
        this.framework = framework;
        this.log = this.framework.log;
        this.doc = new GoogleSpreadsheet("1n11jDrBsMRV1WbD8_YwyTbavPQgBOgxOTqpWt4yekAE");
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.factions = yield this.framework.database.collection("factions", false, "serverID");
            this.framework.client.on("guildMemberUpdate", (oldMember, newMember) => this.updateMemberCounts(oldMember, newMember));
            yield this.doc.useServiceAccountAuth(creds);
            yield this.doc.loadInfo();
            this.sheet = this.doc.sheetsByTitle[SHEET_TITLE];
            // update once every 10 minutes
            const self = this;
            function update() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield self.updateCells();
                    setTimeout(update, 1000 * 60 * 10);
                });
            }
            update();
        });
    }
    createDefaultOrGet(serverID) {
        return __awaiter(this, void 0, void 0, function* () {
            let faction = yield this.factions.get(serverID);
            if (!faction) {
                faction = {
                    serverID: serverID,
                    roleIDs: [],
                    name: null,
                    memberCount: 0
                };
                yield this.factions.add(faction);
            }
            return faction;
        });
    }
    updateMemberCounts(oldMember, newMember) {
        return __awaiter(this, void 0, void 0, function* () {
            const faction = yield this.factions.get(newMember.guild.id);
            // If any of these are true the faction hasnt been setup yet
            if (!faction || !faction.roleIDs || faction.roleIDs.length == 0 || !faction.name)
                return;
            if (hasAnyRole(oldMember.roles.cache, faction.roleIDs) != hasAnyRole(newMember.roles.cache, faction.roleIDs)) {
                this.countMembers(faction, newMember.guild);
            }
        });
    }
    countMembers(faction, guild) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`Updating member count for ${faction.name}`);
            const members = yield guild.members.fetch().catch(() => { });
            if (!members) {
                this.log.warn(`Unable to fetch members for ${faction.name} in ${guild.id} (${faction.serverID})`);
                return;
            }
            const count = members.array().reduce((acc, cur) => {
                return hasAnyRole(cur.roles.cache, faction.roleIDs) ? acc + 1 : acc;
            }, 0);
            if (faction.memberCount == count)
                return;
            this.log.info(`New member count for ${faction.name} of ${count}`);
            faction.memberCount = count;
            yield this.factions.update(faction, faction.serverID);
            yield this.updateCells();
        });
    }
    updateCells() {
        return __awaiter(this, void 0, void 0, function* () {
            const factions = yield this.factions.get();
            yield this.sheet.loadCells();
            const headers = {
                "Rank": 0,
                "Faction Name": 0,
                "Member Count": 0,
                "Last Updated": 0,
                "Notes": 0
            };
            // Check first 25
            for (let i = 0; i < 25; i++) {
                const cell = this.sheet.getCell(START_ROW, i);
                if (typeof cell.value != "string")
                    continue;
                if (headers[cell.value] != null) {
                    headers[cell.value] = i;
                }
            }
            const sheetData = [];
            let blanks = 0;
            for (let i = START_ROW + 1; i < this.sheet.rowCount; i++) {
                const data = {
                    factionName: this.sheet.getCell(i, headers["Faction Name"]).value,
                    lastUpd: this.sheet.getCell(i, headers["Last Updated"]).value,
                    memberCount: this.sheet.getCell(i, headers["Member Count"]).value,
                    notes: this.sheet.getCell(i, headers["Notes"]).value,
                    rank: this.sheet.getCell(i, headers["Rank"]).value,
                };
                if (!data.factionName) {
                    blanks++;
                    if (blanks > 5)
                        break; // break after 5 empty lines
                    continue;
                }
                sheetData.push(data);
            }
            factions.forEach(fac => {
                if (!sheetData.some(f => f.factionName == fac.name)) {
                    this.log.info(`Unable to find ${fac.name} on the sheet, adding new entry`);
                    const newRowData = [];
                    newRowData[headers["Faction Name"]] = fac.name;
                    newRowData[headers["Last Updated"]] = timestamp();
                    newRowData[headers["Member Count"]] = fac.memberCount;
                    newRowData[headers["Notes"]] = null;
                    newRowData[headers["Rank"]] = 0;
                    sheetData.push({
                        factionName: fac.name,
                        lastUpd: null,
                        memberCount: fac.memberCount,
                        notes: null,
                        rank: 0
                    });
                }
            });
            sheetData.forEach(sheetFaction => {
                const faction = factions.find(f => f.name == sheetFaction.factionName);
                if (faction)
                    sheetFaction.memberCount = faction.memberCount;
            });
            const sorted = sheetData.sort((a, b) => b.memberCount - a.memberCount);
            sorted.forEach((faction, idx) => {
                faction.rank = idx + 1;
                const row = START_ROW + idx + 1;
                this.sheet.getCell(row, headers["Faction Name"]).value = faction.factionName;
                this.sheet.getCell(row, headers["Last Updated"]).value = timestamp();
                this.sheet.getCell(row, headers["Member Count"]).value = faction.memberCount;
                this.sheet.getCell(row, headers["Rank"]).value = "#" + faction.rank;
                this.sheet.getCell(row, headers["Notes"]).value = faction.notes;
            });
            yield this.sheet.saveUpdatedCells();
        });
    }
}
export { Application };
