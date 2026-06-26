// Serverless proxy: fetches live prices from Undermine Exchange server-side.
// The browser never sees the API key, and there's no CORS issue.
// The UE key lives ONLY in the Vercel env var UE_API_KEY — never in this file.
//
// Strategy (kind to UE's 3,000-points/hour budget):
//   1) One region-wide summary call to get every non-commodity item at once.
//   2) For any requested id still missing (e.g. commodities), fall back to
//      the per-item "now" endpoint in small parallel batches.
// Anything UE doesn't have is simply omitted; the app falls back to its
// own labeled estimate for those ids.

const UE_BASE = "https://api.undermine.exchange";
const toGold = (copper) => (typeof copper === "number" ? copper / 10000 : null);

export default async function handler(req, res) {
  const key = process.env.UE_API_KEY;
  if (!key) return res.status(500).json({ error: "UE_API_KEY not set on the server" });

  const region = (req.query.region || "us").toString().toLowerCase();
  const realm = (req.query.realm || "moon-guard").toString().toLowerCase();
  const ids = (req.query.ids || "").toString().split(",").map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return res.status(400).json({ error: "no item ids provided" });

  const headers = { Authorization: "ApiKey " + key, "Accept-Encoding": "gzip" };
  const out = {};

  // 1) region-wide summary: one call, returns { itemId: {median,min,realms} }
  try {
    const r = await fetch(UE_BASE + "/v1/region/" + region + "/items.json", { headers });
    if (r.ok) {
      const d = await r.json();
      const items = d?.result?.items || {};
      for (const id of ids) {
        const row = items[id];
        if (row) {
          // prefer the median (typical sale) but fall back to min
          const copper = (row.median != null ? row.median : row.min);
          const g = toGold(copper);
          if (g != null) out[id] = g;
        }
      }
    }
  } catch (e) { /* fall through to per-item */ }

  // 2) per-item fallback for anything still missing (commodities, etc.)
  const missing = ids.filter(id => out[id] == null);
  async function fetchOne(id) {
    // try region-wide commodity price, then per-realm, whichever answers
    const urls = [
      UE_BASE + "/v1/region/" + region + "/item/" + id + "/now",
      UE_BASE + "/v1/region/" + region + "/realm/" + realm + "/item/" + id + "/now",
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers });
        if (!r.ok) continue;
        const d = await r.json();
        const copper = d?.result?.price != null ? d.result.price
                     : d?.result?.median != null ? d.result.median
                     : d?.result?.min;
        const g = toGold(copper);
        if (g != null) { out[id] = g; return; }
      } catch (e) { /* try next url */ }
    }
  }
  const BATCH = 6;
  for (let i = 0; i < missing.length; i += BATCH) {
    await Promise.all(missing.slice(i, i + BATCH).map(fetchOne));
  }

  // edge-cache 30 min so page loads don't hammer UE
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
  return res.status(200).json(out);
}
