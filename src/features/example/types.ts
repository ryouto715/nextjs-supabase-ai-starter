import { z } from "zod";

// Branded Type: 生の string / UUID と ExampleId を型レベルで区別する。
// 値は z.string().uuid() で検証した後に ExampleId として扱う。
export type ExampleId = string & { readonly __brand: "ExampleId" };

export const exampleIdSchema = z
  .string()
  .uuid()
  .transform((value) => value as ExampleId);

export const exampleSchema = z.object({
  id: exampleIdSchema,
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  createdAt: z.string(),
});

export type Example = z.infer<typeof exampleSchema>;

export const createExampleInputSchema = z.object({
  title: z.string().min(1, "title is required").max(200, "title too long"),
});

export type CreateExampleInput = z.infer<typeof createExampleInputSchema>;
