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
      // Sort by Post Timestamp descending — newest pick first. This MUST
      // match the real Notion property name exactly ("Post Timestamp"),
      // since Notion errors on an unrecognized sort key rather than
      // silently ignoring it.
      sorts: [{ property: 'Post Timestamp', direction: 'descending' }],
      // Optional: only show picks not marked Archived. Comment out the
      // filter block below if you want every row regardless of that flag.
      filter: {
        property: 'Archived',
        checkbox: { equals: false },
      },
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
      const relativeTime = p['Relative Time']?.rich_text?.[0]?.plain_text || '';
      const gamblyLink    = p['Gambly Link']?.url || null;
      const postTimestamp = p['Post Timestamp']?.date?.start || null;
      const slipNumber    = p['Slip #']?.number ?? null;
      const serialNumber  = p['Serial #']?.rich_text?.[0]?.plain_text || '';
      const archived       = p['Archived']?.checkbox || false;

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
        relativeTime,
        gamblyLink,
        postTimestamp,
        slipNumber,
        serialNumber,
        archived,
        imageUrl,
      };
    });

    res.status(200).json({
      picks,
      hasMore:   !!data.has_more,
      nextCursor: data.next_cursor || null,
    });

  } catch (err) {
    console.error('[YardPicks] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
