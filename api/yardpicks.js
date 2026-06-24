// api/yardpicks.js — Notion database proxy for the Yard Picks feed
// Keeps NOTION_TOKEN server-side only (never sent to the browser).
// Queries the Yard Picks database and returns a simplified, feed-ready
// JSON shape: newest-first, only the fields the card UI needs.
//
// Required Vercel environment variables (set in the dashboard, NOT in
// this file and NOT in auth.env — that file is for the Python scripts):
//   NOTION_TOKEN                    — same integration token as DC Picks
//   YARD_PICKS_NOTION_DATABASE_ID   — 389d3461384880f1bce0e9dd1556e9a5

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = process.env.YARD_PICKS_NOTION_DATABASE_ID;

  if (!NOTION_TOKEN || !DATABASE_ID) {
    return res.status(500).json({ error: 'Missing NOTION_TOKEN or YARD_PICKS_NOTION_DATABASE_ID env vars' });
  }

  try {
    const { cursor, pageSize } = req.query;
    const pageSizeNum = Math.min(parseInt(pageSize) || 25, 100);

    const body = {
      page_size: pageSizeNum,
      // No sorts/filter sent to Notion here on purpose — a sort or filter
      // referencing a property that doesn't exist (or is named slightly
      // differently than expected, e.g. "Archived" was listed as optional
      // in setup) makes Notion reject the ENTIRE query, not just that
      // clause. Sorting and the Archived filter are applied client-side
      // below instead, so this call can never 500 due to a property
      // name mismatch.
    };
    if (cursor) body.start_cursor = cursor;

    const notionRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${NOTION_TOKEN}`,
        'Content-Type':   'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(body),
    });

    if (!notionRes.ok) {
      const errText = await notionRes.text();
      throw new Error(`Notion ${notionRes.status}: ${errText.slice(0, 300)}`);
    }

    const data = await notionRes.json();

    // Flatten each Notion page into a simple, feed-ready object.
    const picks = (data.results || []).map(page => {
      const p = page.properties || {};

      const title = p['Slip']?.title?.[0]?.plain_text || '';
      const date  = p['Date']?.date?.start || null;
      const estPostTime  = p['Est. Post Time']?.rich_text?.[0]?.plain_text || '';
      const gamblyLink    = p['Gambly Link']?.url || null;
      const postTimestamp = p['Post Timestamp']?.date?.start || null;
      const slipNumber    = p['Slip #']?.number ?? null;
      const serialNumber  = p['Serial #']?.rich_text?.[0]?.plain_text || '';
      // The "Archived" checkbox property was renamed to a blank label in
      // Notion, so it no longer appears under the key "Archived" in the
      // API response. Find it by TYPE instead — this database has only
      // one checkbox property, so scanning for `type === 'checkbox'` is
      // reliable regardless of what the property is currently named.
      const checkboxEntry = Object.values(p).find(prop => prop?.type === 'checkbox');
      const archived = checkboxEntry?.checkbox || false;

      // Image property: Notion "Files & media" can hold an uploaded file
      // OR an external URL. The pipeline notes say images are stored as
      // external links (ImgBB), so prefer `external.url`, fall back to
      // Notion's own hosted `file.url` just in case.
      const imageFile = p['Image']?.files?.[0] || null;
      const imageUrl  = imageFile?.external?.url || imageFile?.file?.url || null;

      return {
        id: page.id,
        title,
        date,
        estPostTime,
        gamblyLink,
        postTimestamp,
        slipNumber,
        serialNumber,
        archived,
        imageUrl,
      };
    });

    // Client-side sort (newest first) — falls back to `date` if a row has
    // no Post Timestamp value, so a few blank rows don't break ordering.
    picks.sort((a, b) => {
      const ta = new Date(a.postTimestamp || a.date || 0).getTime();
      const tb = new Date(b.postTimestamp || b.date || 0).getTime();
      return tb - ta;
    });

    // Client-side filter — hide archived picks. Since `archived` already
    // safely defaults to false when the property doesn't exist, this is
    // a no-op (shows everything) on databases that never added the
    // optional Archived checkbox.
    const visiblePicks = picks.filter(p => !p.archived);

    res.status(200).json({
      picks: visiblePicks,
      hasMore:   !!data.has_more,
      nextCursor: data.next_cursor || null,
    });

  } catch (err) {
    console.error('[YardPicks] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
