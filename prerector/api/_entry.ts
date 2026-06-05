import app from "../web/backend/src/app";

export default {
  fetch(request: Request, context?: ExecutionContext) {
    return app.fetch(request, context);
  },
};
