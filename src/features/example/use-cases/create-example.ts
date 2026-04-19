import type { SupabaseClient } from "@supabase/supabase-js";
import { exampleSchema, type CreateExampleInput, type Example } from "../types";

export async function createExample(
  supabase: SupabaseClient,
  input: CreateExampleInput,
): Promise<Example> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("unauthorized");
  }

  const { data, error } = await supabase
    .from("examples")
    .insert({ title: input.title, user_id: user.id })
    .select("id, user_id, title, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "failed to insert example");
  }

  return exampleSchema.parse({
    id: data.id,
    userId: data.user_id,
    title: data.title,
    createdAt: data.created_at,
  });
}
