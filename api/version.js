// api/version.js
// buildTime should change only when the actual bundled app code changes, not
// on every git push — mlbdata_aggregate.py pushes daily data updates straight
// into this repo (public/data/ only, never src/), which used to trigger a
// false "app updated" banner because the old value (VERCEL_GIT_COMMIT_SHA)
// changes on every commit regardless of what changed.
//
// Fixed July 15 2026: read the real Vite bundle filename from
// public/version.json instead (written by scripts/gen-version.js after
// vite build). Vite content-hashes that filename, so it's only different
// when src/ actually changed — a data-only push can't touch it.
//
// Falls back to the previous VERCEL_GIT_COMMIT_SHA behavior if the file read
// ever fails for any reason (e.g. bundleFile missing from an older deploy) —
// this can never make the banner less reliable than it already is today.
import fs from 'node:fs';
import path from 'node:path';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  let bundleFile = '';
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'version.json'), 'utf-8');
    bundleFile = JSON.parse(raw).bundleFile || '';
  } catch (e) {
    console.warn('[api/version] could not read public/version.json, falling back to git SHA:', e.message);
  }

  const buildTime = bundleFile || process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_BUILD_TIME || 'unknown';
  res.json({ buildTime });
}
