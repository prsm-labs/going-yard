// api/notify.js
// Sends a push notification to all subscribed devices

import webpush from 'web-push';
import { Redis } from '@upstash/redis';

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@goingyard.app'),
  process.env.VAPID_PUBLIC_KEY  || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Verify secret
  if (req.body?.secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title = '⚾ Going Yard', body = "Check today's picks", url = '/' } = req.body;

  try {
    const redis = Redis.fromEnv();

    // Get all subscription keys
    const keys = await redis.keys('sub:*');

    if (!keys || keys.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, note: 'No subscribers yet' });
    }

    const payload = JSON.stringify({ title, body, url });
    let sent = 0, failed = 0;

    await Promise.all(keys.map(async (key) => {
      try {
        const subStr = await redis.get(key);
        if (!subStr) return;
        const sub = typeof subStr === 'string' ? JSON.parse(subStr) : subStr;
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        failed++;
        // Remove expired/invalid subscriptions
        if (e.statusCode === 410 || e.statusCode === 404) {
          await redis.del(key).catch(() => {});
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
