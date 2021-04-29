import FrameworkClient from "strike-discord-framework";
import { CollectionManager } from "strike-discord-framework/dist/collectionManager";
import Logger from "strike-discord-framework/dist/logger";
import Discord from "discord.js";
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import creds from "./creds.js";
const SHEET_TITLE = "Sheet1";
const START_ROW = 0;
interface Faction {
	name: string;
	memberCount: number;
	serverID: string;
	roleID: string;
	note?: string;
}
interface SheetData {
	rank: number;
	factionName: string;
	memberCount: number;
	lastUpd: string;
	notes: string;
}
function timestamp() {
	const str = new Date().toString();
	const space = str.indexOf(" ") + 1;
	return str.substring(space, str.indexOf(" ", space + "MMM DD ".length));
}
class Application {
	framework: FrameworkClient;
	log: Logger;
	factions: CollectionManager<string, Faction>;
	doc: GoogleSpreadsheet;
	sheet: GoogleSpreadsheetWorksheet;
	constructor(framework: FrameworkClient) {
		this.framework = framework;
		this.log = this.framework.log;
		this.doc = new GoogleSpreadsheet("1n11jDrBsMRV1WbD8_YwyTbavPQgBOgxOTqpWt4yekAE");
	}
	async init() {
		this.factions = await this.framework.database.collection("factions", false, "serverID");
		this.framework.client.on("guildMemberUpdate", (oldMember, newMember) => this.updateMemberCounts(oldMember, newMember));
		await this.doc.useServiceAccountAuth(creds);
		await this.doc.loadInfo();
		this.sheet = this.doc.sheetsByTitle[SHEET_TITLE];

		// update once every 10 minutes
		const self = this;
		async function update() {
			await self.updateCells();
			setTimeout(update, 1000 * 60 * 10)
		}
		update();
	}
	async createDefaultOrGet(serverID: string) {
		let faction = await this.factions.get(serverID);
		if (!faction) {
			faction = {
				serverID: serverID,
				roleID: null,
				name: null,
				memberCount: 0
			}
			await this.factions.add(faction);
		}
		return faction;
	}
	async updateMemberCounts(oldMember: Discord.GuildMember | Discord.PartialGuildMember, newMember: Discord.GuildMember) {
		const faction = await this.factions.get(newMember.guild.id);
		if (!faction || !faction.roleID || !faction.name) return;
		if (
			oldMember.roles.cache.has(faction.roleID) != newMember.roles.cache.has(faction.roleID)
		) {
			this.countMembers(faction, newMember.guild);
		}
	}
	async countMembers(faction: Faction, guild: Discord.Guild) {
		this.log.info(`Updating member count for ${faction.name}`);
		const members = await guild.members.fetch().catch(() => { });
		if (!members) {
			this.log.warn(`Unable to fetch members for ${faction.name} in ${guild.id} (${faction.serverID})`);
			return;
		}
		const count = members.array().reduce((acc, cur) => {
			return cur.roles.cache.has(faction.roleID) ? acc + 1 : acc
		}, 0);
		if (faction.memberCount == count) return;
		this.log.info(`New member count for ${faction.name} of ${count}`);
		faction.memberCount = count;
		await this.factions.update(faction, faction.serverID);
		await this.updateCells();
	}
	async updateCells() {
		const factions = await this.factions.get();
		await this.sheet.loadCells();
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
			if (typeof cell.value != "string") continue;
			if (headers[cell.value] != null) {
				headers[cell.value] = i;
			}
		}
		const sheetData: SheetData[] = [];
		let blanks = 0;
		for (let i = START_ROW + 1; i < this.sheet.rowCount; i++) {
			const data: SheetData = {
				factionName: this.sheet.getCell(i, headers["Faction Name"]).value as string,
				lastUpd: this.sheet.getCell(i, headers["Last Updated"]).value as string,
				memberCount: this.sheet.getCell(i, headers["Member Count"]).value as number,
				notes: this.sheet.getCell(i, headers["Notes"]).value as string,
				rank: this.sheet.getCell(i, headers["Rank"]).value as number,
			}
			if (!data.factionName) {
				blanks++;
				if (blanks > 5) break; // break after 5 empty lines
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
			if (faction) sheetFaction.memberCount = faction.memberCount;
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
		await this.sheet.saveUpdatedCells();
	}
}
export { Application }