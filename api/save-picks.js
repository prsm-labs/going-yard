// api/save-picks.js
// Saves the picks for the authenticated Clerk user

import { Redis } from '@upstash/redis';
import { createClerkClient } from '@clerk/backend';

const redis = Redis.fromEnv();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Get session token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    // Verify with Clerk and get user ID
    const payload = await clerk.verifyToken(token);
    const userId = payload.sub;
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    // Save picks to Upstash Redis (no expiry — persists forever)
    const { picks } = req.body;
    if (typeof picks !== 'object') return res.status(400).json({ error: 'Invalid picks data' });

    await redis.set(`picks:${userId}`, picks);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('save-picks error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
