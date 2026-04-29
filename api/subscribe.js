// api/subscribe.js
// Saves a push subscription to Upstash Redis
// Called by the browser when user taps the 🔔 bell and grants permission

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

    // Create a short unique key from the endpoint URL
    const key = 'sub:' + Buffer.from(subscription.endpoint).toString('base64').slice(0, 40);

    // Save to Upstash Redis
    const upstashUrl   = process.env.KV_REST_API_URL;
    const upstashToken = process.env.KV_REST_API_TOKEN;

    if (!upstashUrl || !upstashToken) {
      console.warn('[Push] Upstash not configured — subscription not saved');
      return res.status(200).json({ ok: true, note: 'Upstash not configured' });
    }

    const r = await fetch(`${upstashUrl}/set/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(subscription)),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('[Push] Upstash save failed:', err);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    console.log('[Push] Subscription saved:', subscription.endpoint.slice(0, 60));
    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error('[Push] subscribe error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
