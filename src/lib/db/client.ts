import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Populate .env.local from .env.example and run `supabase start`.",
  );
}

const queryClient = postgres(databaseUrl, { prepare: false });

export const db = drizzle(queryClient);
export type Db = typeof db;
