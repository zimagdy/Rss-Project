import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { readConfig } from "../config.js";
import * as schema from "./schema.js";

// Read
const config = readConfig();

// Create a connection
const pool = new Pool({
  connectionString: config.dbUrl,
});
export const db = drizzle(pool, { schema });
