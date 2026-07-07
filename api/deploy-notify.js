// api/deploy-notify.js
// POST { secret, changelog? } to notify all subscribers of a new version.
// Protected by NOTIFY_SECRET. Safe to call multiple times — dedup prevents
// duplicate notifications via Redis TTL on notif:{dedupKey}.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { secret, changelog } = req.body || {};
  if (secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const buildTime  = process.env.VITE_BUILD_TIME || String(Date.now());
  const dedupKey   = `build-${buildTime.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const changeText = Array.isArray(changelog) && changelog.length
    ? changelog.slice(0, 3).join(' · ')
    : 'New features and improvements are live.';

  try {
    const r = await fetch('https://yard.prsmlabs.app/api/notify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        title:    '🚀 Going Yard Updated',
        body:     changeText,
        url:      'https://yard.prsmlabs.app',
        dedupKey,
      }),
    });
    const data = await r.json();
    return res.json({ ok: true, dedupKey, notifyResult: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
