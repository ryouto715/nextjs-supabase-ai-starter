import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Drizzle スキーマ定義。
// RLS ポリシーは Drizzle では表現できないため、同名の Supabase migration 側で定義する
// （ADR-002 / AGENTS.md「RLS 必須」を参照）。

export const examples = pgTable(
  "examples",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    titleLength: check("examples_title_length", sql`length(${table.title}) between 1 and 200`),
    userCreatedAtIdx: index("examples_user_id_created_at_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
  }),
);

export type ExampleRow = typeof examples.$inferSelect;
export type NewExampleRow = typeof examples.$inferInsert;
