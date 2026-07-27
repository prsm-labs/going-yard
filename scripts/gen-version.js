// going-yard/scripts/gen-version.js
// Runs AFTER `vite build` (see package.json "build" script) so it can read
// the actual bundled JS output. Writes version.json with:
//   - bundleFile: the real Vite output filename (e.g. "index-BZGZGl0a.js") —
//     content-hashed by Vite, so it only changes when the bundled JS content
//     actually changed.
//   - version / changelog: derived from the latest non-routine commit
//     message, for the banner's human-readable display text.
//   - notifyUsers: false when the resolved changelog had to fall back to a
//     routine "Daily data update" commit (see below) — the client should NOT
//     show a banner for that case, even though something did technically
//     change.
//
// CRITICAL (found 2026-07-27): this script writes to public/version.json,
// but `vite build` (which runs BEFORE this script, per package.json) already
// copies public/'s contents into dist/ as one of its own build steps — that
// copy happens using WHATEVER public/version.json held at the START of the
// build, not what this script writes AFTER. Since Vercel serves the dist/
// output directory, every deploy was shipping the PREVIOUS build's
// version.json (or, if public/version.json was never committed after a
// local build, whatever was last actually committed to git) — confirmed
// live: production was still serving version.json content from 2026-07-23
// after multiple real deploys. Fix: write directly to dist/version.json too,
// so THIS build's actual static output has the fresh data, not just the
// source tree for the next build to pick up.
//
// Also found live: api/version.js's public/version.json file read was
// returning a DIFFERENT bundleFile than the one in the live /version.json
// response — most likely Vercel serverless functions can bundle/cache their
// own file snapshot independent of the static dist/ output, so a file read
// inside a function isn't a reliable "what's live right now" signal. Fixed
// by reverting api/version.js's PRIMARY signal back to
// process.env.VERCEL_GIT_COMMIT_SHA (a platform-guaranteed-fresh env var,
// not a file read) — see that file's own comment for the full reasoning.
// The false-positive-banner problem that file-based detection was
// originally solving for (July 15) is now handled by notifyUsers below
// instead, at the content layer rather than the detection layer.
import { execSync } from 'node:child_process';
import { writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_OUT_PATH = join(__dirname, '..', 'public', 'version.json');
const DIST_OUT_PATH   = join(__dirname, '..', 'dist', 'version.json');
const ASSETS_DIR = join(__dirname, '..', 'dist', 'assets');

// mlbdata_aggregate.py auto-commits every night with this exact, predictable
// message ("Daily data update {date}", see mlbdata_aggregate.py's git
// commit step) — it only ever touches public/data/, never src/, so it can't
// be what changed bundleFile. But since the pipeline runs nightly, it's
// very often the LATEST commit at build time regardless of what real code
// change actually caused bundleFile to differ — so `git log -1` alone
// nearly always shows this generic message instead of the change that's
// actually worth telling the user about. Fixed 2026-07-26.
const DATA_UPDATE_RE = /^Daily data update \d{4}-\d{2}-\d{2}$/;

function buildChangelog() {
  try {
    // Walk back through recent commit subjects and use the first one that
    // isn't a routine data-update commit, so the banner's text describes
    // the real change that fired it, not whatever nightly refresh happened
    // to land most recently.
    const log = execSync('git log -20 --pretty=%s', { encoding: 'utf-8' });
    const subjects = log.split('\n').map(s => s.trim()).filter(Boolean);
    if (!subjects.length) throw new Error('no commit subjects found');
    const realSubject = subjects.find(s => !DATA_UPDATE_RE.test(s));
    const subject = realSubject || subjects[0];
    // Split multi-clause commit messages ("A, B, fix C") into separate
    // changelog bullets — the banner only shows the first 2.
    const parts = subject.split(/,\s+|;\s+/).map(s => s.trim()).filter(Boolean);
    return { changelog: parts.length ? parts : [subject], foundReal: !!realSubject };
  } catch (e) {
    // Never fail the build over this — degrade to a generic message, and
    // don't notify (no reliable signal that this is a real, describable change).
    console.warn('[gen-version] git log unavailable, falling back to generic message:', e.message);
    return { changelog: ['New update available'], foundReal: false };
  }
}

function findBundleFile() {
  try {
    const files = readdirSync(ASSETS_DIR);
    const jsBundle = files.find(f => /^index-.*\.js$/.test(f));
    if (!jsBundle) throw new Error('no index-*.js found in dist/assets');
    return jsBundle;
  } catch (e) {
    console.warn('[gen-version] could not read dist/assets, bundleFile will be empty:', e.message);
    return '';
  }
}

const now = new Date();
const version = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
const bundleFile = findBundleFile();
const { changelog, foundReal } = buildChangelog();

const output = {
  version,
  bundleFile,
  changelog,
  notifyUsers: foundReal,
};

writeFileSync(PUBLIC_OUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`[gen-version] Wrote ${PUBLIC_OUT_PATH}:`, output);

// dist/ should already exist (vite build ran first) — but guard anyway
// rather than assume, since a missing dist/ would otherwise throw here and
// this script's whole point is to never fail the build.
if (!existsSync(join(__dirname, '..', 'dist'))) {
  mkdirSync(join(__dirname, '..', 'dist'), { recursive: true });
}
writeFileSync(DIST_OUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`[gen-version] Wrote ${DIST_OUT_PATH} (the actual deployed static file)`);
