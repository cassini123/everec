import { handle } from "hono/vercel";
import app from "../../prerector/web/backend/src/app";

export default handle(app);
