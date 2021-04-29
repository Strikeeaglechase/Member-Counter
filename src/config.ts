import { config as dotenvConfig } from "dotenv";
dotenvConfig();

export const IS_DEV = process.env.IS_DEV == "true";
export const CREATOR = "272143648114606083";
export const PROJ_NAME = "Member Counter";