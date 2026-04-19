import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createClient } from "@/lib/supabase/server";
import { createExample } from "./use-cases/create-example";
import { listExamples } from "./use-cases/list-examples";
import { createExampleInputSchema } from "./types";

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export const exampleRoute = new Hono()
  .get("/", async (c) => {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return c.json({ error: { code: "unauthorized", message: "login required" } }, 401);
    const examples = await listExamples(supabase);
    return c.json({ examples });
  })
  .post("/", zValidator("json", createExampleInputSchema), async (c) => {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return c.json({ error: { code: "unauthorized", message: "login required" } }, 401);
    const input = c.req.valid("json");
    const example = await createExample(supabase, input);
    return c.json({ example }, 201);
  });
