import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

// SQLITE_FILE env var to override location; otherwise game.db at workspace root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = process.env.SQLITE_FILE ?? path.join(__dirname, "../../../game.db");

const sqlite = new Database(dbFile);

// WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export * from "./schema";
