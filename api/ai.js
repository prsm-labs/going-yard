// api/ai.js
// Serverless function — keeps ANTHROPIC_API_KEY server-side only
// Called by SimLabView for AI scout notes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured', text: 'Scout analysis unavailable — API key not set in Vercel environment variables.' });
  }

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI] Anthropic API error:', response.status, err);
      return res.status(200).json({ text: 'Scout analysis unavailable — API error.' });
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('').trim() || 'No analysis generated.';
    return res.status(200).json({ text });

  } catch (e) {
    console.error('[AI] Fatal:', e.message);
    return res.status(200).json({ text: 'Scout analysis unavailable — connection error.' });
  }
}
