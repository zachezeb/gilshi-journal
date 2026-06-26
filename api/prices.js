// Serverless proxy → Undermine Exchange (key hidden server-side, no CORS).
// Key lives ONLY in Vercel env var UE_API_KEY.
//
// IMPORTANT: WoW herbs/flasks/potions are COMMODITIES. UE's free "now" item
// endpoints are non-commodity only (they 404 for commodities). The free
// endpoint that covers commodities region-wide is Daily Item Detail:
//   /v1/region/:region/items/:itemId/daily.json
//   → { result: { daily: [ {day, price, quantity}, ... ] } }  (price in copper)
// We take the most recent day's price. A day old, but free, region-wide, and
// correct for commodities. Items never listed simply have no data → app uses
// its own estimate for those.
//
// &debug=1 returns a trace of what was tried + what came back.

const UE_BASE = "https://api.undermine.exchange";
const toGold = (c) => (typeof c === "number" ? c / 10000 : null);

export default async function handler(req, res) {
  const key = process.env.UE_API_KEY;
  if (!key) return res.status(500).json({ error: "UE_API_KEY not set on the server" });

  const region = (req.query.region || "us").toString().toLowerCase();
  const debug = req.query.debug === "1";
  const ids = (req.query.ids || "").toString().split(",").map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return res.status(400).json({ error: "no item ids provided" });

  const headers = { Authorization: "ApiKey " + key, "Accept-Encoding": "gzip" };
  const out = {};
  const meta = {};      // id → {price, day} for debug/quantity context
  const trace = [];

  async function fetchOne(id) {
    const path = "/v1/region/" + region + "/items/" + id + "/daily.json";
    try {
      const r = await fetch(UE_BASE + path, { headers });
      if (debug) trace.push({ id, path, status: r.status });
      if (!r.ok) return;
      const d = await r.json();
      const days = d?.result?.daily;
      if (Array.isArray(days) && days.length) {
        // most recent day with a usable price
        for (let i = days.length - 1; i >= 0; i--) {
          if (days[i] && days[i].price != null) {
            const g = toGold(days[i].price);
            if (g != null) { out[id] = g; meta[id] = { day: days[i].day, qty: days[i].quantity }; if (debug) trace.push({ id, gotGold: g, day: days[i].day }); }
            break;
          }
        }
      }
    } catch (e) { if (debug) trace.push({ id, path, error: String(e).slice(0,120) }); }
  }

  // modest parallel batches (each call costs ~5 points; 3,000/hr budget)
  const BATCH = 5;
  for (let i = 0; i < ids.length; i += BATCH) {
    await Promise.all(ids.slice(i, i + BATCH).map(fetchOne));
  }

  if (debug) return res.status(200).json({ prices: out, meta, trace });
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
  return res.status(200).json(out);
}
