import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED, DATABASE_URL, or POSTGRES_URL is required.");

const pool = new Pool({ connectionString, max: 1 });
const db = drizzle({ client: pool });

try {
  await migrate(db, { migrationsFolder: resolve("drizzle/postgres") });
  console.log("Postgres migrations applied.");
} finally {
  await pool.end();
}
