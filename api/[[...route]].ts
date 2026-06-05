import { handle } from "hono/vercel";
import app from "../web/backend/src/app";

export default handle(app);
