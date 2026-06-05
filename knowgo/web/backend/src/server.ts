import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.KNOWGO_PORT ?? process.env.PORT ?? 3002);

serve({ fetch: app.fetch, port }, () => {
  console.log(`@everec/knowgo-backend listening on http://localhost:${port}`);
});
