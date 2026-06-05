import { handle } from "hono/vercel";
import app from "../desound/web/backend/src/app";

export default handle(app);
