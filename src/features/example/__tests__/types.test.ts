import { describe, expect, it } from "vitest";
import { createExampleInputSchema, exampleSchema } from "../types";

describe("createExampleInputSchema", () => {
  it("accepts a valid title", () => {
    const result = createExampleInputSchema.parse({ title: "hello" });
    expect(result.title).toBe("hello");
  });

  it("rejects empty title", () => {
    expect(() => createExampleInputSchema.parse({ title: "" })).toThrow();
  });

  it("rejects title longer than 200 chars", () => {
    expect(() => createExampleInputSchema.parse({ title: "a".repeat(201) })).toThrow();
  });
});

describe("exampleSchema", () => {
  it("brands id as ExampleId", () => {
    const parsed = exampleSchema.parse({
      id: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
      title: "t",
      createdAt: "2026-01-01T00:00:00Z",
    });
    expect(parsed.id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("rejects non-uuid id", () => {
    expect(() =>
      exampleSchema.parse({
        id: "not-a-uuid",
        userId: "22222222-2222-2222-2222-222222222222",
        title: "t",
        createdAt: "2026-01-01T00:00:00Z",
      }),
    ).toThrow();
  });
});
