// going-yard/scripts/gen-version.js
// Runs AFTER `vite build` (see package.json "build" script) so it can read
// the actual bundled JS output. Writes public/version.json with:
//   - bundleFile: the real Vite output filename (e.g. "index-BZGZGl0a.js") —
//     content-hashed by Vite, so it only changes when the bundled JS content
//     actually changed. Used by api/version.js to detect real app updates,
//     replacing VERCEL_GIT_COMMIT_SHA (the old signal), which changed on
//     every git push including the daily data-only pushes mlbdata_aggregate.py
//     makes straight into this repo (public/data/ only, never src/) — those
//     never change the bundle hash, so they no longer trigger a false
//     "app updated" banner. Fixed July 15 2026.
//   - version / changelog: still derived from the latest commit message,
//     purely for the banner's human-readable display text — not used for
//     update detection.
import { execSync } from 'node:child_process';
import { writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'version.json');
const ASSETS_DIR = join(__dirname, '..', 'dist', 'assets');

function buildChangelog() {
  try {
    const subject = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim();
    if (!subject) throw new Error('empty commit subject');
    // Split multi-clause commit messages ("A, B, fix C") into separate
    // changelog bullets — the banner only shows the first 2.
    const parts = subject.split(/,\s+|;\s+/).map(s => s.trim()).filter(Boolean);
    return parts.length ? parts : [subject];
  } catch (e) {
    // Never fail the build over this — degrade to a generic message.
    console.warn('[gen-version] git log unavailable, falling back to generic message:', e.message);
    return ['New update available'];
  }
}

function findBundleFile() {
  try {
    const files = readdirSync(ASSETS_DIR);
    const jsBundle = files.find(f => /^index-.*\.js$/.test(f));
    if (!jsBundle) throw new Error('no index-*.js found in dist/assets');
    return jsBundle;
  } catch (e) {
    // Never fail the build over this — api/version.js falls back to the old
    // git-SHA behavior if bundleFile comes back empty.
    console.warn('[gen-version] could not read dist/assets, bundleFile will be empty:', e.message);
    return '';
  }
}

const now = new Date();
const version = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
const bundleFile = findBundleFile();

const output = {
  version,
  bundleFile,
  changelog: buildChangelog(),
  notifyUsers: true,
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`[gen-version] Wrote ${OUT_PATH}:`, output);
