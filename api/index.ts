import desoundApp from "../desound/web/backend/src/app";
import knowgoApp from "../knowgo/web/backend/src/app";
import prerectorApp from "../prerector/web/backend/src/app";

export default {
  fetch(req: Request, context?: ExecutionContext) {
    const pathname = new URL(req.url).pathname;
    if (pathname.startsWith("/api/knowgo")) {
      return knowgoApp.fetch(req, context);
    }
    if (pathname.startsWith("/api/prerector")) {
      return prerectorApp.fetch(req, context);
    }
    return desoundApp.fetch(req, context);
  },
};
