// Serverless proxy → Undermine Exchange, server-side (key hidden, no CORS).
// The UE key lives ONLY in the Vercel env var UE_API_KEY.
//
// Key fact: WoW herbs/flasks/potions are COMMODITIES — priced region-wide,
// not per-realm. So we query the region "now" price for each id. We try a few
// documented path shapes and use whichever returns a price (copper → gold).
//
// Add &debug=1 to the request to get a readout of which paths were tried and
// what each returned — useful for diagnosing without guessing.

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

  // candidate path shapes for a single item's current price, region-wide
  // (commodity) first, then region+realm (non-commodity) as a fallback.
  const candidates = (id) => [
    "/v1/region/" + region + "/item/" + id + "/now",
    "/region/" + region + "/item/" + id + "/now",
    "/v1/region/" + region + "/realm/" + realm + "/item/" + id + "/now",
    "/region/" + region + "/realm/" + realm + "/item/" + id + "/now",
  ];

  async function fetchOne(id) {
    for (const path of candidates(id)) {
      const url = UE_BASE + path;
      try {
        const r = await fetch(url, { headers });
        if (debug) trace.push({ id, path, status: r.status });
        if (!r.ok) continue;
        const d = await r.json();
        const c = d?.result?.price != null ? d.result.price
                : d?.result?.median != null ? d.result.median
                : d?.result?.min;
        if (c != null) { out[id] = toGold(c); if (debug) trace.push({ id, path, gotPrice: c }); return; }
      } catch (e) {
        if (debug) trace.push({ id, path, error: String(e).slice(0, 120) });
      }
    }
  }

  const BATCH = 5;
  for (let i = 0; i < ids.length; i += BATCH) {
    await Promise.all(ids.slice(i, i + BATCH).map(fetchOne));
  }

  if (debug) return res.status(200).json({ prices: out, trace });
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
  return res.status(200).json(out);
}
