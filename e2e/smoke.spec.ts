import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("landing page renders the app title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Next.js + Supabase AI Starter",
    );
  });

  test("GET /api/health returns 200 with status ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
