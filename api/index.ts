import desoundApp from "../desound/web/backend/src/app";
import knowgoApp from "../knowgo/web/backend/src/app";
import prerectorApp from "../prerector/web/backend/src/app";

export default async function handler(req: Request): Promise<Response> {
  const pathname = new URL(req.url).pathname;
  if (pathname.startsWith("/api/knowgo")) {
    return knowgoApp.fetch(req);
  }
  if (pathname.startsWith("/api/prerector")) {
    return prerectorApp.fetch(req);
  }
  return desoundApp.fetch(req);
}
