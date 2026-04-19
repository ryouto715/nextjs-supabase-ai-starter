import { Hono } from "hono";
import { exampleRoute } from "@/features/example/route";

export const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ status: "ok" }));

export const routes = app.route("/examples", exampleRoute);

export type AppType = typeof routes;
