// api/get-picks.js
// Returns the saved picks for the authenticated Clerk user

import { Redis } from '@upstash/redis';
import { createClerkClient } from '@clerk/backend';

const redis = Redis.fromEnv();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Get session token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    // Verify with Clerk and get user ID
    const payload = await clerk.verifyToken(token);
    const userId = payload.sub;
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    // Fetch picks from Upstash Redis
    const picks = await redis.get(`picks:${userId}`);
    return res.status(200).json({ picks: picks || {} });

  } catch (err) {
    console.error('get-picks error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
