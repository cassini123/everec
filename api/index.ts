import app from "../desound/web/backend/src/app";

export default {
  fetch(request: Request, context?: ExecutionContext) {
    return app.fetch(request, context);
  },
};
