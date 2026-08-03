import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { localLorePool?: Pool };

export function getDb() {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("Local Lore requires DATABASE_URL or POSTGRES_URL for database-backed routes.");
  const pool = globalForDb.localLorePool ?? new Pool({ connectionString, max: 3 });
  if (process.env.NODE_ENV !== "production") globalForDb.localLorePool = pool;
  return drizzle({ client: pool, schema });
}
