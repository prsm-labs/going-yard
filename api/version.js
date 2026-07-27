// api/version.js
// buildTime should change only when a real deploy happens, so the client can
// detect it via a simple string comparison against localStorage.
//
// History: originally used VERCEL_GIT_COMMIT_SHA (changes on every commit,
// including mlbdata_aggregate.py's nightly data-only pushes into
// public/data/ — false-positive banners). Switched July 15 2026 to reading
// bundleFile (Vite's content hash) from public/version.json instead, since
// a data-only push can't change that hash.
//
// Reverted 2026-07-27: confirmed live that this file's own read of
// public/version.json was serving a DIFFERENT, stale bundleFile than what
// the actual live /version.json static endpoint was returning at the same
// moment — Vercel serverless functions appear to bundle/cache their own
// file snapshot independent of the CDN-served static output, so a file read
// inside a function is not a reliable "what's live right now" signal (see
// scripts/gen-version.js's header comment for the fuller writeup, including
// the separate dist/version.json dual-write bug found in the same
// investigation). VERCEL_GIT_COMMIT_SHA is a platform-injected env var, not
// a file read — always fresh per deployment.
//
// The false-positive-banner problem the July 15 change was solving for is
// now handled differently: gen-version.js sets notifyUsers:false in
// version.json when the latest commit is a routine data-only push, and the
// client checks that flag (fetched fresh from the static /version.json
// endpoint, not through this file) before actually showing the banner. So
// SHA can fire on every push again — the CONTENT layer decides whether it's
// worth telling the user about, not the detection layer.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const buildTime = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_BUILD_TIME || 'unknown';
  res.json({ buildTime });
}
