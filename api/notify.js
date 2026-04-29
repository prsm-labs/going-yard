// api/notify.js
// Sends push notifications — with per-type server-side deduplication

import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@goingyard.app'),
  process.env.VAPID_PUBLIC_KEY  || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL   || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

async function redisCmd(...args) {
  try {
    const r = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    return (await r.json()).result;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (req.body?.secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    title = '⚾ Going Yard',
    body  = "Check today's picks",
    url   = '/',
    dedupKey: customDedupKey, // optional caller-supplied dedup key
  } = req.body;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(200).json({ ok: true, sent: 0, note: 'Upstash not configured' });
  }

  // ── Deduplication ────────────────────────────────────────────────────────
  // Use caller-supplied key if provided, otherwise derive from title+body
  // TTL: 86400s (24h) — same alert won't fire twice in the same day
  const dedupKey = customDedupKey
    ? `notif:${customDedupKey}`
    : `notif:${Buffer.from(title + body).toString('base64').slice(0, 40)}`;

  const alreadySent = await redisCmd('GET', dedupKey);
  if (alreadySent) {
    console.log(`[Push] Suppressed duplicate: ${title}`);
    return res.status(200).json({ ok: true, sent: 0, note: 'Duplicate suppressed' });
  }

  // Mark as sent for 24 hours before sending — prevents race conditions
  await redisCmd('SET', dedupKey, '1', 'EX', 86400);

  try {
    const keys = await redisCmd('KEYS', 'sub:*');
    if (!keys || keys.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, note: 'No subscribers' });
    }

    const payload = JSON.stringify({ title, body, url });
    let sent = 0, failed = 0;

    await Promise.all(keys.map(async (key) => {
      try {
        const subStr = await redisCmd('GET', key);
        if (!subStr) return;
        const sub = typeof subStr === 'string' ? JSON.parse(subStr) : subStr;
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        failed++;
        if (e.statusCode === 410 || e.statusCode === 404) {
          await redisCmd('DEL', key).catch(() => {});
        }
      }
    }));

    console.log(`[Push] Sent: ${sent}, Title: ${title}`);
    return res.status(200).json({ ok: true, sent, failed });

  } catch (e) {
    console.error('[Push] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
