var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import FrameworkClient from "strike-discord-framework";
import { CREATOR, IS_DEV, PROJ_NAME } from "./config.js";
import { Application } from "./application.js";
const frameworkOptions = {
    commandsPath: `${process.cwd()}/commands/`,
    databaseOpts: {
        databaseName: process.env.DB_NAME + (IS_DEV ? "-dev" : ""),
        url: process.env.DB_URL
    },
    loggerOpts: {
        filePath: `${process.cwd()}/../logs/`,
        logChannels: {
            INFO: process.env.LOG_CHANNEL,
            ERROR: process.env.ERR_CHANNEL,
            WARN: process.env.ERR_CHANNEL
        },
        logToFile: true
    },
    defaultPrefix: "*",
    name: PROJ_NAME,
    token: process.env.TOKEN,
    ownerID: CREATOR,
    dmPrefixOnPing: true,
    dmErrorSilently: false,
    permErrorSilently: false,
    permissionOptions: {
        perms: ["ADMIN"]
    }
};
const frameClient = new FrameworkClient(frameworkOptions);
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const application = new Application(frameClient);
        frameClient.loadBotCommands(process.cwd() + "/../node_modules/strike-discord-framework/dist/defaultCommands/");
        yield frameClient.init(application);
        yield application.init();
        process.on("unhandledRejection", (error) => {
            application.log.error(error);
        });
        process.on("uncaughtException", (error) => {
            application.log.error(error);
        });
    });
}
init();
