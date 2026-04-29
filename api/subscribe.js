// api/subscribe.js
// Saves a push subscription to Upstash Redis

import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'No subscription provided' });
    }

    const redis = Redis.fromEnv();

    // Use endpoint as key (base64 encoded, trimmed)
    const key = 'sub:' + Buffer.from(subscription.endpoint).toString('base64').slice(0, 40);
    await redis.set(key, JSON.stringify(subscription));

    console.log('[Push] Subscription saved:', subscription.endpoint.slice(0, 60));
    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error('[Push] subscribe error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
