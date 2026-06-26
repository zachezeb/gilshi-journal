// Serverless proxy -> Undermine Exchange (key hidden server-side, no CORS).
// Key lives ONLY in Vercel env var UE_API_KEY.
//
// WoW herbs/flasks/potions are COMMODITIES. UE's free per-item "now" endpoints
// are non-commodity only. The free, region-wide, commodity-correct endpoint is
// Daily Item Detail:  /v1/region/:region/items/:itemId/daily.json
//   -> { result: { daily: [ {day, price, quantity}, ... ] } }   (copper)
// We take the most recent day's price.
//
// Hardened: every item is wrapped so one bad response cannot crash the whole
// function. &debug=1 returns a trace incl. any per-item errors.

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

    async function fetchOne(id) {
      const path = "/v1/region/" + region + "/items/" + id + "/daily.json";
      try {
        const r = await fetch(UE_BASE + path, { headers });
        const status = r.status;
        if (!r.ok) { if (debug) trace.push({ id, status }); return; }
        let d = null;
        try { d = await r.json(); } catch (e) { if (debug) trace.push({ id, status, parse: "bad json" }); return; }
        const days = d && d.result && Array.isArray(d.result.daily) ? d.result.daily : null;
        if (!days || !days.length) { if (debug) trace.push({ id, status, note: "no daily array" }); return; }
        for (let i = days.length - 1; i >= 0; i--) {
          const row = days[i];
          if (row && row.price != null) {
            const g = toGold(row.price);
            if (g != null) { out[id] = g; if (debug) trace.push({ id, status, gotGold: g, day: row.day }); }
            return;
          }
        }
        if (debug) trace.push({ id, status, note: "no priced day" });
      } catch (e) {
        if (debug) trace.push({ id, error: String((e && e.message) || e).slice(0, 140) });
      }
    }

    const BATCH = 5;
    for (let i = 0; i < ids.length; i += BATCH) {
      await Promise.all(ids.slice(i, i + BATCH).map(fetchOne));
    }

    if (debug) return res.status(200).json({ prices: out, trace });
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json(out);
  } catch (e) {
    // never crash — report instead
    return res.status(200).json({ error: String((e && e.message) || e).slice(0, 200), prices: {} });
  }
}
