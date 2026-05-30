// api/rotowire.js — Vercel serverless proxy for RotoWire MLB RSS feed
// Free public RSS — no auth required. Proxied to bypass CORS.
// Returns parsed JSON array of recent MLB player news items.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const r = await fetch('https://www.rotowire.com/rss/news.php?sport=MLB', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoingYard/1.0)',
        'Accept': 'application/xml, text/xml, */*',
      },
    });

    if (!r.ok) return res.status(r.status).json({ error: `RotoWire returned ${r.status}` });

    const xml = await r.text();

    // Parse RSS XML — extract <item> elements
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const get = (tag) => {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return m ? (m[1] || m[2] || '').trim() : '';
      };

      const title    = get('title');
      const desc     = get('description');
      const pubDate  = get('pubDate');
      const link     = get('link');

      if (!title) continue;

      // Extract player name — RotoWire titles: "Firstname Lastname: [news]"
      const nameMatch = title.match(/^([A-Z][a-z'-]+ (?:[A-Z][a-z'-]+ )?[A-Z][a-z'-]+(?:\s[A-Z][a-z'-]+)?)\s*[:\-]/);
      const playerName = nameMatch ? nameMatch[1].trim() : null;

      // Determine injury/status from title + description
      const combined = (title + ' ' + desc).toLowerCase();
      const isInjury = /injur|strain|sprain|fracture|hamstring|oblique|shoulder|elbow|knee|wrist|ankle|back|il |injured list|day-to-day|dtd|out |placed on|disabled/.test(combined);
      const isReturn = /activated|reinstated|returns|cleared|off the il|back in/.test(combined);
      const isDTD    = /day-to-day|dtd/.test(combined);

      // Severity from keywords
      const emoji = (() => {
        if (isReturn)                           return '✅';
        if (/fracture|tear|surgery|broken/.test(combined)) return '🚫';
        if (/60.day/.test(combined))            return '🚫';
        if (/15.day|10.day|il/.test(combined))  return '🤕';
        if (isDTD)                              return '⚠️';
        if (isInjury)                           return '🤕';
        return null;
      })();

      items.push({
        playerName,
        title,
        desc,
        pubDate,
        link,
        isInjury,
        isReturn,
        isDTD,
        emoji,
        ts: pubDate ? new Date(pubDate).getTime() : 0,
      });
    }

    // Sort newest first
    items.sort((a, b) => b.ts - a.ts);

    // Cache 10 minutes — RotoWire updates frequently
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
    res.status(200).json({ items, count: items.length, updated: new Date().toISOString() });

  } catch (err) {
    console.error('[rotowire proxy]', err.message);
    res.status(500).json({ error: err.message });
  }
}
