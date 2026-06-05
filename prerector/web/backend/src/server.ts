import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT ?? 3002);

console.log(`[prerector] API http://localhost:${port}/api/health`);
serve({ fetch: app.fetch, port });
