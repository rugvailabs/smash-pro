import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/* Neon Postgres via the serverless driver (ADR-0003). The websocket Pool
   gives full transaction support; Node ≥22 provides a global WebSocket. */

neonConfig.webSocketConstructor = globalThis.WebSocket;

const globalForDb = globalThis as unknown as { __psPool?: Pool };

const pool =
  globalForDb.__psPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb.__psPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
