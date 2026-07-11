// going-yard/scripts/gen-version.js
// Runs before `vite build` (see package.json "build" script). Generates
// public/version.json from the latest git commit so the in-app update
// banner always shows accurate, current release notes with zero manual
// maintenance. Previously version.json was hand-edited and had gone stale
// since July 7 2026 — the banner correctly detected every new deploy
// (fixed separately in api/version.js) but kept showing the same old
// changelog text regardless of what actually shipped.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'version.json');

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

const now = new Date();
const version = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;

const output = {
  version,
  changelog: buildChangelog(),
  notifyUsers: true,
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`[gen-version] Wrote ${OUT_PATH}:`, output);
