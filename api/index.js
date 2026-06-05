// Replaced during Vercel build by `npm run build:vercel-api`.
export default {
  fetch() {
    return Response.json({ ok: false, error: "API bundle not built yet" }, { status: 503 });
  },
};
