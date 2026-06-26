// Serverless proxy -> Undermine Exchange (key hidden server-side, no CORS).
// Key lives ONLY in Vercel env var UE_API_KEY.
//
// THE KEY INSIGHT: herbs/flasks/potions are COMMODITIES and live on a SEPARATE
// part of UE's API from regular items. One free call returns ALL of them:
//   /v1/region/:region/commodities.json
//   -> { result: { commodities: { "236761": {item, price, quantity}, ... } } }
// price is in copper. We pull every requested id out of that single response.
// For anything not a commodity, we fall back to the non-commodity item "now".
//
// Fully hardened: cannot crash; &debug=1 returns a trace.

const UE_BASE = "https://api.undermine.exchange";
const toGold = (c) => (typeof c === "number" && isFinite(c) ? c / 10000 : null);

export default async function handler(req, res) {
  try {
    const key = process.env.UE_API_KEY;
    if (!key) return res.status(200).json({ error: "UE_API_KEY not set on the server", prices: {} });

    const q = req.query || {};
    const region = String(q.region || "us").toLowerCase();
    const debug = String(q.debug || "") === "1";
    const ids = String(q.ids || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.status(200).json({ error: "no item ids provided", prices: {} });

    const headers = { Authorization: "ApiKey " + key, "Accept-Encoding": "gzip" };
    const out = {};
    const trace = [];

    // 1) ONE call gets every commodity price for the region
    try {
      const url = UE_BASE + "/v1/region/" + region + "/commodities.json";
      const r = await fetch(url, { headers });
      if (debug) trace.push({ step: "commodities", status: r.status });
      if (r.ok) {
        const d = await r.json();
        const comm = d && d.result && d.result.commodities ? d.result.commodities : {};
        for (const id of ids) {
          const row = comm[id];
          if (row && row.price != null && (row.quantity == null || row.quantity > 0)) {
            const g = toGold(row.price);
            if (g != null) out[id] = g;
          }
        }
        if (debug) trace.push({ step: "commodities", matched: Object.keys(out).length });
      }
    } catch (e) {
      if (debug) trace.push({ step: "commodities", error: String((e && e.message) || e).slice(0, 140) });
    }

    // 2) fallback: non-commodity items (e.g. a bound-on-equip reagent) via "now"
    const missing = ids.filter((id) => out[id] == null);
    async function fetchItem(id) {
      const path = "/v1/region/" + region + "/items/" + id + "/now.json";
      try {
        const r = await fetch(UE_BASE + path, { headers });
        if (debug) trace.push({ id, itemStatus: r.status });
        if (!r.ok) return;
        const d = await r.json();
        const arr = d && Array.isArray(d.result) ? d.result : null;
        if (arr && arr.length) {
          let best = null;
          for (const row of arr) if (row && row.price != null) best = best == null ? row.price : Math.min(best, row.price);
          const g = toGold(best);
          if (g != null) out[id] = g;
        }
      } catch (e) { if (debug) trace.push({ id, itemError: String((e && e.message) || e).slice(0, 120) }); }
    }
    const BATCH = 5;
    for (let i = 0; i < missing.length; i += BATCH) {
      await Promise.all(missing.slice(i, i + BATCH).map(fetchItem));
    }

    if (debug) return res.status(200).json({ prices: out, updated: Date.now(), trace });
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json({ prices: out, updated: Date.now(), realm: req.query.realm || null });
  } catch (e) {
    return res.status(200).json({ error: String((e && e.message) || e).slice(0, 200), prices: {} });
  }
}
