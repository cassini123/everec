import { handle } from "hono/vercel";
import app from "../../knowgo/web/backend/src/app";

export default handle(app);
