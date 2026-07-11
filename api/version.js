// api/version.js
// buildTime must change on every real deploy or the client's version-check
// (App.jsx) can never detect an update — 'unknown' !== 'unknown' is always
// false. VITE_BUILD_TIME requires manually wiring the build command and was
// never actually configured in Vercel (confirmed July 10 2026 — this
// endpoint had been returning 'unknown' on every request since the feature
// was built, so the update banner was structurally incapable of firing).
// VERCEL_GIT_COMMIT_SHA is auto-injected by Vercel on every deployment with
// zero configuration needed, so it's used as the primary source — it
// changes on every real deploy the same way a build timestamp would.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json({
    buildTime: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_BUILD_TIME || 'unknown',
  });
}
