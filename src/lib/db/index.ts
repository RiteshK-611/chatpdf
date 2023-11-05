import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error("database url not found");
}

console.log("database url found", process.env.DATABASE_URL);

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql);
