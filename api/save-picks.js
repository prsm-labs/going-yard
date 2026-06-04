// api/save-picks.js
import { Redis } from '@upstash/redis';
import { createClerkClient } from '@clerk/backend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const payload = await clerk.verifyToken(token);
    const userId = payload.sub;
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const redis = new Redis({
      url: process.env.UPSTASH_KV_REST_API_URL,
      token: process.env.UPSTASH_KV_REST_API_TOKEN,
    });

    const { picks } = req.body;
    if (!picks || typeof picks !== 'object') return res.status(400).json({ error: 'Invalid picks' });

    await redis.set(`picks:${userId}`, JSON.stringify(picks));
    console.log(`[GY] Saved picks for ${userId}:`, Object.keys(picks).length, 'items');
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[GY] save-picks error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
