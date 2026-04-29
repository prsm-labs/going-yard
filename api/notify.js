// api/notify.js
// Sends a push notification to all subscribed devices
// Called by the browser (live alerts) or your pipeline (scheduled alerts)

import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'you@example.com'),
  process.env.VAPID_PUBLIC_KEY  || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Verify secret so only your app/pipeline can trigger notifications
  if (req.body?.secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    title = '⚾ Going Yard',
    body  = "Check today's picks",
    url   = '/',
  } = req.body;

  const upstashUrl   = process.env.KV_REST_API_URL;
  const upstashToken = process.env.KV_REST_API_TOKEN;

  if (!upstashUrl || !upstashToken) {
    return res.status(200).json({ ok: true, sent: 0, note: 'Upstash not configured' });
  }

  try {
    // Get all subscription keys from Upstash
    const keysRes = await fetch(`${upstashUrl}/keys/sub:*`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    const keysData = await keysRes.json();
    const keys = keysData.result || [];

    if (keys.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, note: 'No subscribers' });
    }

    const payload = JSON.stringify({ title, body, url });
    let sent = 0, failed = 0;

    await Promise.all(keys.map(async (key) => {
      try {
        // Get the subscription from Upstash
        const getRes = await fetch(`${upstashUrl}/get/${key}`, {
          headers: { Authorization: `Bearer ${upstashToken}` },
        });
        const getData = await getRes.json();
        if (!getData.result) return;

        const sub = JSON.parse(getData.result);
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        failed++;
        // Remove expired/invalid subscriptions automatically
        if (e.statusCode === 410 || e.statusCode === 404) {
          await fetch(`${upstashUrl}/del/${key}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${upstashToken}` },
          }).catch(() => {});
        }
      }
    }));

    console.log(`[Push] Sent: ${sent}, Failed: ${failed}`);
    return res.status(200).json({ ok: true, sent, failed });

  } catch (e) {
    console.error('[Push] notify error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
