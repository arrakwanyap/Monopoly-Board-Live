import { defineConfig } from "drizzle-kit";
import path from "path";

// SQLITE_FILE env var to override; otherwise game.db at workspace root
// __dirname is injected by tsx (used by drizzle-kit) for ESM config files
const dbFile = process.env.SQLITE_FILE ?? path.join(__dirname, "../../game.db");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbFile,
  },
});
