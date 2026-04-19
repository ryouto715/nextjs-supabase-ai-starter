import type { SupabaseClient } from "@supabase/supabase-js";
import { exampleSchema, type Example } from "../types";

export async function listExamples(supabase: SupabaseClient): Promise<Example[]> {
  const { data, error } = await supabase
    .from("examples")
    .select("id, user_id, title, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    exampleSchema.parse({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: row.created_at,
    }),
  );
}
