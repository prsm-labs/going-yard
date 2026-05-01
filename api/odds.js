// api/odds.js  — The Odds API integration for Going Yard
// Cache lives in-memory for warm instances; falls back to live fetch on cold starts.
// Cron job pre-warms the cache but is NOT a hard dependency.

const CACHE_TTL_MS = 65 * 60 * 1000; // 65 minutes

let cache = null;       // { data, fetchedAt }
let inflight = null;    // Promise — prevents stampede on concurrent cold-starts

// ─── helpers ──────────────────────────────────────────────────────────────────

function isCacheValid() {
  return cache && (Date.now() - cache.fetchedAt) < CACHE_TTL_MS;
}

async function fetchFromOddsAPI() {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error("ODDS_API_KEY env var is not set");

  // Fetch MLB HR props from The Odds API
  // markets: batter_home_runs (player props)
  const url = new URL("https://api.the-odds-api.com/v4/sports/baseball_mlb/events");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("dateFormat", "iso");

  const eventsRes = await fetch(url.toString());
  if (!eventsRes.ok) {
    const errText = await eventsRes.text();
    throw new Error(`Events fetch failed ${eventsRes.status}: ${errText}`);
  }
  const events = await eventsRes.json();

  // For each event, fetch HR props
  const propsResults = await Promise.allSettled(
    events.map(async (event) => {
      const propUrl = new URL(
        `https://api.the-odds-api.com/v4/sports/baseball_mlb/events/${event.id}/odds`
      );
      propUrl.searchParams.set("apiKey", apiKey);
      propUrl.searchParams.set("regions", "us");
      propUrl.searchParams.set("markets", "batter_home_runs");
      propUrl.searchParams.set("oddsFormat", "american");
      propUrl.searchParams.set("dateFormat", "iso");

      const r = await fetch(propUrl.toString());
      if (!r.ok) return null;
      const d = await r.json();
      return {
        eventId:    event.id,
        homeTeam:   event.home_team,
        awayTeam:   event.away_team,
        commenceTime: event.commence_time,
        players:    buildPlayerProps(d.bookmakers || []),
      };
    })
  );

  const props = propsResults
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  return { events, props };
}

// Flatten bookmaker odds into per-player structures
function buildPlayerProps(bookmakers) {
  const playerMap = {};

  for (const bk of bookmakers) {
    for (const market of bk.markets || []) {
      if (market.key !== "batter_home_runs") continue;
      for (const outcome of market.outcomes || []) {
        const key = outcome.description; // player name
        if (!playerMap[key]) {
          playerMap[key] = {
            player:  outcome.description,
            market:  market.key,
            point:   outcome.point ?? 0.5,
            lines:   {},
          };
        }
        if (!playerMap[key].lines[bk.key]) {
          playerMap[key].lines[bk.key] = {};
        }
        // outcome.name is "Over" or "Under"
        playerMap[key].lines[bk.key][outcome.name.toLowerCase()] = outcome.price;
      }
    }
  }

  // Pick best available Over line across books
  return Object.values(playerMap).map((p) => {
    const overLines = Object.values(p.lines)
      .map((bk) => bk.over)
      .filter((v) => v !== undefined);

    // Best Over = highest american odds (least juice / most favorable)
    const bestOver = overLines.length
      ? Math.max(...overLines)
      : null;

    // Consensus implied probability
    const impliedProbs = overLines.map((o) =>
      o < 0 ? (-o) / (-o + 100) : 100 / (o + 100)
    );
    const avgImplied = impliedProbs.length
      ? impliedProbs.reduce((a, b) => a + b, 0) / impliedProbs.length
      : null;

    return {
      ...p,
      bestOver,
      avgImplied: avgImplied ? Math.round(avgImplied * 1000) / 10 : null, // e.g. 18.4%
      bookCount: overLines.length,
    };
  });
}

// ─── populate cache (with inflight guard) ─────────────────────────────────────

async function refreshCache() {
  if (inflight) return inflight; // already fetching — wait on same promise

  inflight = (async () => {
    try {
      const data = await fetchFromOddsAPI();
      cache = { data, fetchedAt: Date.now() };
      console.log(
        `[Odds] Cache refreshed — ${data.events.length} events, ` +
        `${data.props.reduce((s, e) => s + e.players.length, 0)} HR props`
      );
      return data;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

// ─── request handler ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const type = req.query.type || "props";

  // ── /api/odds?type=refresh  (called by cron + cron-job.org) ──────────────
  if (type === "refresh") {
    // Verify CRON_SECRET so random browsers can't hammer The Odds API
    const secret = process.env.CRON_SECRET;
    const auth   = req.headers.authorization || "";
    if (secret && auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const data = await refreshCache();
      return res.status(200).json({
        status:      "ok",
        eventsCount: data.events.length,
        propsCount:  data.props.reduce((s, e) => s + e.players.length, 0),
        fetchedAt:   cache?.fetchedAt,
      });
    } catch (err) {
      console.error("[Odds] Refresh failed:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── /api/odds?type=props  (called by the frontend) ───────────────────────
  if (type === "props") {
    try {
      // If cache is valid, return immediately
      if (isCacheValid()) {
        return res.status(200).json({
          status:    "ok",
          source:    "cache",
          fetchedAt: cache.fetchedAt,
          ...cache.data,
        });
      }

      // Cache cold or stale — fetch live right now (no more "not_cached"!)
      console.log("[Odds] Cache cold — fetching live from The Odds API...");
      const data = await refreshCache();

      return res.status(200).json({
        status:    "ok",
        source:    "live",
        fetchedAt: cache.fetchedAt,
        ...data,
      });
    } catch (err) {
      console.error("[Odds] Props fetch failed:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown type: ${type}` });
}
