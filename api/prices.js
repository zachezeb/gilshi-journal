// Serverless proxy → Undermine Exchange (key hidden server-side, no CORS).
// Key lives ONLY in Vercel env var UE_API_KEY.
//
// Correct paths (from UE docs):
//   Region item summary:  /v1/region/:region/items.json   → {result:{items:{id:{median,min}}}}
//   Now item detail:      /v1/region/:region/items/:id/now.json  (note: plural "items" + ".json")
// Prices are copper → convert to gold. Items not currently on the AH simply
// won't be present; the app falls back to its estimate for those.
//
// &debug=1 returns a trace of what was tried + what came back.

const UE_BASE = "https://api.undermine.exchange";
const toGold = (c) => (typeof c === "number" ? c / 10000 : null);

export default async function handler(req, res) {
  const key = process.env.UE_API_KEY;
  if (!key) return res.status(500).json({ error: "UE_API_KEY not set on the server" });

  const region = (req.query.region || "us").toString().toLowerCase();
  const realm = (req.query.realm || "moon-guard").toString().toLowerCase();
  const debug = req.query.debug === "1";
  const ids = (req.query.ids || "").toString().split(",").map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return res.status(400).json({ error: "no item ids provided" });

  const headers = { Authorization: "ApiKey " + key, "Accept-Encoding": "gzip" };
  const out = {};
  const trace = [];

  // helper: extract a usable copper price from various result shapes
  const priceFrom = (result) => {
    if (!result) return null;
    if (Array.isArray(result)) {            // now-detail returns an array per realm-group
      let best = null;
      for (const row of result) if (row && row.price != null) best = best == null ? row.price : Math.min(best, row.price);
      return best;
    }
    if (result.price != null) return result.price;
    if (result.median != null) return result.median;
    if (result.min != null) return result.min;
    return null;
  };

  // 1) one region-wide summary call → covers many items at once
  try {
    const url = UE_BASE + "/v1/region/" + region + "/items.json";
    const r = await fetch(url, { headers });
    if (debug) trace.push({ step: "summary", path: "/v1/region/" + region + "/items.json", status: r.status });
    if (r.ok) {
      const d = await r.json();
      const items = d?.result?.items || {};
      for (const id of ids) {
        const row = items[id];
        const g = toGold(priceFrom(row));
        if (g != null) out[id] = g;
      }
      if (debug) trace.push({ step: "summary", matched: Object.keys(out).length });
    }
  } catch (e) { if (debug) trace.push({ step: "summary", error: String(e).slice(0,120) }); }

  // 2) per-item "now" for anything still missing — CORRECT spelling: items/.../now.json
  const missing = ids.filter(id => out[id] == null);
  async function fetchOne(id) {
    const paths = [
      "/v1/region/" + region + "/items/" + id + "/now.json",
      "/v1/region/" + region + "/realm/" + realm + "/items/" + id + "/now.json",
    ];
    for (const p of paths) {
      try {
        const r = await fetch(UE_BASE + p, { headers });
        if (debug) trace.push({ id, path: p, status: r.status });
        if (!r.ok) continue;
        const d = await r.json();
        const g = toGold(priceFrom(d?.result));
        if (g != null) { out[id] = g; if (debug) trace.push({ id, gotGold: g }); return; }
      } catch (e) { if (debug) trace.push({ id, path: p, error: String(e).slice(0,120) }); }
    }
  }
  const BATCH = 5;
  for (let i = 0; i < missing.length; i += BATCH) {
    await Promise.all(missing.slice(i, i + BATCH).map(fetchOne));
  }

  if (debug) return res.status(200).json({ prices: out, trace });
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
  return res.status(200).json(out);
}
