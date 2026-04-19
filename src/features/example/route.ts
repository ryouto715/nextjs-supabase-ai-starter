import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createClient } from "@/lib/supabase/server";
import { createExample } from "./use-cases/create-example";
import { listExamples } from "./use-cases/list-examples";
import { createExampleInputSchema } from "./types";

export const exampleRoute = new Hono()
  .get("/", async (c) => {
    const supabase = await createClient();
    const examples = await listExamples(supabase);
    return c.json({ examples });
  })
  .post("/", zValidator("json", createExampleInputSchema), async (c) => {
    const input = c.req.valid("json");
    const supabase = await createClient();
    const example = await createExample(supabase, input);
    return c.json({ example }, 201);
  });
