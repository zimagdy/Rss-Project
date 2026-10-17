import { defineConfig } from "drizzle-kit";
import { readConfig } from "./dist/config.js";

export default defineConfig({
  dialect: "postgresql",
  schema: "src/db/schema.ts",
  out: "src/db",
  dbCredentials: {
    url: readConfig().dbUrl,
  },
});
