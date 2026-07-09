import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ════════════════════════════════════════════════════════════════
   ALCHEMATE — a pressed-herb book for the working alchemist
   Illustration-forward. Drawings & visual data carry the meaning;
   words kept to herbarium-tag brevity.
   APP-READY: live data routes through CONFIG + fetchPrices/fetchCharacter.
   ════════════════════════════════════════════════════════════════ */

const CONFIG = {
  ue:   { enabled: true, base: "https://api.undermine.exchange", region: "us", realm: "moon-guard", apiKey: "" },
  bnet: { enabled: false, clientId: "", redirectUri: "", region: "us", realm: "moon-guard", character: "gilshi" },
};

const C = {
  // foxed field-journal paper (deeper & warmer than the old herbarium cream)
  paper: "#e7d9bb", paperHi: "#f0e7ce", paperDeep: "#dccdaa", paperEdge: "#d3c4a3", card: "#ecdfc2",
  paperLo: "#d8c8a3", foxing: "#c4b08a",
  ink: "#2a2017", inkSoft: "#574838", inkFaint: "#897962",
  rule: "#b6a684", ruleSoft: "#cabfa1",
  sanguine: "#9c4a3c", verdigris: "#6b7d4e", sage: "#8a9c72", lotus: "#9c6a82",
  ochre: "#c19a45", ochreDeep: "#9a7833", ink2: "#46627a", plum: "#7d6a9c", wax: "#9a3f38",
  green: "#6b7d4e", greenDk: "#4a5733",
  // the physical book
  cover: "#5e4632", coverDk: "#3a2a1c", candle: "#f3c87a",
  tape: "rgba(206,196,168,0.55)", thread: "#9c4a3c",
};
const DISPLAY = "'Hoefler Text','Baskerville','Garamond','Times New Roman',serif";
const BODY = "'Iowan Old Style','Palatino Linotype','Palatino',Georgia,serif";
const HAND = "'Segoe Script','Bradley Hand','Brush Script MT',cursive";

/* ── DATA ───────────────────────────────────────────────────── */
let HERBS = [
  { id:236761, gid:236767, name:"Tranquility Bloom", latin:"Flos tranquillitatis", no:"01", role:"common potion base", tier:"common", est:8,  vel:10, color:C.sage },
  { id:236776, gid:236777, name:"Argentleaf",        latin:"Folium argenteum",     no:"02", role:"flask reagent",       tier:"common", est:14, vel:8,  color:C.verdigris },
  { id:236774, gid:236775, name:"Azeroot",           latin:"Radix azerothi",       no:"03", role:"potion base",         tier:"common", est:9,  vel:7,  color:C.verdigris },
  { id:236778, gid:236779, name:"Mana Lily",         latin:"Lilium manae",         no:"04", role:"inscription & potions",tier:"common", est:11, vel:8,  color:C.ink2 },
  { id:236770, gid:236771, name:"Sanguithorn",       latin:"Spina sanguinea",      no:"05", role:"flask reagent",       tier:"uncommon",est:22, vel:6,  color:C.sanguine },
  { id:236780, name:"Nocturnal Lotus",   latin:"Lotus nocturna",       no:"06", role:"rare flask gate · gathered by chance",tier:"premium",est:180,vel:4,color:C.lotus },
];
let HERB = id => HERBS.find(h=>h.id===id);

// non-herb crafting reagents that carry a real AH cost: the four motes + the vial.
// these are priced live alongside herbs so craft margins include them.
let REAGENTS = [
  { id:240990, name:"Sunglass Vial",          short:"Vial",  est:3,   color:C.ochre, kind:"vial" },
  { id:236949, name:"Mote of Light",          short:"Light", est:2,   color:C.ochre, kind:"mote" },
  { id:236950, name:"Mote of Primal Energy",  short:"Primal",est:6,   color:C.verdigris, kind:"mote" },
  { id:236951, name:"Mote of Wild Magic",     short:"Wild",  est:5,   color:C.sage, kind:"mote" },
  { id:236952, name:"Mote of Pure Void",      short:"Void",  est:9,   color:C.plum, kind:"mote" },
];
let REAGENT = id => REAGENTS.find(r=>r.id===id);
let MOTES = REAGENTS.filter(r=>r.kind==="mote"); // back-compat for any mote-only views
// resolve any material id (herb or reagent) to {name, est, ...} for cost math
let MAT = id => HERB(id) || REAGENT(id);

// FULL sellable catalog — the ranking engine scores every tradeable entry here.
// est/vel are realm estimates (clearly labeled in-app) until live UE data replaces them.
// ids are real where verified; placeholders resolve to real ids by name when hosted.
let PRODUCTS = [
  // ── Flasks (combat · one per secondary stat) ── mats ESTIMATED (wiki blocks recipe scrape)
  { id:241326, gid:241327, name:"Flask of the Shattered Sun",   cat:"Flask", kind:"flask", role:"Crit flask · flagship seller",  est:420, vel:9, v:false, mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6},{r:240990,q:2}], tradeable:true },
  { id:241322, gid:241323, name:"Flask of the Magisters",       cat:"Flask", kind:"flask", role:"Mastery · default healer flask", est:430, vel:9, v:false, mats:[{h:236780,q:1},{h:236770,q:8},{h:236778,q:6},{r:240990,q:2}], tradeable:true },
  { id:241325, gid:241324, name:"Flask of the Blood Knights",   cat:"Flask", kind:"flask", role:"Haste · often top DPS flask",    est:445, vel:8, v:false, mats:[{h:236780,q:1},{h:236770,q:6},{h:236776,q:8},{r:240990,q:2}], tradeable:true },
  { id:241320, gid:241321, name:"Flask of Thalassian Resistance",cat:"Flask",kind:"flask", role:"Vers · the base flask",          est:300, vel:5, v:false, mats:[{h:236774,q:8},{h:236776,q:6},{r:240990,q:2}], tradeable:true },
  { id:241332, name:"Vicious Thalassian Flask of Honor",         cat:"Flask", kind:"flask", role:"PvP · honor gains · Honor-bought recipe", est:120, vel:3, v:true, mats:[{h:236761,q:6},{h:236770,q:8},{h:236774,q:6},{r:240990,q:2}], tradeable:true },
  // ── Phials (profession stats) ── mats ESTIMATED
  { id:241311, name:"Haranir Phial of Finesse",     cat:"Phial", kind:"vial",  role:"gathering · sells to farmers",   est:75,  vel:5, v:false, mats:[{h:236774,q:3},{h:236778,q:2},{r:240990,q:1}], tradeable:true },
  { id:241312, name:"Haranir Phial of Ingenuity",   cat:"Phial", kind:"vial",  role:"crafting · sells to crafters",   est:80,  vel:5, v:false, mats:[{h:236770,q:3},{h:236778,q:2},{r:240990,q:1}], tradeable:true },
  { id:241317, name:"Haranir Phial of Perception",  cat:"Phial", kind:"vial",  role:"gathering · rare-find buff",     est:85,  vel:4, v:false, mats:[{h:236774,q:3},{h:236778,q:2},{r:240990,q:1}], tradeable:true },
  // ── Light potions ── VERIFIED from leveling guides
  { id:241309, name:"Light's Potential",            cat:"Light Potion", kind:"potion", role:"safe stat potion · bulk seller", est:55, vel:10, v:true,  mats:[{h:236761,q:8},{h:236774,q:3},{h:236776,q:3},{r:236949,q:1},{r:240990,q:5}], tradeable:true },
  { id:241296, gid:241297, name:"Potion of Zealotry",           cat:"Light Potion", kind:"potion", role:"Light combat variant",     est:48, vel:6, v:false, mats:[{h:236761,q:6},{h:236774,q:3},{r:240990,q:5}], tradeable:true },
  { id:241300, gid:241301, name:"Lightfused Mana Potion",       cat:"Light Potion", kind:"potion", role:"healer mana potion",       est:42, vel:8, v:true,  mats:[{h:236761,q:8},{h:236778,q:3},{r:240990,q:5}], tradeable:true },
  { id:241305, gid:241304, name:"Silvermoon Health Potion",     cat:"Light Potion", kind:"potion", role:"health · off combat CD",   est:30, vel:9, v:true,  mats:[{h:236761,q:6},{r:240990,q:5}], tradeable:true },
  { id:237055, name:"Refreshing Serum",             cat:"Light Potion", kind:"potion", role:"early utility · Stone mat", est:25, vel:4, v:true,  mats:[{h:236761,q:8},{h:236770,q:3},{r:240990,q:5}], tradeable:true },
  // ── Void potions ── Recklessness VERIFIED, others ESTIMATED
  { id:241332000, name:"Potion of Recklessness",    cat:"Void Potion", kind:"potion", role:"big stats, lose lowest · renown-gated", est:90, vel:4, v:true,  mats:[{h:236761,q:8},{h:236774,q:4},{r:236950,q:2},{r:240990,q:5}], tradeable:true },
  { id:241292, name:"Draught of Rampant Abandon",   cat:"Void Potion", kind:"potion", role:"more stats · puddle silences", est:70, vel:6, v:false, mats:[{h:236780,q:1},{h:236770,q:2},{r:240990,q:5}], tradeable:true },
  { id:241295, name:"Potion of Devoured Dreams",    cat:"Void Potion", kind:"potion", role:"void utility · risk/reward",   est:60, vel:4, v:false, mats:[{h:236770,q:3},{h:236778,q:2},{r:236952,q:1},{r:240990,q:5}], tradeable:true },
  { id:268954, gid:268955, name:"Entropic Extract",             cat:"Void Potion", kind:"potion", role:"early void leveling potion",   est:22, vel:3, v:true,  mats:[{h:236761,q:3},{r:240990,q:5}], tradeable:true },
  // ── Reagents / transmute products ──
  { id:237200, name:"Wondrous Synergist",           cat:"Reagent", kind:"vial", role:"daily · value unproven",      est:260, vel:2, v:false, mats:[{h:236780,q:1},{h:236776,q:5}], cooldown:"18h", tradeable:true },
  { id:237201, name:"Composite Flora",              cat:"Reagent", kind:"vial", role:"crafted reagent · feeds recipes", est:40, vel:5, v:true,  mats:[{h:236761,q:6},{h:236776,q:4},{r:236951,q:4},{r:236950,q:4}], tradeable:true },
  // ── Bound · never sold (listed, flagged) ──
  { id:237300, name:"Cauldron of Sin'dorei Flasks", cat:"Cauldron", kind:"cauldron", role:"raid utility · bound", est:null, vel:0, v:false, mats:[{h:236780,q:8},{h:236770,q:20},{h:236776,q:20}], tradeable:false },
];

// ── THE FULL ALCHEMY ENCYCLOPEDIA ──────────────────────────
// effect = what it does · tree/unlock/cost verified from Camberon's Cauldron tables
// bound: false=AH-tradeable, true=soulbound/warbound · mc: can Multicraft
let BOOK = [
  // ─ FLASKS (Thalassian combat · one per secondary stat · 1hr · persist through death) ─
  { cat:"Flask", name:"Flask of the Shattered Sun", effect:"+Critical Strike for 1 hr. Persists through death. The Crit flask.", tree:"Fluent in Flasks",
    unlock:"Craft Sin'dorei flasks 10×, then research: 5 Stabilized Derivate · 1 Nocturnal Lotus · 50 Moxie",
    mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6}], craftNote:"per-craft herb amounts derived from the bulk-leveling batch; an exact single-craft list isn't individually published", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of the Magisters", effect:"+Mastery for 1 hr. Persists through death. Default healer flask, highest healing.", tree:"Fluent in Flasks",
    unlock:"Craft Sin'dorei flasks 10×, then research: 50 Moxie",
    mats:[{h:236780,q:1},{h:236770,q:8},{h:236778,q:6}], craftNote:"plus ~2 Mote of Pure Void per craft; herb amounts derived from batch", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of the Blood Knights", effect:"+Haste for 1 hr. Persists through death. Often the top DPS flask.", tree:"Fluent in Flasks",
    unlock:"Drink a Flask of Thalassian Resistance to reveal it, then research: 50 Moxie",
    mats:[{h:236780,q:1},{h:236770,q:6},{h:236776,q:8}], craftNote:"plus ~2 Mote of Wild Magic per craft; herb amounts derived from batch", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of Thalassian Resistance", effect:"+Versatility for 1 hr. Persists through death. The base flask — taught by the spec, unlocks the others.", tree:"Fluent in Flasks",
    unlock:"Fluent in Flasks specialization node (no Camberon's research)",
    mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6}], craftNote:"this is the 'Sin'dorei flask' you craft 10× to reveal the others", bound:false, mc:true, kind:"flask" },
  // ─ FLASK CAULDRONS (bound · group) ─
  { cat:"Cauldron", name:"Cauldron of Sin'dorei Flasks", effect:"Place for the raid: members draw a Fleeting version of any of the 4 flasks (by their class/spec). 5 min, 40 charges.", tree:"Fluent in Flasks",
    unlock:"30 Knowledge in Fluent in Flasks",
    mats:[{h:236780,q:8},{h:236770,q:20},{h:236776,q:20}], craftNote:"plus ~100 Moxie; scales the single-flask recipe up for the whole raid", bound:true, mc:false, kind:"cauldron" },
  { cat:"Cauldron", name:"Voidlight Potion Cauldron", effect:"Place for the raid: members draw void combat potions. Bound utility.", tree:"Potion Prowess",
    unlock:"30 Knowledge in Potion Prowess",
    mats:[], craftNote:"~20 Stabilized Derivate + 75 Moxie + void-line herbs; exact per-craft list isn't published", bound:true, mc:false, kind:"cauldron" },
  // ─ PHIALS (Haranir · profession stats · 30 min · persist through death) ─
  { cat:"Phial", name:"Haranir Phial of Finesse", effect:"+Finesse & +Deftness (gathering) for 30 min. Persists through death. Sells to gatherers.", tree:"Fluent in Flasks",
    unlock:"Craft Haranir phials, research at Camberon's",
    mats:[{h:236774,q:3},{h:236778,q:2}], craftNote:"", bound:false, mc:true, kind:"vial" },
  { cat:"Phial", name:"Haranir Phial of Ingenuity", effect:"+Ingenuity & +Crafting Speed for 30 min. Persists through death. Sells to crafters.", tree:"Fluent in Flasks",
    unlock:"Craft Haranir phials 15×, then research: 25 Moxie",
    mats:[{h:236774,q:3},{h:236778,q:2}], craftNote:"herb amounts mirror the Finesse phial; an exact list isn't separately published", bound:false, mc:true, kind:"vial" },
  // ─ LIGHT POTIONS ─
  { cat:"Light Potion", name:"Light's Potential", effect:"+secondary stats, short burst (combat potion). The safe DPS/healer potion. Top bulk seller.", tree:"Potion Prowess",
    unlock:"Create 5 Midnight Healing Potions, then research: 50 Moxie",
    mats:[{h:236761,q:8},{h:236774,q:3},{h:236776,q:3}], craftNote:"plus 1 Mote of Light per craft (from the leveling batch: 80 Mote, 640 Tranquility, 240 Azeroot, 240 Argentleaf for ~80 crafts)", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Potion of Zealotry", effect:"Light combat potion variant. Stat burst on use.", tree:"Potion Prowess",
    unlock:"Brew 10 Light Potions, then research: 50 Moxie",
    mats:[], craftNote:"per-craft mats aren't individually published; uses Light-line herbs (Tranquility, Azeroot)", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Lightfused Mana Potion", effect:"Restores mana. Shares a cooldown with combat potions. The healer's mana potion.", tree:"Potion Prowess",
    unlock:"Recycle Midnight Potions 5× (free research)",
    mats:[{h:236761,q:8},{h:236778,q:3}], craftNote:"plus 5 Sunglass Vial (vendor: Melaris) per craft", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Silvermoon Health Potion", effect:"Restores health. Off the combat-potion cooldown — usable any time. Keep stacks on you.", tree:"Trainer",
    unlock:"Learned from Camberon (trainer) — no research",
    mats:[{h:236761,q:6}], craftNote:"plus Sunglass Vial (vendor) per craft", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Refreshing Serum", effect:"Early utility potion. A leveling staple and a Philosopher's Stone reagent.", tree:"Trainer",
    unlock:"Trainer / first crafts — no research",
    mats:[{h:236761,q:8},{h:236770,q:3}], craftNote:"plus 5 Sunglass Vial (vendor) per craft", bound:false, mc:true, kind:"potion" },
  // ─ VOID POTIONS (risk/reward) ─
  { cat:"Void Potion", name:"Draught of Rampant Abandon", effect:"Bigger stat burst than Light's Potential, BUT drops a puddle that silences you if you stand in it. The risky DPS potion.", tree:"Potion Prowess",
    unlock:"Craft Void Potions 10×, then research: 50 Moxie",
    mats:[{h:236780,q:1},{h:236770,q:2}], craftNote:"per-craft herb amounts derived; a void-line recipe", bound:false, mc:true, kind:"potion" },
  { cat:"Void Potion", name:"Potion of Devoured Dreams", effect:"Void utility potion with a risk/reward effect.", tree:"Potion Prowess",
    unlock:"Craft Void Potions 15×, then research: 25 Moxie",
    mats:[], craftNote:"per-craft mats aren't individually published; void-line herbs", bound:false, mc:true, kind:"potion" },
  { cat:"Void Potion", name:"Entropic Extract", effect:"Early void-side leveling potion.", tree:"Trainer",
    unlock:"Trainer / first crafts — no research",
    mats:[{h:236761,q:3}], craftNote:"plus 5 Sunglass Vial (vendor) per craft", bound:false, mc:true, kind:"potion" },
  // ─ TRANSMUTES (motes Multicraft · materials don't · 18h shared cooldown) ─
  { cat:"Transmute", name:"Transmute: Mote of Light", effect:"Converts 10 of another mote → 8 Mote of Light. Multicrafts for more. Cycle: Light → Wild Magic → Pure Void → Primal Energy → Light.", tree:"Transmutation Authority",
    unlock:"Perform 5 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"10 of the prior mote in the cycle → 8 Mote of Light (Multicraft yields extra)", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Transmute: Mote of Primal Energy", effect:"Converts 10 of another mote → 8 Primal Energy. Multicrafts.", tree:"Transmutation Authority",
    unlock:"Perform 5 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"10 motes → 8 Primal Energy; 18h shared transmute cooldown", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Transmute: Mote of Wild Magic", effect:"Converts 10 of another mote → 8 Wild Magic. Multicrafts.", tree:"Transmutation Authority",
    unlock:"Trainer / early transmute",
    mats:[], craftNote:"10 Mote of Light + 1 Stabilized Derivate → 8 Wild Magic", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Transmute: Mote of Pure Void", effect:"Converts 10 of another mote → 8 Pure Void. Multicrafts.", tree:"Transmutation Authority",
    unlock:"Perform 10 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"10 motes → 8 Pure Void; 18h shared transmute cooldown", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Bouquet of Herbs", effect:"Material transmute → herbs. Cannot Multicraft (Resourcefulness only).", tree:"Transmutation Authority",
    unlock:"Perform 5 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"material conversion → herbs; net cost depends on your server's input:output prices", bound:false, mc:false, kind:"vial" },
  { cat:"Transmute", name:"School of Gems", effect:"Material transmute → gems. Cannot Multicraft.", tree:"Transmutation Authority",
    unlock:"Perform 10 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"material conversion → gems; check the AH input:output ratio", bound:false, mc:false, kind:"vial" },
  { cat:"Transmute", name:"Wondrous Synergist", effect:"Daily-cooldown reagent (18h, ~9h with talents). Feeds cauldrons & decor. Multicrafts. Value unproven — read your server first.", tree:"Transmutation Authority",
    unlock:"Synthesis Synergy sub-spec",
    mats:[{h:236780,q:1},{h:236776,q:5}], craftNote:"daily cooldown; exact per-craft mats aren't fully published", bound:false, mc:true, kind:"vial" },
  // ─ REAGENTS ─
  { cat:"Reagent", name:"Stabilized Derivate", effect:"Core intermediate — needed for almost every Camberon's research. Made by recycling your own potions/flasks. Never vendor spare potions; recycle them.", tree:"Core",
    unlock:"Recycle Potions / Recycle Flasks (known from the start)",
    mats:[], craftNote:"use the Recycle ability on potions/flasks you've crafted — no herb cost", bound:false, mc:true, kind:"vial" },
  { cat:"Reagent", name:"Composite Flora", effect:"Crafted reagent from motes + herbs. Feeds higher recipes.", tree:"Core",
    unlock:"First crafts — no research",
    mats:[{h:236761,q:6},{h:236776,q:4}], craftNote:"plus 4 Mote of Wild Magic + 4 Mote of Primal Energy per craft", bound:false, mc:true, kind:"vial" },
  // ─ EQUIPMENT / TRINKETS ─
  { cat:"Equipment", name:"Primal Philosopher's Stone", effect:"BoP starter trinket. REQUIRED to perform transmutes — craft it early.", tree:"Core",
    unlock:"Level Alchemy to 10, then research at Camberon's (free)",
    mats:[], craftNote:"2 Stabilized Derivate · 2 Mote of Light · 5 Refreshing Serum per craft (no raw herbs)", bound:true, mc:false, kind:"flask" },
  { cat:"Equipment", name:"Magister's Alchemist Stone", effect:"Epic trinket EMBELLISHMENT — enhances your potion effects. A real seller via crafting orders.", tree:"Transmutation Authority",
    unlock:"30 pts Transmutation Authority",
    mats:[], craftNote:"~30 Stabilized Derivate + a Spark (account cooldown item); BoP via orders", bound:false, mc:false, kind:"flask" },
  // ─ DYES (no skill req · 2-step · AH-tradeable) ─
  { cat:"Dye", name:"Pigments (step 1)", effect:"Convert 10 of ANY herb → 1 pigment. Quality is irrelevant — use the cheapest herb. Different herbs make different colors. No skill needed, no skill gained.", tree:"Classic Alchemy",
    unlock:"Known from the start — any skill level",
    mats:[], craftNote:"10 of any single herb → 1 pigment (any expansion's herbs work)", bound:false, mc:false, kind:"potion" },
  { cat:"Dye", name:"Dyes (step 2)", effect:"Turn 1 pigment → 1 dye at the neighborhood Dye Crafting Table (Founder's Point for Alliance). AH-tradeable, never bound. A steady repeat-buy market.", tree:"Classic Alchemy",
    unlock:"At the Dye Crafting Table — no skill required",
    mats:[], craftNote:"1 pigment → 1 dye; see the Dyes page for every color a pigment makes", bound:false, mc:false, kind:"potion" },
  // ─ HOUSING DECOR ─
  { cat:"Decor", name:"Alchemical Decor (set)", effect:"Candles, glowing bottles, ritual basins, decorative cauldrons, lab furnishings — Alchemy crafts mood. Tradable. Many feed on Wondrous Synergist.", tree:"Decor",
    unlock:"~Alchemy skill 80",
    mats:[], craftNote:"each piece needs Lumber (free neighborhood axe) + reagents. Exact Midnight decor recipe mats are still settling in-game and not yet published", bound:false, mc:false, kind:"cauldron" },
];

// dye color tree — which pigment makes which dyes
let DYES = [
  { pigment:"Blue", color:C.ink2, dyes:["Alliance Blue","Dusk Lily Grey","Midnight Blue","Nazjatar Navy","Zephras Blue"] },
  { pigment:"Purple", color:C.plum, dyes:["Arcwine","Forsaken Plum","Kirin Tor Violet","Moonberry Amethyst","Netherstorm Fuchsia","Nightsong Lilac","Void Violet"] },
  { pigment:"Red", color:C.sanguine, dyes:["Deep Mageroyal Red","Firebloom Red","Gilnean Rose","Hinterlands Hickory","Horde Red","Mahogany","Rain Poppy Red","Ratchet Rust"] },
  { pigment:"Green", color:C.verdigris, dyes:["Dustwallow Green","Earthroot","Emerald Dreaming","Gravemoss Green","Grizzly Hills Green","Lush Green","Silversage Green"] },
  { pigment:"Brown", color:C.ochreDeep, dyes:["Dark Gold","Earthen Brown","Heartwood","Kalimdor Sand","Mesquite Brown","Pale Umber","Timbermaw Brown","Vol'dun Taupe","Warm Teak"] },
  { pigment:"Orange", color:C.ochre, dyes:["Bronze","Copper","Elwynn Pumpkin","Koboldhide Brown"] },
  { pigment:"Teal", color:C.sage, dyes:["Kul Tiran Steel","Tidesage Teal","Un'goro Green","Vortex Teal"] },
];

let BOOK_CATS = ["All","Flask","Cauldron","Phial","Light Potion","Void Potion","Transmute","Reagent","Equipment","Dye","Decor"];

// ── TOMTOM WAYPOINTS (verified) ────────────────────────────
// each: label + the exact /way string to paste in-game
let WAYPOINTS = {
  alchTreasures: [
    { w:"/way #2393 47.8, 51.8 Pristine Potion", note:"Silvermoon · fly up, atop the building behind the Alchemy trainer" },
    { w:"/way #2393 45.1, 44.7 Vial of Eversong Oddities", note:"Silvermoon City" },
    { w:"/way #2393 49.1, 75.8 Freshly Plucked Peacebloom", note:"Silvermoon City" },
    { w:"/way #2437 40.4, 51.1 Vial of Zul'Aman Oddities", note:"Zul'Aman" },
    { w:"/way #2536 49.1, 23.6 Measured Ladle", note:"Zul'Aman, Atal'Aman · may be phased behind campaign" },
    { w:"/way #2413 34.8, 24.7 Vial of Rootlands Oddities", note:"Harandar · inside the building" },
    { w:"/way #2444 41.9, 40.6 Vial of Voidstorm Oddities", note:"Voidstorm, Slayer's Rise" },
    { w:"/way #2405 32.8, 43.3 Failed Experiment", note:"Voidstorm" },
  ],
  herbTreasures: [
    { w:"/way #2393 49.0, 75.9 Simple Leaf Pruners", note:"Silvermoon City" },
    { w:"/way #2395 64.2, 30.5 A Spade", note:"Eversong Woods" },
    { w:"/way #2437 41.9, 45.9 Sweeping Harvester's Scythe", note:"Zul'Aman" },
    { w:"/way #2413 51.1, 55.7 Planting Shovel", note:"Harandar" },
    { w:"/way #2413 38.3, 66.9 Bloomed Bud", note:"Harandar" },
    { w:"/way #2413 36.6, 25.1 Lightbloom Root", note:"Harandar" },
    { w:"/way #2413 76.1, 51.1 Harvester's Sickle", note:"Harandar" },
    { w:"/way #2405 34.7, 57.0 Peculiar Lotus", note:"Voidstorm" },
  ],
  npcs: [
    { label:"Camberon — Alchemy trainer & Cauldron", w:"/way Silvermoon City Camberon", note:"Silvermoon City. Cauldron object sits right beside him. Melaris (vial vendor) is next to him too." },
    { label:"Void Researcher Anomander — Alchemy Renown book", w:"/way Voidstorm Void Researcher Anomander", note:"Voidstorm. Sells Beyond the Event Horizon (10 KP). Needs Renown 9 with The Singularity + 75 Moxie." },
    { label:"Naynar — Herbalism Renown book", w:"/way Harandar Naynar", note:"Sells Traditions of the Haranir (10 KP). Needs Renown 6 with Hara'ti + 75 Moxie." },
    { label:"Chel the Chip — Herbalism Abundance book & travel toy", w:"/way Harandar Chel the Chip", note:"Sells Echo of Abundance (10 KP, 1,600 Abundance + 75 Moxie) and Dundun's travel toy." },
    { label:"Botanist Nathera — Herbalism weekly quest", w:"/way Silvermoon City Botanist Nathera", note:"Weekly herb hand-in for 3 KP." },
    { label:"Mirvedon — PvP flask (Honor)", w:"/way Silvermoon City Mirvedon", note:"Sells the PvP flask for Honor." },
    { label:"Dye Crafting Table (Alliance)", w:"/way Founder's Point Dye Crafting Table", note:"Turn pigments into dyes here. (Horde: Razorwind Shores.)" },
  ],
};

let KP_HERB = { weekOne:91, weekly:13,
  oneTime:[
    {name:"First-gather discoveries",kp:34,detail:"1 each · 34 node variants"},
    {name:"Traditions of the Haranir",kp:10,detail:"Naynar · 75 Moxie · Renown 6 Hara'ti",way:"/way Harandar Naynar"},
    {name:"Echo of Abundance",kp:10,detail:"Chel the Chip · 1,600 Abundance + 75 Moxie",way:"/way Harandar Chel the Chip"},
    {name:"Eight treasures",kp:24,detail:"3 each · Harandar holds four",ways:"herbTreasures"},
  ],
  weeklySources:[
    {name:"Trainer quest",kp:3,detail:"Botanist Nathera · hand in herbs",way:"/way Silvermoon City Botanist Nathera"},
    {name:"Gathering drops",kp:9,detail:"5 plumes, then a tail"},
    {name:"Inscription treatise",kp:1,detail:"public order or alt"},
  ],
  monthly:[{name:"Darkmoon Faire",kp:3,detail:"5 Moonberry Juice · first Sunday monthly"}],
  catchup:"Phoenix Ember drops when you're behind — no weekly cap.",
};
let KP_ALCH = { weekOne:50, weekly:18,
  oneTime:[
    {name:"First-craft discoveries",kp:"~",detail:"1 per new recipe"},
    {name:"Beyond the Event Horizon",kp:10,detail:"Void Researcher Anomander · 75 Moxie · Renown 9",way:"/way Voidstorm Void Researcher Anomander"},
    {name:"Eight treasures",kp:24,detail:"3 each · one may be phased",ways:"alchTreasures"},
  ],
  weeklySources:[
    {name:"Patron orders",kp:"12–24",detail:"the main source · check often"},
    {name:"Trainer quest",kp:2,detail:"Camberon · 3 crafting orders",way:"/way Silvermoon City Camberon"},
    {name:"Treasure drops",kp:4,detail:"Spore Sample + Aged Cruor"},
    {name:"Inscription treatise",kp:1,detail:"public order or alt"},
  ],
  monthly:[{name:"Darkmoon Faire",kp:3,detail:"5 Moonberry Juice · first Sunday monthly"}],
  catchup:"Flickers replace Glimmers in orders when you're behind.",
};

const RECIPES = [
  {name:"Light's Potential",tree:"Potion Prowess",unlock:"craft 5 healing potions",cost:"Derivate ×3",note:"best leveling recipe",sell:true},
  {name:"Voidlight Draught",tree:"Potion Prowess",unlock:"craft 10 potions",cost:"Derivate ×5 · 20 Moxie",note:"risk/reward void potion",sell:true},
  {name:"Voidlight Potion Cauldron",tree:"Potion Prowess",unlock:"30 pts Potion Prowess",cost:"Derivate ×20 · 75 Moxie",note:"bound · raid utility",sell:false},
  {name:"Sin'dorei Flasks",tree:"Fluent in Flasks",unlock:"craft 5 flasks",cost:"Derivate ×4",note:"craft 10 to unlock Shattered Sun",sell:true},
  {name:"Flask of the Shattered Sun",tree:"Fluent in Flasks",unlock:"craft 10 Sin'dorei Flasks",cost:"Derivate ×5 · Lotus ×1 · 50 Moxie",note:"your flagship seller",sell:true},
  {name:"Cauldron of Sin'dorei Flasks",tree:"Fluent in Flasks",unlock:"30 pts Fluent in Flasks",cost:"Derivate ×25 · 100 Moxie",note:"bound · 5 min, 40 charges",sell:false},
  {name:"Haranir Phial of Finesse",tree:"Fluent in Flasks",unlock:"craft 5 phials",cost:"Derivate ×6",note:"sells to gatherers",sell:true},
  {name:"Wondrous Synergist",tree:"Transmutation Authority",unlock:"Synthesis Synergy",cost:"18h cooldown",note:"value unproven",sell:true},
  {name:"Magister's Alchemist Stone",tree:"Transmutation Authority",unlock:"30 pts Transmutation Authority",cost:"Derivate ×30 · Spark",note:"epic embellishment",sell:true},
];

// ── RANKING ENGINE ─────────────────────────────────────────
// The order is COMPUTED, not hardcoded. Today it runs on the app's price
// estimates; when hosted, the same scorer reads live Undermine Exchange
// price + quantity and the ranking rebuilds itself. No UI change at switchover.
//
// Herbs   → score = sale price per unit · velocity breaks ties
// Craft   → score = MARGIN (sale price − live mat cost) · velocity breaks ties
//
// vel (1–10) is a stand-in for UE's daily "quantity" (how fast it moves).
// When live, swap item.vel for the real quantity figure from the API.

// editorial notes by id (the human read on each item — kept, but no longer sets the order)
let HERB_NOTE = {
  236780:"rarest · pure profit · never vendor",
  236770:"flask reagent · carries a premium",
  236776:"second in demand · always liquid",
  236778:"inscription gives a second market",
  236761:"plentiful · move in big stacks",
  236774:"utility herb · lowest priority",
};
let ALCH_NOTE = {
  237100:"flagship flask · Gold fetches a premium · list Tue–Thu",
  237050:"cheap, multicrafts, always wanted",
  237051:"niche · good when void is the current tier",
  237102:"light competition · sells to gatherers",
  237200:"unproven · cauldron & decor only · daily cooldown",
};
// grade is derived from where an item lands in the live ranking, not fixed
const gradeFor = (rankIdx, total) => {
  const pct = rankIdx/Math.max(1,total-1);
  if(rankIdx===0) return "finest";
  if(pct<=0.34) return "choice";
  if(pct<=0.67) return "good";
  return "plain";
};

// returns herbs sorted by live (or estimated) sale price, velocity as tiebreaker
function rankHerbs(price){
  const scored = HERBS.map(h=>{
    const pa = price(h.id) ?? null;
    const pb = h.gid ? (price(h.gid) ?? null) : null;
    let saleGold=null, saleSilver=null;
    if(pa!=null && pb!=null){ saleGold=Math.max(pa,pb); saleSilver=Math.min(pa,pb); }
    else if(pa!=null){ saleSilver=pa; }
    else if(pb!=null){ saleSilver=pb; }
    else { saleSilver=h.est ?? null; }
    const baseline = saleSilver ?? h.est ?? 0;
    return { id:h.id, item:h, price:baseline, saleSilver, saleGold, vel:h.vel??0, score:(saleGold ?? baseline) };
  }).sort((a,b)=> b.score-a.score || b.vel-a.vel );
  return scored.map((s,i)=>({ ...s, rank:i+1, grade:gradeFor(i,scored.length), why:HERB_NOTE[s.id]||s.item.role }));
}

// UE's commodity feed returns ONE price per item — the market sell price in gold.

// returns tradeable craftables with BOTH qualities' market prices.
// We fetch both quality IDs, then label by PRICE: the higher is always Gold,
// the lower is always Silver. (Never trust which ID is which — let coin decide.)
function rankCraft(price){
  const sellable = PRODUCTS.filter(p=>p.tradeable);
  const scored = sellable.map(prod=>{
    const pa = price(prod.id) ?? null;
    const pb = prod.gid ? (price(prod.gid) ?? null) : null;
    // only call it a gold/silver pair when we truly have TWO live prices
    let saleGold=null, saleSilver=null;
    if(pa!=null && pb!=null){ saleGold=Math.max(pa,pb); saleSilver=Math.min(pa,pb); }
    else if(pa!=null){ saleSilver=pa; }            // single price = the base (silver)
    else if(pb!=null){ saleSilver=pb; }
    else { saleSilver=prod.est ?? null; }          // fall back to estimate
    const baseline = saleSilver ?? prod.est ?? 0;
    const cost = matCost(prod.mats, price);                 // herbs + vials + motes
    const herbCost = matCost((prod.mats||[]).filter(m=>m.h), price); // herb portion only
    const reagentCost = cost - herbCost;                    // vials + motes
    // "gathered" = you farmed the herbs free, but still bought vials/motes
    const marginGathered = baseline - reagentCost;
    const marginBuy = baseline - cost;
    return { id:prod.id, item:prod, sale:baseline, saleSilver, saleGold,
             cost, herbCost, reagentCost, verified:prod.v===true,
             marginGathered, marginBuy, margin:baseline,
             vel:prod.vel??0, score:(saleGold ?? baseline) };
  }).sort((a,b)=> b.score-a.score || b.vel-a.vel );
  return scored.map((s,i)=>({ ...s, rank:i+1, grade:gradeFor(i,scored.length), why:ALCH_NOTE[s.id]||s.item.role }));
}

const ALCH_UTILITY = [
  {id:237300,name:"Cauldron of Sin'dorei Flasks",why:"bound when made · place it for the raid, five minutes, forty charges · the worth is flasks unbought"},
];

let CONC_FACTS = [
  {k:"the pool",v:"per character, per profession · capped at 1,000"},
  {k:"refill",v:"1 per 6 min · 10/hour · ~100h dry to full"},
  {k:"Ingenuity",v:"refunds part of what you spend · ~50%, capped 70%"},
  {k:"rising cost",v:"the last skill points cost far more than the first"},
  {k:"spend on",v:"Gold-worth consumables, quality orders, lasting tools"},
  {k:"the end",v:"fully maxed, you reach top rank unaided"},
];
const STATS = [
  {name:"Multicraft",color:C.verdigris,note:"the gold-maker · ~⅓ more yield"},
  {name:"Ingenuity",color:C.plum,note:"refunds Concentration"},
  {name:"Resourcefulness",color:C.ochre,note:"fewer reagents · lifts order profit"},
  {name:"Crafting Speed",color:C.inkFaint,note:"never worth gearing for"},
];

/* ── FURNITURE & REWARDS ──────────────────────────────────────
   Two distinct buckets players confuse:
   (A) achievement-reward decor — EARNED by completing a profession
       achievement, account-wide, applied retroactively, NOT craftable.
   (B) crafted decor — you MAKE it (needs Lumber + often Wondrous
       Synergist) and can sell it. Fully tradable.
   Midnight housing decor is still settling in-game, so specific
   item↔achievement mappings are marked confirmed:false until verified. */
let FURNITURE = {
  // shared facts that ARE confirmed
  facts: [
    "Every Midnight decor craft needs Lumber — a universal reagent. Lumber needs no profession; grab the free axe from a neighborhood NPC and harvest it in any zone.",
    "Decor recipes start unlocking around Alchemy skill 80-85. They're costly to craft but fully tradable, so they sell on the AH.",
    "Wondrous Synergist (the daily-cooldown transmute) feeds many decor recipes and both cauldrons — its price rides the decor market.",
    "Achievement decor is applied retroactively: achievements you've already earned can grant their decor the moment housing goes live. Duplicates are then buyable from vendors.",
  ],
  // (A) earned by achievements — NOT craftable
  earned: [
    { name:"Crafting-achievement decor", from:"Alchemy & Herbalism crafting achievements", confirmed:false,
      note:"Profession achievements grant housing decor account-wide. The exact piece per achievement isn't published yet for these two professions." },
    { name:"Lotus Hunter mount", from:"Herbalism · gather 1,000 Nocturnal Lotus", confirmed:true,
      note:"a cosmetic mount, not furniture — but the marquee earned reward of the gathering grind." },
  ],
  // (B) crafted by the professions — tradable, sellable
  crafted: [
    { name:"Alchemy housing decor (set)", skill:"~80+", confirmed:true, needs:"Lumber + reagents, many use Wondrous Synergist",
      note:"candles, glowing bottles, ritual basins, decorative cauldrons, lab furnishings. Tradable. Specific recipe mats still settling in-game." },
    { name:"Dyes", skill:"learned mid-level", confirmed:true, needs:"pigments (from Inscription milling) refined by Alchemy",
      note:"Alchemy + Inscription collaboration. Always-needed repeat-buy; steady coin. Tradable." },
    { name:"Dragon's-hoard & themed pieces", skill:"~85+", confirmed:false, needs:"Lumber + Wondrous Synergist (likely)",
      note:"named decorative sets are reported but exact recipes aren't confirmed for Midnight yet." },
  ],
};
let ACHIEVEMENTS = [
  {name:"First Harvest",req:"gather all herb variants",reward:"≈34 KP",type:"Knowledge",note:"front-loaded · do it early", confirmed:true},
  {name:"Lotus Hunter",req:"gather 1,000 Nocturnal Lotus",reward:"the gathering mount",type:"Mount",note:"the premium-herb grind", confirmed:true},
  {name:"Sin'dorei Alchemist",req:"craft 5 flasks",reward:"flask recipes via the Cauldron",type:"Recipe",note:"by deed, not chance · this is how the Discovery system works", confirmed:true},
  {name:"Crafting-achievement decor",req:"various Alchemy/Herbalism crafting achievements",reward:"housing decor (account-wide)",type:"Decor",note:"granted retroactively · exact piece-per-achievement not yet published", confirmed:false},
];

let ZONES = [
  {name:"Eversong Woods",difficulty:"gentle",mote:"Mote of Light",color:C.ochre,terrain:"woods",notes:"even ground, few foes · follow the rivers, where nodes gather thickest",
   nodes:[[20,30],[35,25],[50,35],[65,28],[78,40],[70,58],[55,65],[40,60],[28,52],[22,42]],river:[[15,48],[35,50],[55,55],[75,50],[88,58]]},
  {name:"Zul'Aman",difficulty:"trying",mote:"Mote of Wild Magic",color:C.sanguine,terrain:"ruins",notes:"crowded · carry Deftness or be interrupted · richest in Argentleaf & Azeroot",
   nodes:[[25,35],[42,30],[58,38],[72,32],[80,48],[68,60],[50,68],[32,62],[20,50]],river:[]},
  {name:"Harandar",difficulty:"severe",mote:"Mote of Primal Energy",color:C.verdigris,terrain:"thicket",notes:"vertical thicket, dense with foes · four treasures wait here",
   nodes:[[30,22],[50,18],[68,25],[78,42],[72,60],[55,70],[38,66],[25,50],[42,45],[60,48]],river:[]},
  {name:"Voidstorm",difficulty:"harsh",mote:"Mote of Pure Void",color:C.plum,terrain:"void",notes:"a hostile maze · the sole Pure Void source · bring all the Deftness you can",
   nodes:[[22,40],[38,28],[55,32],[70,26],[82,44],[74,62],[58,70],[40,64],[28,55]],river:[]},
];

const DEFAULT_CHAR = { name:"Gilshi", realm:"Moon Guard", faction:"Alliance", race:"Pandaren", class:"Death Knight", herbSkill:100, herbMax:100, alchSkill:100, alchMax:100, herbKP:0, alchKP:0 };

async function fetchPrices(realm){
  // Calls our own serverless proxy (/api/prices), which talks to Undermine
  // Exchange server-side. Returns { prices:{id:gold}, realm, updated } so the
  // app can show which realm and how fresh the numbers are.
  const allIds=[...HERBS,...PRODUCTS,...REAGENTS].flatMap(i=>[i.id, i.gid].filter(Boolean));
  const ids=[...new Set(allIds)].join(",");
  const region=CONFIG.ue.region||"us";
  try{
    const r=await fetch("/api/prices?region="+region+"&realm="+encodeURIComponent(realm)+"&ids="+ids);
    if(!r.ok) return null;
    const d=await r.json();
    const src = d.prices || d; // tolerate either shape
    const out={}; for(const k in src){ if(src[k]!=null) out[String(k)]=src[k]; }
    return { prices:out, realm, region, updated: d.updated || Date.now() };
  }catch{return null;}
}
const fmtG = n => n==null?"-":n>=1000?`${(n/1000).toFixed(1)}k`:Math.round(n).toLocaleString();

// total material cost of a recipe across BOTH herbs and reagents (vials, motes).
// price(id) is the live lookup; falls back to each mat's labeled estimate.
function matCost(mats, price){
  return (mats||[]).reduce((sum,m)=>{
    const id = m.h ?? m.r;
    const mat = MAT(id);
    const unit = (price && price(id)!=null) ? price(id) : (mat?.est ?? 0);
    return sum + unit*(m.q||0);
  },0);
}

// in-game quality marks: silver diamond (lower), gold glowing pentagon (higher)
function QSilver({ size=12 }){
  return <svg width={size} height={size} viewBox="0 0 16 16" style={{display:"inline-block", verticalAlign:"-1px"}} aria-label="silver quality">
    <defs><linearGradient id="qsil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8edf2"/><stop offset="0.5" stopColor="#b8c2cc"/><stop offset="1" stopColor="#8a96a3"/></linearGradient></defs>
    <path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" fill="url(#qsil)" stroke="#6c7682" strokeWidth="1"/>
    <path d="M8 3.5 L6 7 L8 6 L10 7 Z" fill="#f5f8fb" opacity="0.7"/>
  </svg>;
}
function QGold({ size=13 }){
  return <svg width={size} height={size} viewBox="0 0 16 16" style={{display:"inline-block", verticalAlign:"-1px"}} aria-label="gold quality">
    <defs>
      <radialGradient id="qglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0.5" stopColor="#ffe9a8" stopOpacity="0.9"/><stop offset="1" stopColor="#ffd24d" stopOpacity="0"/></radialGradient>
      <linearGradient id="qgold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe9a0"/><stop offset="0.5" stopColor="#f4b733"/><stop offset="1" stopColor="#c8841a"/></linearGradient>
    </defs>
    <circle cx="8" cy="8" r="8" fill="url(#qglow)"/>
    <path d="M8 1.6 L14 6 L11.7 13.2 L4.3 13.2 L2 6 Z" fill="url(#qgold)" stroke="#9c6512" strokeWidth="1" strokeLinejoin="round"/>
    <path d="M8 3.4 L6.5 6.5 L8 5.7 L9.5 6.5 Z" fill="#fff6dc" opacity="0.8"/>
  </svg>;
}

/* ════════════════════════════════════════════════════════════════
   ILLUSTRATIONS — the interface is drawn
   ════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════
   SPECIALIZATION TREES — verified structure, Midnight (12.0.x)
   Point thresholds and branch names are confirmed; exact per-point
   stat values are mostly unpublished, so effects are described by
   their known milestones with honest notes where precision is unknown.
   ════════════════════════════════════════════════════════════════ */
// per-branch NODES: the real point gates and what each grants, for the visual tree.
// Sourced from Midnight profession guides (Lorewoven, Method, Icy Veins, Wowhead).
// "at" = points needed; nodes with parent>=0 hang off a sub-branch line.
let SPEC_TREES = {
  herb: {
    label:"Herbalism", accent:C.verdigris, cap:90,
    branches:[
      { key:"botany", name:"Botany", color:C.verdigris, max:40,
        gist:"quality of life. mounted gathering at 40 — the first thing a non-druid needs.",
        trunk:[
          {at:1,  t:"Botany root", d:"+Finesse and +Deftness trickle in as you fill the trunk"},
          {at:10, t:"Sub-spec unlocked", d:"opens the Mulching and Cultivation lines below"},
          {at:40, t:"Mounted Gathering", d:"gather without dismounting — roughly doubles route speed", key:true},
        ],
        subs:[
          { name:"Mulching", color:C.sage, nodes:[
            {at:20, t:"Imbued Mulch", d:"10 Tranquility Bloom → mulch that forces a Nocturnal Lotus on your next pick"},
            {at:30, t:"Magical Mulch", d:"mulch that guarantees a Finesse proc (bonus herbs) next gather"},
            {at:40, t:"Empowered Mulch", d:"mulch that guarantees a max-rank Gold herb next gather"},
          ]},
          { name:"Cultivation", color:C.lotus, nodes:[
            {at:20, t:"Seeds", d:"plant seeds on Rich Soil by rivers, harvest herbs on the spot"},
            {at:30, t:"Infused seeds", d:"planted herbs can roll elemental / higher-rank variants"},
            {at:40, t:"Overload synergy", d:"cuts Overload cooldown, ties Cultivation into mote farming"},
          ]},
        ],
        note:"the 40-point payoff (mounted gathering) is the whole reason. both subs are minor — Mulching's Lotus mulch is the pick if you go there." },
      { key:"bountiful", name:"Bountiful Harvests", color:C.ochreDeep, max:40,
        gist:"pure yield. +1 min & +1 max herb at 40, plus skill for more Gold-quality.",
        trunk:[
          {at:1,  t:"Bountiful root", d:"+yield and +herb skill (more Gold quality) as you fill it"},
          {at:10, t:"Sub-spec unlocked", d:"opens per-herb focus lines below"},
          {at:40, t:"+1 Min & +1 Max Yield", d:"every node gives at least one more herb, often two", key:true},
        ],
        subs:[
          { name:"Per-herb focus", color:C.ochre, nodes:[
            {at:20, t:"Tranquility / Sanguithorn / Mana Lily / Argentleaf", d:"pick one: ~15-20% Finesse proc for bonus herbs + skill for that herb"},
            {at:40, t:"Maxed herb focus", d:"at 40 in one herb, raises that herb's Nocturnal Lotus drop rate"},
          ]},
        ],
        note:"strongest gold tree once you can gather mounted. focus the herb selling highest on Moon Guard." },
      { key:"overload", name:"Midnight Overload", color:C.plum, max:40,
        gist:"infused-node farming. a second Overload charge at 40. only if you chase elemental nodes.",
        trunk:[
          {at:1,  t:"Overload root", d:"passive Overload cooldown reduction — free to grab"},
          {at:40, t:"Second Overload Charge", d:"double-dip infused nodes for twice the motes", key:true},
        ],
        subs:[
          { name:"By element", color:C.ink2, nodes:[
            {at:15, t:"Voidbound (Voidstorm)", d:"more Mote of Pure Void · also grants a portal back out of deep nodes"},
            {at:15, t:"Wild (Zul'Aman)", d:"more Mote of Wild Magic — the Inscription treatise mote"},
            {at:15, t:"Lightfused (Eversong)", d:"more Mote of Light from light-infused nodes"},
            {at:15, t:"Primal (Harandar)", d:"more Mote of Primal Energy from primal nodes"},
          ]},
        ],
        note:"heavy cost for a benefit only on rare infused nodes. take Voidbound first for the safety portal. last priority for most." },
    ],
  },
  alch: {
    label:"Alchemy", accent:C.ochreDeep, cap:90,
    branches:[
      { key:"flasks", name:"Fluent in Flasks", color:C.sanguine, max:30,
        gist:"flasks & phials. the personal/raid flask duration perks live here, very early.",
        trunk:[
          {at:1,  t:"Fluent root", d:"learn the base Thalassian flask; +flask & phial skill"},
          {at:5,  t:"Personal flask duration ×2", d:"your own flasks last twice as long"},
          {at:15, t:"Party/raid flask duration ×2", d:"doubles flask duration for the whole group — unlocked early, huge raid value", key:true},
          {at:30, t:"Cauldron of Sin'dorei Flasks", d:"one craft, flasks for the whole raid (warbound, not sellable)"},
        ],
        subs:[
          { name:"Sin'dorei Specialist (Thalassian)", color:C.ochreDeep, nodes:[
            {at:10, t:"Flask Abundance", d:"the gold-making node: multiplies Multicraft on Thalassian flasks — free extra flasks"},
            {at:30, t:"Concentration & skill", d:"big Ingenuity + reduced Concentration use → natural Gold-rank flasks"},
          ]},
          { name:"Haranir Secrets (Phials)", color:C.verdigris, nodes:[
            {at:10, t:"Phial Abundance", d:"Multicraft on Haranir profession phials — free extra phials"},
            {at:30, t:"Phial mastery", d:"skill & Concentration savings for Gold-rank phials"},
          ]},
        ],
        note:"go to 15 first in every build — the raid duration perk is the best early value in the whole profession. Flask Abundance is the seller's node." },
      { key:"potions", name:"Potion Prowess", color:C.ink2, max:30,
        gist:"potions, split into Light and Void lines. the bulk-volume sellers.",
        trunk:[
          {at:1,  t:"Prowess root", d:"+potions per craft; +potion skill"},
          {at:10, t:"Sub-spec unlocked", d:"unlocks Light's Potential (Light) and Void-Shrouded Tincture (Void)"},
          {at:20, t:"More recipes + yield", d:"opens the deeper potion recipes and raises yield"},
          {at:30, t:"Voidlight Potion Cauldron", d:"group potion cauldron (bound utility)", key:true},
        ],
        subs:[
          { name:"Path of Light", color:C.ochre, nodes:[
            {at:10, t:"Prolific Potioneer · Light", d:"unlock the Light Multicraft node"},
            {at:30, t:"Maxed Light", d:"fill for max Multicraft + quality on Light's Potential and kin"},
          ]},
          { name:"Path of Void", color:C.plum, nodes:[
            {at:10, t:"Prolific Potioneer · Void", d:"unlock the Void Multicraft node"},
            {at:30, t:"Maxed Void", d:"max Multicraft + quality on Void potions (higher risk/reward brews)"},
          ]},
        ],
        note:"Light's Potential is the steady bulk earner — go Path of Light for AH volume. Prolific Potioneer is the node that actually prints gold." },
      { key:"transmute", name:"Transmutation Authority", color:C.verdigris, max:30,
        gist:"transmutes & reagents. mote cycling and the Wondrous Synergist daily.",
        trunk:[
          {at:1,  t:"Authority root", d:"learn mote transmutes: 10 of one mote → 8 of another (18h shared CD, can Multicraft)"},
          {at:5,  t:"Sub-spec unlocked", d:"early — opens Synthesis Synergy"},
          {at:30, t:"Magister's Alchemist Stone", d:"epic embellishment trinket that boosts your potion effects", key:true},
        ],
        subs:[
          { name:"Synthesis Synergy", color:C.ochreDeep, nodes:[
            {at:5,  t:"Wondrous Synergist", d:"daily-cooldown transmute reagent used in cauldrons & housing decor"},
            {at:20, t:"Transmute Multicraft", d:"free extra motes / reagents on transmute crafts"},
          ]},
        ],
        note:"niche. worth it for dedicated transmuters or the Magister's Stone. Synergist's value swings with the housing-decor market — watch it." },
      { key:"mastery", name:"Alchemical Mastery", color:C.plum, max:30,
        gist:"the efficiency tree. Resourcefulness (cheaper crafts) + skill that applies to everything.",
        trunk:[
          {at:1,  t:"Mastery root", d:"flat Alchemy skill that applies to every craft — helps reach Gold rank"},
          {at:10, t:"Sub-spec unlocked", d:"opens the three Resourcefulness lines below"},
        ],
        subs:[
          { name:"Recycle", color:C.sanguine, nodes:[
            {at:20, t:"Resourcefulness · flasks & phials", d:"chance to use fewer mats on flasks/phials → pure margin"},
          ]},
          { name:"Reuse", color:C.ink2, nodes:[
            {at:20, t:"Resourcefulness · potions", d:"chance to use fewer mats on potions → pure margin"},
          ]},
          { name:"Reduce", color:C.verdigris, nodes:[
            {at:20, t:"Resourcefulness · reagents", d:"chance to use fewer mats on transmutes & other crafts"},
          ]},
        ],
        note:"unlocks no recipes, only stats — but 10-20 points here is free money once your main tree is set. match the line to whatever you craft most." },
    ],
  },
};

/* ════════════ EXPANSION DATASETS ════════════
   The data above is Midnight's set. We snapshot it into MIDNIGHT, define
   TWW's set, and loadExpansion(key) swaps the live bindings the whole app
   reads. Lookup closures (HERB/REAGENT/MAT) are rebuilt against the active
   arrays so cost math and pricing follow the open book. */
const MIDNIGHT_DS = {
  herbs:HERBS, reagents:REAGENTS, products:PRODUCTS, book:BOOK, dyes:DYES,
  bookCats:BOOK_CATS, waypoints:WAYPOINTS, herbNote:HERB_NOTE, alchNote:ALCH_NOTE,
  furniture:FURNITURE, achievements:ACHIEVEMENTS, zones:ZONES, specTrees:SPEC_TREES,
  kpHerb:KP_HERB, kpAlch:KP_ALCH, concFacts:CONC_FACTS,
};

/* ── THE WAR WITHIN (Khaz Algar) ── verified herb IDs from saddlebag/wowhead.
   TWW uses 3 quality tiers; Alchemate maps Q1→silver, Q3→gold. */
const TWW_HERBS = [
  { id:210796, gid:210798, name:"Mycobloom",       latin:"Fungus algari",      no:"01", role:"common base · Null Lotus source", tier:"common",  est:5,  vel:10, color:C.sage },
  { id:210805, gid:210807, name:"Blessing Blossom", latin:"Flos benedictus",    no:"02", role:"flask & potion base",  tier:"uncommon", est:9,  vel:8,  color:C.ochre },
  { id:210808, gid:210810, name:"Arathor's Spear",  latin:"Hasta arathii",      no:"03", role:"alchemy & inscription base", tier:"uncommon", est:8, vel:8, color:C.verdigris },
  { id:210799, gid:210801, name:"Luredrop",         latin:"Stilla illecebrae",  no:"04", role:"underground · potion base", tier:"uncommon", est:11, vel:7, color:C.ink2 },
  { id:210802, gid:210804, name:"Orbinid",          latin:"Orbis nidus",        no:"05", role:"rare bloom · high value",  tier:"rare",    est:18, vel:6,  color:C.plum },
  { id:213197, name:"Null Lotus",       latin:"Lotus nullius",      no:"06", role:"rare premium · gathered by chance", tier:"premium", est:140, vel:4, color:C.lotus },
];
// TWW non-herb reagents (verified). Vial of Kaheti Oils is the common alchemy vial.
const TWW_REAGENTS = [
  // verified IDs from wowhead/warcraft.wiki. Gilded Vial is the premium alchemy vial;
  // the four "residue" reagents drop from variant herb nodes (ties into Overloading spec).
  { id:211806, name:"Gilded Vial",        short:"Vial",    est:8,  color:C.ochreDeep, kind:"vial" },
  { id:212695, name:"Vial of Kaheti Oils",short:"Oil Vial",est:4,  color:C.ochre,     kind:"vial" },
  { id:213612, name:"Viridescent Spores", short:"Spores",  est:14, color:C.sage,      kind:"residue" }, // Sporefused nodes
  { id:213613, name:"Leyline Residue",    short:"Leyline", est:16, color:C.ink2,       kind:"residue" }, // Irradiated nodes
  { id:213614, name:"Writhing Sample",    short:"Writhing",est:30, color:C.plum,       kind:"residue", v:false }, // Altered nodes · ID unconfirmed
  { id:213611, name:"Crystalline Powder", short:"Crystal", est:18, color:C.verdigris,  kind:"residue", v:false }, // Crystallized nodes · ID unconfirmed
];
// TWW zones (Khaz Algar) — four grounds, verified from herb-spawn guides.
const TWW_ZONES = [
  {name:"Isle of Dorn",difficulty:"gentle",mote:"surface herbs",color:C.ochre,terrain:"woods",notes:"surface zone · Mycobloom, Blessing Blossom, Arathor's Spear · no Orbinid or Luredrop here",
   nodes:[[22,30],[38,26],[54,34],[68,28],[80,42],[70,58],[54,64],[38,60],[26,50],[20,40]],river:[[14,46],[36,50],[58,54],[80,50]]},
  {name:"The Ringing Deeps",difficulty:"trying",mote:"all five herbs",color:C.sanguine,terrain:"ruins",notes:"the machine-deeps · every herb spawns here, including Orbinid · rich all-rounder",
   nodes:[[26,34],[44,30],[60,38],[74,32],[82,48],[68,60],[50,66],[32,60],[22,48]],river:[]},
  {name:"Hallowfall",difficulty:"gentle",mote:"all five herbs",color:C.candle,terrain:"thicket",notes:"the lit cavern · all herbs · the best general farming ground",
   nodes:[[30,24],[50,20],[68,26],[78,42],[72,58],[56,68],[40,64],[26,50],[44,46],[62,48]],river:[[16,52],[40,56],[64,52],[84,58]]},
  {name:"Azj-Kahet",difficulty:"severe",mote:"underground herbs",color:C.plum,terrain:"void",notes:"the spider-city depths · Luredrop & Orbinid thrive · no Blessing Blossom or Spear",
   nodes:[[24,40],[40,28],[56,32],[72,28],[82,46],[72,62],[56,68],[40,62],[28,52]],river:[]},
];
// TWW Herbalism spec trees — verified node structure from wow-professions/method.
const TWW_SPEC_TREES = {
  herb: {
    label:"Herbalism", accent:C.verdigris, cap:90,
    branches:[
      { key:"botany", name:"Botany", color:C.verdigris, max:45,
        gist:"quality of life. mounted gathering at 40, and free Vigor-on-gather just for unlocking it.",
        trunk:[
          {at:1,  t:"Botany root", d:"unlocking alone grants passive Vigor replenish on every gather — take this first"},
          {at:40, t:"Mounted Gathering", d:"gather herbs without dismounting — the biggest QoL unlock if you're not a druid", key:true},
        ],
        subs:[
          { name:"Lush & Deftness", color:C.sage, nodes:[
            {at:10, t:"Green Thumb", d:"doubles herbs gathered on your next pick"},
            {at:20, t:"Mulching", d:"more Deftness on Lush nodes specifically"},
          ]},
        ],
        note:"always unlock Botany first — the free Vigor replenish keeps you airborne between nodes." },
      { key:"bountiful", name:"Bountiful Harvests", color:C.ochreDeep, max:60,
        gist:"the gold tree. +55 skill, the ability to refine Q1→Q2→Q3, and per-herb Null Lotus boosts.",
        trunk:[
          {at:1,  t:"Bountiful root", d:"the center node: +55 skill to all herbs and unlocks Refining (upgrade Q1→Q2, Q2→Q3)", key:true},
          {at:30, t:"Per-herb subspecs open", d:"invest in the herb you farm most"},
        ],
        subs:[
          { name:"Per-herb focus (×5 herbs)", color:C.ochre, nodes:[
            {at:20, t:"Herb skill + Finesse", d:"more of that herb, higher quality, more Finesse procs"},
            {at:40, t:"Null Lotus boost", d:"the last node of each herb line raises your Null Lotus drop chance — the real money", key:true},
          ]},
        ],
        note:"max this first. Refining alone (Q1→Q3) is huge, and every herb line ends in a Null Lotus boost." },
      { key:"overload", name:"Overloading the Underground", color:C.plum, max:45,
        gist:"elemental nodes & harm mitigation. removes Sporefused hallucinations and Irradiated knockback.",
        trunk:[
          {at:1,  t:"Overload root", d:"the new Overload elemental herb ability; mitigates variant-node downsides"},
          {at:25, t:"Cultivation / seeds", d:"plant elemental seeds at the Hallowfall farm — but seed drop rate is low"},
        ],
        subs:[
          { name:"Variant handling", color:C.verdigris, nodes:[
            {at:15, t:"Sporefused safety", d:"removes the hallucination/explosion downside of Sporefused nodes"},
            {at:25, t:"Irradiated control", d:"stops the knockback from Irradiated nodes"},
          ]},
        ],
        note:"lowest priority. handy if you farm variant nodes a lot, but the seed sub-spec is widely seen as skippable." },
    ],
  },
  // TWW Alchemy specs — verified from wow-professions / overgear.
  alch: {
    label:"Alchemy", accent:C.ochreDeep, cap:90,
    branches:[
      { key:"flasks", name:"Fantastic Flasks", color:C.sanguine, max:30,
        gist:"the flask tree. doubles flask/phial duration and unlocks the Flask Cauldron.",
        trunk:[
          {at:5,  t:"Flask duration +50%", d:"your flasks and phials last 50% longer"},
          {at:15, t:"Flask duration +50% more", d:"stacks to double duration — refresh every 2 hrs, not 1", key:true},
          {at:25, t:"-5% Concentration on flasks", d:"cheaper guaranteed-quality flask crafts"},
          {at:30, t:"Algari Flask Cauldron", d:"the raid-utility recipe", key:true},
        ],
        subs:[
          { name:"Flask focus", color:C.ochre, nodes:[
            {at:10, t:"Sub-spec of choice", d:"+Skill, Multicraft and Resourcefulness on flasks & phials"},
            {at:20, t:"Bulk Production", d:"chance to craft extra flasks per craft — the volume lever"},
          ]},
        ],
        note:"if you raid or sell consumables, start here — the duration doubling and Bulk Production drive both saving and earning." },
      { key:"potions", name:"Potent Potions", color:C.verdigris, max:30,
        gist:"the potion tree. Resourcefulness, Multicraft and the Potion Cauldron.",
        trunk:[
          {at:5,  t:"+15 Resourcefulness on potions", d:"cheaper potion crafts (mat refunds)"},
          {at:15, t:"Potion sub-spec", d:"specialize a potion line"},
          {at:25, t:"-5% Concentration on potions", d:"cheaper Q3 potions"},
          {at:30, t:"Algari Potion Cauldron", d:"raid potion utility", key:true},
        ],
        subs:[
          { name:"Bulk Production", color:C.sage, nodes:[
            {at:20, t:"Extra potions per craft", d:"the volume node — pairs with high-demand Healing Potions"},
            {at:30, t:"Mycobloom Lore first", d:"Mycobloom is in every potion, so its lore gives skill across the whole line", key:true},
          ]},
        ],
        note:"the high-volume gold tree. Healing Potions never stop selling; Bulk Production multiplies every craft." },
      { key:"thaum", name:"Thaumaturgy", color:C.plum, max:30,
        gist:"transmutation. four reagent types (Mercurial, Ominous, Volatile, Gleaming) and rare-gem transmutes.",
        trunk:[
          {at:1,  t:"Thaumaturgy root", d:"attempt transmutations; split bonuses across the four transmutagen types"},
          {at:30, t:"Gleaming Glory", d:"the no-cooldown transmute · can chase the Blasphemite gem", key:true},
        ],
        subs:[
          { name:"Transmute focus", color:C.ochreDeep, nodes:[
            {at:15, t:"Higher transmute limits", d:"more daily charges"},
            {at:25, t:"Rare-gem transmutes", d:"Blasphemite and friends — lucrative with alts"},
          ]},
        ],
        note:"lower margins than Dragonflight — Blizzard nerfed transmute gold in TWW. worth it for the gem chase or dedicated transmuters only." },
      { key:"mastery", name:"Alchemical Mastery", color:C.ink2, max:50,
        gist:"the efficiency tree. +60 skill to every recipe at 50, and cheaper guaranteed-Q3 crafts.",
        trunk:[
          {at:1,  t:"Mastery root", d:"flat Alchemy skill across all crafts"},
          {at:30, t:"Formulated Courage", d:"the potion that clears the experimentation 'Catastrophe' debuff"},
          {at:50, t:"+60 Skill to all recipes", d:"complete Patron orders with lower-quality mats and less Concentration", key:true},
        ],
        subs:[
          { name:"Guaranteed quality", color:C.verdigris, nodes:[
            {at:25, t:"Pick one flask/potion", d:"guarantee its Q3 without Concentration — using e.g. Tempered Potion"},
          ]},
        ],
        note:"a strong all-round first investment — the +60 skill makes everything cheaper to craft at top quality." },
    ],
  },
};
// ── TWW ALCHEMY PRODUCTS ── recipes VERIFIED from leveling guides (per-craft mats
// derived from the published bulk formulas). Sale-price item IDs are confirmed where
// noted (v:true); the four Tempered flask product IDs await pinning (v:false) so their
// craft margin shows a herb-cost baseline, not a fake sale price.
const TWW_PRODUCTS = [
  // ── Flasks (combat · 1hr · craft 2 at once) ── recipes verified, per-craft from /45 bulk
  { id:212316, gid:212318, name:"Flask of Tempered Aggression", cat:"Flask", kind:"flask", role:"Crit · raid flagship", est:380, vel:9, v:false,
    mats:[{h:213197,q:1},{r:213612,q:2},{h:210799,q:12},{h:210802,q:12},{r:211806,q:2}], tradeable:true },
  { id:212319, gid:212321, name:"Flask of Tempered Mastery",    cat:"Flask", kind:"flask", role:"Mastery · healer default", est:380, vel:8, v:false,
    mats:[{h:213197,q:1},{r:213613,q:2},{h:210805,q:12},{h:210808,q:12},{r:211806,q:2}], tradeable:true },
  { id:212322, gid:212324, name:"Flask of Tempered Swiftness",  cat:"Flask", kind:"flask", role:"Haste · often top DPS", est:390, vel:8, v:false,
    mats:[{h:213197,q:1},{r:213613,q:2},{h:210799,q:12},{h:210805,q:12},{r:211806,q:2}], tradeable:true },
  { id:212325, gid:212327, name:"Flask of Tempered Versatility",cat:"Flask", kind:"flask", role:"Vers · the base flask", est:300, vel:6, v:false,
    mats:[{h:213197,q:1},{r:213612,q:2},{h:210802,q:12},{h:210808,q:12},{r:211806,q:2}], tradeable:true },
  { id:212281, gid:212283, name:"Flask of Alchemical Chaos",    cat:"Flask", kind:"flask", role:"random big stat · premium seller", est:520, vel:7, v:true,
    mats:[{h:213197,q:1},{h:210799,q:8},{h:210802,q:8},{h:210805,q:8},{h:210808,q:8},{r:211806,q:2}], tradeable:true },
  { id:212284, gid:212286, name:"Flask of Saving Graces",       cat:"Flask", kind:"flask", role:"healer · low-health healing", est:340, vel:5, v:false,
    mats:[{h:213197,q:1},{h:210796,q:16},{h:210805,q:8},{r:211806,q:2}], tradeable:true },
  // ── Combat / utility potions ── recipes verified, per-craft from /70 bulk
  { id:212240, gid:212242, name:"Tempered Potion",              cat:"Void Potion", kind:"potion", role:"burst combat potion", est:60, vel:9, v:false,
    mats:[{r:213614,q:1},{h:210796,q:12},{h:210799,q:4},{h:210808,q:4},{r:211806,q:5}], tradeable:true },
  { id:212249, gid:212251, name:"Potion of Unwavering Focus",   cat:"Void Potion", kind:"potion", role:"sustained burn · high demand", est:75, vel:8, v:false,
    mats:[{r:213611,q:1},{h:210796,q:12},{h:210802,q:4},{h:210808,q:4},{r:211806,q:5}], tradeable:true },
  { id:212246, name:"Potion of the Reborn Cheetah",             cat:"Void Potion", kind:"potion", role:"movement utility", est:45, vel:6, v:false,
    mats:[{r:213614,q:1},{h:210796,q:12},{h:210802,q:4},{h:210808,q:4},{r:211806,q:5}], tradeable:true },
  // ── Healing / mana (bulk volume) ── Algari Healing Potion ID VERIFIED
  { id:211878, gid:211880, name:"Algari Healing Potion",        cat:"Light Potion", kind:"potion", role:"health · bulk volume seller", est:14, vel:10, v:true,
    mats:[{h:210796,q:6},{r:211806,q:5}], tradeable:true },
  { id:211881, gid:211883, name:"Algari Mana Potion",           cat:"Light Potion", kind:"potion", role:"mana · steady seller", est:12, vel:9, v:false,
    mats:[{h:210796,q:6},{r:211806,q:5}], tradeable:true },
  { id:211884, name:"Cavedweller's Delight",                    cat:"Light Potion", kind:"potion", role:"half heal / half mana", est:10, vel:5, v:false,
    mats:[{h:210796,q:4},{h:210805,q:2},{r:211806,q:5}], tradeable:true },
  { id:212255, name:"Slumbering Soul Serum",                    cat:"Light Potion", kind:"potion", role:"healer mana nap", est:18, vel:4, v:false,
    mats:[{h:210796,q:4},{h:210805,q:5},{h:210808,q:5},{r:211806,q:5}], tradeable:true },
  // ── Phials (profession stats · craft 4, last 30min) ── recipes estimated
  { id:212262, name:"Phial of Truesight",          cat:"Phial", kind:"vial", role:"reveals camo herb nodes · sells to gatherers", est:60, vel:5, v:false,
    mats:[{h:210808,q:3},{h:210802,q:2},{r:211806,q:1}], tradeable:true },
  { id:212265, name:"Phial of Concentrated Ingenuity", cat:"Phial", kind:"vial", role:"crafting stat · sells to crafters", est:80, vel:5, v:false,
    mats:[{h:210805,q:3},{h:210808,q:2},{r:211806,q:1}], tradeable:true },
  { id:212268, name:"Phial of Enhanced Ambidexterity", cat:"Phial", kind:"vial", role:"crafting speed · niche", est:65, vel:4, v:false,
    mats:[{h:210805,q:3},{h:210799,q:2},{r:211806,q:1}], tradeable:true },
  // ── Bound raid tools (listed, never sold) ──
  { id:212370, name:"Algari Flask Cauldron",  cat:"Cauldron", kind:"cauldron", role:"raid flask utility · bound", est:null, vel:0, v:false,
    mats:[{h:213197,q:5},{h:210799,q:30},{h:210802,q:30},{r:211806,q:10}], tradeable:false },
  { id:212372, name:"Algari Potion Cauldron", cat:"Cauldron", kind:"cauldron", role:"raid potion utility · bound", est:null, vel:0, v:false,
    mats:[{h:210796,q:40},{h:210808,q:20},{r:211806,q:10}], tradeable:false },
];

// ── TWW FORMULARY (the recipe encyclopedia) ── recipes verified; per-craft herb
// amounts derived from the published bulk-leveling batches.
const TWW_BOOK = [
  { cat:"Flask", name:"Flask of Tempered Aggression", effect:"+Critical Strike for 1 hr. Persists through death. Craft 2 at once; drink two back-to-back for 2 hrs.", tree:"Fantastic Flasks",
    unlock:"Discovered via experimentation, or taught through the Fantastic Flasks spec",
    mats:[{h:213197,q:1},{r:213612,q:2},{h:210799,q:12},{h:210802,q:12},{r:211806,q:2}], craftNote:"per-craft from the 45-flask batch (45 Null Lotus, 90 Viridescent Spores, 540 Luredrop, 540 Orbinid, 90 Gilded Vial)", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of Tempered Mastery", effect:"+Mastery for 1 hr. The default healer flask.", tree:"Fantastic Flasks",
    unlock:"Experimentation / Fantastic Flasks",
    mats:[{h:213197,q:1},{r:213613,q:2},{h:210805,q:12},{h:210808,q:12},{r:211806,q:2}], craftNote:"per-craft from the 45-flask batch", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of Tempered Swiftness", effect:"+Haste for 1 hr. Often the top DPS flask.", tree:"Fantastic Flasks",
    unlock:"Experimentation / Fantastic Flasks",
    mats:[{h:213197,q:1},{r:213613,q:2},{h:210799,q:12},{h:210805,q:12},{r:211806,q:2}], craftNote:"per-craft from the 45-flask batch", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of Tempered Versatility", effect:"+Versatility for 1 hr. The base flask.", tree:"Fantastic Flasks",
    unlock:"Experimentation / Fantastic Flasks",
    mats:[{h:213197,q:1},{r:213612,q:2},{h:210802,q:12},{h:210808,q:12},{r:211806,q:2}], craftNote:"per-craft from the 45-flask batch", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of Alchemical Chaos", effect:"A big chunk of a random secondary stat, re-rolling every 30 sec. One of the premium sellers.", tree:"Fantastic Flasks",
    unlock:"Experimentation · high-value discovery",
    mats:[{h:213197,q:1},{h:210799,q:8},{h:210802,q:8},{h:210805,q:8},{h:210808,q:8},{r:211806,q:2}], craftNote:"per-craft from the 45-flask batch (uses all four common herbs)", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of Saving Graces", effect:"Healing low-health players increases your healing done. Healer niche.", tree:"Fantastic Flasks",
    unlock:"Experimentation",
    mats:[{h:213197,q:1},{h:210796,q:16},{h:210805,q:8},{r:211806,q:2}], craftNote:"per-craft from the 60-flask batch · gives only 1 skill point when leveling", bound:false, mc:true, kind:"flask" },
  { cat:"Void Potion", name:"Tempered Potion", effect:"Burst combat potion. Uses the Writhing Sample reagent from Altered herb nodes.", tree:"Potent Potions",
    unlock:"Experimentation",
    mats:[{r:213614,q:1},{h:210796,q:12},{h:210799,q:4},{h:210808,q:4},{r:211806,q:5}], craftNote:"per-craft from the 70-potion batch", bound:false, mc:true, kind:"potion" },
  { cat:"Void Potion", name:"Potion of Unwavering Focus", effect:"Sustained burn-phase combat potion. High raid demand.", tree:"Potent Potions",
    unlock:"Experimentation",
    mats:[{r:213611,q:1},{h:210796,q:12},{h:210802,q:4},{h:210808,q:4},{r:211806,q:5}], craftNote:"per-craft from the 70-potion batch · uses Crystalline Powder", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Algari Healing Potion", effect:"Instant health. The bulk-volume seller every player buys.", tree:"Potent Potions",
    unlock:"Wild Experimentation on Mycobloom (first basic recipe)",
    mats:[{h:210796,q:6},{r:211806,q:5}], craftNote:"per-craft from the 10-potion batch (60 Mycobloom, 50 Gilded Vials)", bound:false, mc:true, kind:"potion" },
  { cat:"Phial", name:"Phial of Truesight", effect:"Reveals invisible Camouflaged herb nodes for 30 min. Sells to gatherers.", tree:"Potent Potions",
    unlock:"Experimentation",
    mats:[{h:210808,q:3},{h:210802,q:2},{r:211806,q:1}], craftNote:"crafts 4 at once · mats estimated", bound:false, mc:true, kind:"vial" },
  { cat:"Cauldron", name:"Algari Flask Cauldron", effect:"Place for the raid: members draw their chosen flask. Bound utility.", tree:"Fantastic Flasks",
    unlock:"30 Knowledge in Fantastic Flasks",
    mats:[{h:213197,q:5},{h:210799,q:30},{h:210802,q:30},{r:211806,q:10}], craftNote:"mats estimated · the cauldron itself uses no herbs directly in some tellings", bound:true, mc:false, kind:"cauldron" },
];
// ── TWW achievements / rewards ──
const TWW_ACHIEVEMENTS = [
  {name:"Khaz Algar Herbalist",req:"gather every Algari herb",reward:"≈Knowledge Points",type:"Knowledge",note:"front-load the one-time KP early",confirmed:true},
  {name:"Null Lotus hunter",req:"chase Null Lotus drops via Bountiful Harvests",reward:"the premium-herb income",type:"Gold",note:"every per-herb spec line ends in a Null Lotus boost",confirmed:true},
  {name:"Fantastic Flasks: Cauldron",req:"30 Knowledge in Fantastic Flasks",reward:"Algari Flask Cauldron recipe",type:"Recipe",note:"the raid-utility milestone",confirmed:true},
  {name:"Thaumaturgy transmutes",req:"invest in the Thaumaturgy spec",reward:"daily transmute gold",type:"Gold",note:"lower margins than Dragonflight, but steady",confirmed:true},
];
const TWW_DS = {
  herbs:TWW_HERBS, reagents:TWW_REAGENTS,
  products:TWW_PRODUCTS, book:TWW_BOOK, dyes:DYES, bookCats:BOOK_CATS,
  waypoints:{ npcs:[
    { label:"Tarig — Alchemy trainer", note:"Dornogal, Isle of Dorn", w:"/way Isle of Dorn 47 81", coords:[47,81] },
    { label:"Shalba — Alchemy trainer", note:"City of Threads, Azj-Kahet", w:"/way Azj-Kahet 45.5 13.5", coords:[45.5,13.5] },
    { label:"Makir — Gilded Vial (JC)", note:"Dornogal · learn to craft the vial", w:"/way Dornogal 40 60", coords:[40,60] },
    { label:"Weaver's Pact", note:"Azj-Kahet · +15% gathering speed buff", w:"/way Azj-Kahet 55.3 41", coords:[55.3,41] },
  ]},
  herbNote:{
    213197:"the rare one · every flask wants it · never vendor",
    210802:"high-value bloom · Azj-Kahet & the Deeps",
    210799:"underground · steady flask demand",
    210805:"common, liquid · healer flasks lean on it",
    210808:"the inscription crossover herb · always moves",
    210796:"everywhere · in every potion · bulk it",
  },
  alchNote:{
    flask:"flasks are the money. Tempered four + Alchemical Chaos on raid nights.",
    potion:"Healing Potions are pure volume — never stop selling them.",
    null:"Null Lotus gates every flask; your gather rate is your flask ceiling.",
  },
  furniture:FURNITURE, achievements:TWW_ACHIEVEMENTS, zones:TWW_ZONES, specTrees:TWW_SPEC_TREES,
  kpHerb:KP_HERB, kpAlch:KP_ALCH, concFacts:CONC_FACTS,
};

/* ════════════ VANILLA — Classic Alchemy proficiency (retail) ════════════
   The old-world 1-300 Alchemy that still exists on retail as its own "Classic
   Alchemy" proficiency tab. NO quality tiers (no gid), NO spec trees, NO live
   pricing — the classic AH is dead on retail, so numbers here are CURATED
   RELATIVE ESTIMATES (a sense of what's worth more, not live gold). Scope is
   strictly what a retail character can still TRAIN and CRAFT today: the removed
   raid flasks, Arcanite transmute, Mongoose and Black Lotus are deliberately
   NOT here because they aren't retail-craftable. */
const VAN_HERBS = [
  { id:765,   name:"Silverleaf",        latin:"Argentum folium",   no:"01", role:"starter · skill 1",     tier:"common",  est:1,  vel:9, color:C.sage },
  { id:2447,  name:"Peacebloom",        latin:"Flos pacis",        no:"02", role:"starter · skill 1",     tier:"common",  est:1,  vel:9, color:C.ochre },
  { id:2449,  name:"Earthroot",         latin:"Radix terrae",      no:"03", role:"skill 15 · low elixirs", tier:"common",  est:1,  vel:7, color:C.verdigris },
  { id:2450,  name:"Mageroyal",         latin:"Herba magi",        no:"04", role:"skill 50 · mana",        tier:"common",  est:2,  vel:7, color:C.plum },
  { id:2453,  name:"Bruiseweed",        latin:"Herba livida",      no:"05", role:"skill 100 · defense",    tier:"common",  est:2,  vel:6, color:C.ink2 },
  { id:3355,  name:"Wild Steelbloom",   latin:"Flos ferreus",      no:"06", role:"skill 115 · Greater Def",tier:"uncommon",est:3,  vel:6, color:C.sage },
  { id:3818,  name:"Fadeleaf",          latin:"Folium evanidum",   no:"07", role:"skill 160 · invis pots", tier:"uncommon",est:4,  vel:5, color:C.ink2 },
  { id:3821,  name:"Goldthorn",         latin:"Spina aurea",       no:"08", role:"skill 170 · Superior",   tier:"uncommon",est:4,  vel:5, color:C.ochreDeep },
  { id:3358,  name:"Khadgar's Whisker", latin:"Cirrus khadgari",   no:"09", role:"skill 160 · Greater Int",tier:"uncommon",est:5,  vel:6, color:C.ochre },
  { id:8836,  name:"Arthas' Tears",     latin:"Lacrimae regis",    no:"10", role:"skill 220 · shadow pots",tier:"rare",    est:8,  vel:5, color:C.plum },
  { id:8838,  name:"Sungrass",          latin:"Gramen solis",      no:"11", role:"skill 230 · Major pots", tier:"rare",    est:9,  vel:6, color:C.candle },
  { id:8839,  name:"Blindweed",         latin:"Herba caeca",       no:"12", role:"skill 235 · Mana",       tier:"rare",    est:8,  vel:4, color:C.verdigris },
  { id:13463, name:"Dreamfoil",         latin:"Folium somnii",     no:"13", role:"skill 270 · Major/Greater",tier:"rare",  est:12, vel:6, color:C.ink2 },
  { id:13464, name:"Golden Sansam",     latin:"Sansam aureum",     no:"14", role:"skill 260 · Major Heal", tier:"rare",    est:11, vel:5, color:C.ochre },
  { id:13465, name:"Mountain Silversage",latin:"Salvia montana",   no:"15", role:"skill 280 · top pots",   tier:"premium", est:14, vel:5, color:C.ink2 },
  { id:13466, name:"Plaguebloom",       latin:"Flos pestis",       no:"16", role:"skill 285 · shadow/fire",tier:"premium", est:13, vel:4, color:C.plum },
  { id:13467, name:"Icecap",            latin:"Pileus glaciei",    no:"17", role:"skill 290 · protection",  tier:"premium", est:12, vel:3, color:C.sage },
];
// Classic vials are vendor-bought (trivial cost) — the reagent that pairs with herbs.
const VAN_REAGENTS = [
  { id:3372,  name:"Leaded Vial",  short:"Vial",  est:1, color:C.ochre, kind:"vial" },
  { id:3371,  name:"Empty Vial",   short:"Vial",  est:1, color:C.sage,  kind:"vial" },
  { id:8925,  name:"Crystal Vial", short:"Vial",  est:1, color:C.ink2,  kind:"vial" },
];
// Retail-craftable Classic Alchemy — potions & elixirs a retail char still trains.
// est = curated RELATIVE value (silver-ish), not live. No gid (Vanilla had no quality).
const VAN_PRODUCTS = [
  { id:118,   name:"Minor Healing Potion",   cat:"Light Potion", kind:"potion", role:"skill 1 · the first brew", est:1, vel:5, v:true,
    mats:[{h:2447,q:1},{r:3371,q:1}], tradeable:true },
  { id:929,   name:"Healing Potion",         cat:"Light Potion", kind:"potion", role:"skill 60 · leveler staple", est:2, vel:7, v:true,
    mats:[{h:2453,q:1},{h:2449,q:1},{r:3372,q:1}], tradeable:true },
  { id:1710,  name:"Greater Healing Potion",  cat:"Light Potion", kind:"potion", role:"skill 140 · steady seller", est:4, vel:7, v:true,
    mats:[{h:3355,q:1},{h:2453,q:1},{r:3372,q:1}], tradeable:true },
  { id:3928,  name:"Superior Healing Potion", cat:"Light Potion", kind:"potion", role:"skill 215 · dungeon heal",  est:7, vel:6, v:true,
    mats:[{h:3821,q:1},{h:8836,q:1},{r:8925,q:1}], tradeable:true },
  { id:13446, name:"Major Healing Potion",   cat:"Light Potion", kind:"potion", role:"skill 275 · the classic heal", est:14, vel:8, v:true,
    mats:[{h:8838,q:1},{h:13464,q:1},{r:8925,q:1}], tradeable:true },
  { id:3827,  name:"Mana Potion",            cat:"Light Potion", kind:"potion", role:"skill 120 · caster fuel",   est:3, vel:6, v:true,
    mats:[{h:2450,q:1},{h:2453,q:1},{r:3372,q:1}], tradeable:true },
  { id:6149,  name:"Greater Mana Potion",     cat:"Light Potion", kind:"potion", role:"skill 195 · caster fuel",  est:6, vel:6, v:true,
    mats:[{h:3358,q:1},{h:3821,q:1},{r:8925,q:1}], tradeable:true },
  { id:13444, name:"Major Mana Potion",      cat:"Light Potion", kind:"potion", role:"skill 260 · raid healer",   est:13, vel:7, v:true,
    mats:[{h:8839,q:1},{h:8839,q:1},{r:8925,q:1}], tradeable:true },
  { id:2454,  name:"Elixir of Lion's Strength",cat:"Void Potion", kind:"elixir", role:"skill 1 · +Strength",     est:1, vel:4, v:true,
    mats:[{h:765,q:1},{r:3371,q:1}], tradeable:true },
  { id:3382,  name:"Elixir of Minor Fortitude",cat:"Void Potion", kind:"elixir", role:"skill 50 · +Health",      est:2, vel:4, v:true,
    mats:[{h:2447,q:2},{r:3372,q:1}], tradeable:true },
  { id:3389,  name:"Elixir of Fortitude",     cat:"Void Potion", kind:"elixir", role:"skill 175 · +Health buff", est:5, vel:6, v:true,
    mats:[{h:8836,q:1},{h:2449,q:1},{r:3372,q:1}], tradeable:true },
  { id:8949,  name:"Elixir of Agility",       cat:"Void Potion", kind:"elixir", role:"skill 165 · +Agility",     est:5, vel:6, v:true,
    mats:[{h:3818,q:1},{h:3358,q:1},{r:3372,q:1}], tradeable:true },
  { id:9187,  name:"Elixir of Greater Intellect",cat:"Void Potion", kind:"elixir", role:"skill 175 · +Int",      est:5, vel:5, v:true,
    mats:[{h:3358,q:1},{r:3372,q:1}], tradeable:true },
  { id:9264,  name:"Elixir of Shadow Power",  cat:"Void Potion", kind:"elixir", role:"skill 265 · +Shadow dmg",  est:12, vel:5, v:true,
    mats:[{h:8836,q:3},{r:8925,q:1}], tradeable:true },
  { id:11390, name:"Arcane Elixir",           cat:"Void Potion", kind:"elixir", role:"skill 210 · +Spell dmg",   est:9, vel:6, v:true,
    mats:[{h:8839,q:1},{r:8925,q:1}], tradeable:true },
  { id:9224,  name:"Elixir of Demonslaying",  cat:"Void Potion", kind:"elixir", role:"skill 200 · vs demons",    est:6, vel:3, v:true,
    mats:[{h:8836,q:1},{h:8836,q:1},{r:3372,q:1}], tradeable:true },
  { id:3390,  name:"Elixir of Lesser Agility", cat:"Void Potion", kind:"elixir", role:"skill 100 · +Agility",    est:3, vel:4, v:true,
    mats:[{h:2449,q:1},{h:2450,q:1},{r:3372,q:1}], tradeable:true },
];
// Vanilla herb zones (retail old-world, curated) — where classic herbs still grow.
const VAN_ZONES = [
  {name:"Elwynn & Durotar",difficulty:"gentle",mote:"starter herbs",color:C.ochre,terrain:"woods",notes:"the starting zones · Peacebloom, Silverleaf, Earthroot · skill 1-70",
   nodes:[[24,32],[40,28],[56,36],[70,30],[80,44],[68,58],[50,64],[34,58],[24,46]],river:[[14,48],[38,52],[62,50],[84,54]]},
  {name:"The Hinterlands",difficulty:"trying",mote:"mid herbs",color:C.verdigris,terrain:"thicket",notes:"Khadgar's Whisker, Goldthorn, Fadeleaf · the mid-range farm · skill 150-230",
   nodes:[[28,30],[46,26],[62,34],[76,28],[82,46],[66,60],[48,66],[30,58],[22,44]],river:[]},
  {name:"Felwood",difficulty:"severe",mote:"high herbs",color:C.plum,terrain:"void",notes:"Sungrass, Dreamfoil, Plaguebloom · the high-end supply · skill 230-300",
   nodes:[[26,34],[44,30],[60,38],[74,32],[82,50],[68,62],[50,66],[32,60],[24,50]],river:[[16,54],[40,58],[64,54],[84,58]]},
  {name:"Winterspring & Un'Goro",difficulty:"severe",mote:"premium herbs",color:C.ink2,terrain:"ruins",notes:"Mountain Silversage, Icecap, Golden Sansam · the richest old-world grounds",
   nodes:[[30,26],[50,22],[68,28],[78,44],[72,58],[56,68],[40,64],[26,50],[46,46]],river:[]},
];
const VAN_HERB_NOTE = {
  13467:"protection-pot herb · lowest volume, hold for buyers",
  13465:"top-tier · the richest old-world herb still worth picking",
  8838:"the Major-potion workhorse · always wanted",
  2447:"free starter · move in bulk to new alchemists",
  765:"free starter · pairs with Peacebloom",
  8836:"shadow & demon pots lean on it",
};
const VAN_ALCH_NOTE = {
  potion:"Major Healing Potion is the classic gold-maker that's still retail-craftable.",
  elixir:"the removed raid flasks & Arcanite aren't here — they no longer craft on retail.",
  note:"prices are curated relative estimates. The retail classic AH is near-dead, so treat these as 'what's worth more', not live gold.",
};
// Vanilla formulary (retail-craftable Classic Alchemy recipes).
const VAN_BOOK = VAN_PRODUCTS.map(p=>({
  cat:p.cat, name:p.name, effect:p.role, tree:"Classic Alchemy",
  unlock:"trained from an old-world Alchemy trainer (Classic Alchemy proficiency)",
  mats:p.mats, craftNote:"curated estimate · no live pricing on retail classic", bound:false, mc:false, kind:p.kind,
}));
const VAN_ACHIEVEMENTS = [
  {name:"Classic Alchemy: Artisan",req:"reach 225 Classic Alchemy (level 35+)",reward:"the top old-world recipes",type:"Recipe",note:"the retail proficiency caps at 300",confirmed:true},
  {name:"Old-world herb sweep",req:"gather every retail-available classic herb",reward:"a leveling supply",type:"Knowledge",note:"herbs still grow in the old zones",confirmed:true},
];
const VANILLA_DS = {
  herbs:VAN_HERBS, reagents:VAN_REAGENTS, products:VAN_PRODUCTS, book:VAN_BOOK, dyes:[],
  bookCats:["All","Light Potion","Void Potion"], waypoints:{},
  herbNote:VAN_HERB_NOTE, alchNote:VAN_ALCH_NOTE,
  furniture:{facts:["Classic Alchemy on retail makes no housing decor — that system is modern-expansion only.","This book is a gathering & consumable reference: the old 1-300 recipes a retail character can still train and brew."], earned:[], crafted:[]},
  achievements:VAN_ACHIEVEMENTS, zones:VAN_ZONES, specTrees:{herb:{label:"Herbalism",accent:C.verdigris,cap:0,branches:[]},alch:{label:"Alchemy",accent:C.ochreDeep,cap:0,branches:[]}},
  kpHerb:KP_HERB, kpAlch:KP_ALCH, concFacts:CONC_FACTS,
};

const DATASETS = { midnight:MIDNIGHT_DS, tww:TWW_DS, vanilla:VANILLA_DS };

// swap every live binding the app reads to the chosen expansion's set.
function loadExpansion(key){
  const d = DATASETS[key] || MIDNIGHT_DS;
  HERBS=d.herbs; REAGENTS=d.reagents; PRODUCTS=d.products; BOOK=d.book; DYES=d.dyes;
  BOOK_CATS=d.bookCats; WAYPOINTS=d.waypoints; HERB_NOTE=d.herbNote; ALCH_NOTE=d.alchNote;
  FURNITURE=d.furniture; ACHIEVEMENTS=d.achievements; ZONES=d.zones; SPEC_TREES=d.specTrees;
  KP_HERB=d.kpHerb; KP_ALCH=d.kpAlch; CONC_FACTS=d.concFacts;
  MOTES=REAGENTS.filter(r=>r.kind==="mote");
  HERB=id=>HERBS.find(h=>h.id===id);
  REAGENT=id=>REAGENTS.find(r=>r.id===id);
  MAT=id=>HERB(id)||REAGENT(id);
}
// stylized field-journal botanicals (Gilshi's own drawings), grounded in
// lore where it exists — not claimed as screen-accurate game art.
const FORM = {
  236761:{form:"bellbloom", green:"#7c8a55", flower:"#e2cf86"}, // Tranquility Bloom — riverside bells
  236776:{form:"silverfern",green:"#8a9472", flower:"#d2d6c0"}, // Argentleaf — silver frond
  236774:{form:"root",      green:"#9a7d52", flower:"#b89a64"}, // Azeroot — knotted root
  236778:{form:"lily",      green:"#6f7f86", flower:"#a8b8c6"}, // Mana Lily — true lily
  236770:{form:"bramble",   green:"#6e5642", flower:"#9c4a3c"}, // Sanguithorn — blood bramble
  236780:{form:"lotus",     green:"#54657f", flower:"#8a76aa"}, // Nocturnal Lotus — dark lotus
};
function pressedOf(id){ const h=HERB(id)||{}; const f=FORM[id]||{form:"bellbloom",green:C.green,flower:C.ochre}; return {...f, no:h.no||"", name:h.name||""}; }
// TWW herb silhouettes — reuse the Midnight form shapes, retinted per herb
Object.assign(FORM, {
  210796:{form:"silverfern", green:"#7c8a55", flower:"#c8b87a"}, // Mycobloom — fungus
  210805:{form:"bellbloom",  green:"#8a9c72", flower:"#e6d68a"}, // Blessing Blossom
  210808:{form:"silverfern", green:"#6b7d4e", flower:"#b0bc8a"}, // Arathor's Spear — fern
  210799:{form:"lily",      green:"#5a7d7a", flower:"#7aa6c0"}, // Luredrop — carnivorous
  210802:{form:"lotus",      green:"#6a5a82", flower:"#a98ac0"}, // Orbinid — purple bloom
  213197:{form:"lotus",      green:"#4a4458", flower:"#8a84a0"}, // Null Lotus — premium
});
// Vanilla classic herbs — reuse form shapes, retinted to the old-world palette
Object.assign(FORM, {
  765:  {form:"silverfern", green:"#8a9472", flower:"#d2d6c0"}, // Silverleaf
  2447: {form:"bellbloom",  green:"#8a9c72", flower:"#e6dca0"}, // Peacebloom
  2449: {form:"root",       green:"#9a7d52", flower:"#b89a64"}, // Earthroot
  2450: {form:"lily",       green:"#7a6a8c", flower:"#b09ac0"}, // Mageroyal
  2453: {form:"bramble",    green:"#6b7d4e", flower:"#9caa72"}, // Bruiseweed
  3355: {form:"silverfern", green:"#7c8a6a", flower:"#c0c8a8"}, // Wild Steelbloom
  3818: {form:"lily",       green:"#5a6a70", flower:"#9ab0b8"}, // Fadeleaf
  3821: {form:"bellbloom",  green:"#8a7a3a", flower:"#d4b45a"}, // Goldthorn
  3358: {form:"bramble",    green:"#7a6a4a", flower:"#c0a060"}, // Khadgar's Whisker
  8836: {form:"lotus",      green:"#5a4a68", flower:"#9a7ab0"}, // Arthas' Tears
  8838: {form:"bellbloom",  green:"#9aa25a", flower:"#e2d47a"}, // Sungrass
  8839: {form:"lily",       green:"#6a7d5a", flower:"#a8bc80"}, // Blindweed
  13463:{form:"silverfern", green:"#5a6a70", flower:"#9ab0c0"}, // Dreamfoil
  13464:{form:"bellbloom",  green:"#8a7a3a", flower:"#e0c060"}, // Golden Sansam
  13465:{form:"silverfern", green:"#6a7a80", flower:"#b8c8d0"}, // Mountain Silversage
  13466:{form:"lotus",      green:"#5a4a58", flower:"#9a7a98"}, // Plaguebloom
  13467:{form:"root",       green:"#7a8a90", flower:"#c0d0d8"}, // Icecap
});

function Pressed({ id, s, size=110 }){
  const sp = s || pressedOf(id);
  const k = sp.no || id || "x";
  const G = "url(#st"+k+")", F = "url(#pr"+k+")", AG = "url(#ag"+k+")";
  return (
    <svg viewBox="0 0 120 150" width={size} height={size*1.25} style={{display:"block", filter:"saturate(0.8)"}} aria-hidden="true">
      <defs>
        <radialGradient id={"pr"+k} cx="50%" cy="42%" r="62%"><stop offset="0%" stopColor={sp.flower} stopOpacity="0.96"/><stop offset="100%" stopColor={sp.green} stopOpacity="0.9"/></radialGradient>
        <linearGradient id={"st"+k} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sp.green}/><stop offset="100%" stopColor={C.greenDk}/></linearGradient>
        <filter id={"ag"+k}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.4 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="over"/></filter>
      </defs>
      <ellipse cx="60" cy="80" rx="44" ry="60" fill={C.foxing} opacity="0.15"/>

      {sp.form==="bellbloom"&&<g filter={AG}>
        {/* arching stem with drooping bell-blossoms — a calm riverside flower */}
        <path d="M60 134 C58 108 54 86 60 58 C63 44 60 34 60 30" stroke={G} strokeWidth="2.2" fill="none"/>
        {[[44,52,-20],[74,60,18],[52,40,-10],[68,44,12]].map(([x,y,r],i)=>(
          <g key={i} transform={"rotate("+r+" "+x+" "+y+")"}>
            <path d={"M"+x+" "+(y-8)+" C"+(x-7)+" "+(y-2)+" "+(x-7)+" "+(y+8)+" "+x+" "+(y+11)+" C"+(x+7)+" "+(y+8)+" "+(x+7)+" "+(y-2)+" "+x+" "+(y-8)+" Z"} fill={F} opacity="0.92"/>
            <path d={"M"+x+" "+(y+11)+" l-3 4 M"+x+" "+(y+11)+" l3 4 M"+x+" "+(y+11)+" l0 5"} stroke={sp.flower} strokeWidth="1" opacity="0.8"/>
          </g>
        ))}
        <path d="M58 96 C46 92 40 98 36 106 C46 104 53 100 58 98 Z" fill={sp.green} opacity="0.85"/>
      </g>}

      {sp.form==="silverfern"&&<g filter={AG}>
        {/* a frond: central rachis with paired silver leaflets */}
        <path d="M60 138 C60 104 60 70 60 34" stroke={G} strokeWidth="1.8" fill="none"/>
        {Array.from({length:9}).map((_,i)=>{const y=40+i*11; const len=26-i*2.2;
          return <g key={i}>
            <path d={"M60 "+y+" Q"+(60-len*0.6)+" "+(y-2)+" "+(60-len)+" "+(y+6)} stroke={sp.flower} strokeWidth="2.4" fill="none" opacity="0.85" strokeLinecap="round"/>
            <path d={"M60 "+y+" Q"+(60+len*0.6)+" "+(y-2)+" "+(60+len)+" "+(y+6)} stroke={sp.green} strokeWidth="2.4" fill="none" opacity="0.8" strokeLinecap="round"/>
          </g>;})}
        <circle cx="60" cy="34" r="3" fill={sp.flower} opacity="0.7"/>
      </g>}

      {sp.form==="root"&&<g filter={AG}>
        {/* a knotted taproot with hairy tendrils and a few leaves up top */}
        <path d="M60 40 C56 56 66 64 60 82 C55 98 64 110 58 128 C57 134 60 138 60 138" stroke={G} strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M60 40 C56 56 66 64 60 82 C55 98 64 110 58 128" stroke={sp.flower} strokeWidth="2" fill="none" opacity="0.4"/>
        {[[60,70,-1],[60,96,1],[58,118,-1]].map(([x,y,d],i)=>(<g key={i}>
          <path d={"M"+x+" "+y+" q"+(d*-16)+" 4 "+(d*-22)+" 14"} stroke={sp.green} strokeWidth="1.4" fill="none" opacity="0.7"/>
          <path d={"M"+x+" "+y+" q"+(d*16)+" 5 "+(d*20)+" 16"} stroke={sp.green} strokeWidth="1.4" fill="none" opacity="0.7"/>
        </g>))}
        {[[-1],[1]].map(([d],i)=>(<path key={i} d={"M60 40 C"+(60+d*10)+" 30 "+(60+d*16)+" 26 "+(60+d*12)+" 18 C"+(60+d*6)+" 24 "+(60+d*2)+" 30 60 40 Z"} fill={sp.green} opacity="0.8"/>))}
      </g>}

      {sp.form==="lily"&&<g filter={AG}>
        {/* a true lily: six recurved petals + stamens */}
        <path d="M60 134 C59 108 60 88 60 74" stroke={G} strokeWidth="2.2" fill="none"/>
        {Array.from({length:6}).map((_,i)=>{const a=(i/6)*Math.PI*2 - Math.PI/2;
          const tx=60+Math.cos(a)*30, ty=66+Math.sin(a)*30;
          return <path key={i} d={"M60 66 Q"+(60+Math.cos(a)*10-Math.sin(a)*7)+" "+(66+Math.sin(a)*10+Math.cos(a)*7)+" "+tx+" "+ty+" Q"+(60+Math.cos(a)*10+Math.sin(a)*7)+" "+(66+Math.sin(a)*10-Math.cos(a)*7)+" 60 66 Z"} fill={F} opacity="0.9"/>;})}
        {Array.from({length:5}).map((_,i)=>{const a=(i/5)*Math.PI*2;return <line key={i} x1="60" y1="66" x2={60+Math.cos(a)*9} y2={66+Math.sin(a)*9} stroke={C.greenDk} strokeWidth="1" opacity="0.7"/>;})}
        <circle cx="60" cy="66" r="3.5" fill={sp.green}/>
        <path d="M59 92 C48 90 42 96 39 104 C49 102 55 98 59 95 Z" fill={sp.green} opacity="0.8"/>
      </g>}

      {sp.form==="bramble"&&<g filter={AG}>
        {/* a thorned blood-bramble with sharp barbs and red sap beads */}
        <path d="M60 136 C54 112 66 92 56 70 C52 60 58 50 58 42" stroke={G} strokeWidth="2.8" fill="none"/>
        {[126,112,98,84,70,56].map((y,i)=>{const d=i%2?1:-1; return <path key={i} d={"M60 "+y+" l"+(d*15)+" -7 l"+(d*-4)+" 5"} stroke={C.greenDk} strokeWidth="1.6" fill="none" strokeLinecap="round"/>;})}
        <circle cx="58" cy="42" r="8.5" fill={F} opacity="0.92"/>
        <circle cx="58" cy="42" r="8.5" fill="none" stroke={C.sanguine} strokeWidth="0.6"/>
        {[[64,60],[52,76],[68,90]].map(([x,y],i)=>(<g key={i}><ellipse cx={x} cy={y} rx="2.6" ry="4" fill={C.sanguine} opacity="0.5"/><circle cx={x} cy={y-3} r="1.2" fill={C.sanguine} opacity="0.6"/></g>))}
      </g>}

      {sp.form==="lotus"&&<g filter={AG}>
        {/* a dark, luminous many-petaled lotus — the rare one */}
        <ellipse cx="60" cy="70" rx="30" ry="22" fill={sp.green} opacity="0.18"/>
        {Array.from({length:10}).map((_,i)=>{const a=(i/10)*Math.PI*2;return <path key={i} d={"M60 70 Q"+(60+Math.cos(a)*9)+" "+(70+Math.sin(a)*9)+" "+(60+Math.cos(a)*30)+" "+(70+Math.sin(a)*30)+" Q"+(60+Math.cos(a+0.18)*9)+" "+(70+Math.sin(a+0.18)*9)+" 60 70 Z"} fill={F} opacity="0.78"/>;})}
        {Array.from({length:6}).map((_,i)=>{const a=(i/6)*Math.PI*2+0.3;return <path key={i} d={"M60 70 Q"+(60+Math.cos(a)*7)+" "+(70+Math.sin(a)*7)+" "+(60+Math.cos(a)*18)+" "+(70+Math.sin(a)*18)+" Q"+(60+Math.cos(a+0.25)*7)+" "+(70+Math.sin(a+0.25)*7)+" 60 70 Z"} fill={sp.flower} opacity="0.6"/>;})}
        <circle cx="60" cy="70" r="7" fill={sp.flower}/><circle cx="60" cy="70" r="7" fill="none" stroke={C.greenDk} strokeWidth="0.6"/>
        <circle cx="60" cy="70" r="11" fill="none" stroke={sp.flower} strokeWidth="0.6" opacity="0.4"/>
        <path d="M60 98 C58 112 60 126 60 136" stroke={G} strokeWidth="2.2" fill="none"/>
      </g>}
    </svg>
  );
}

// a small glass vessel for crafted goods (kept simple, journal-toned)
function Vial({ kind="potion", color=C.green, size=30 }){
  return <svg viewBox="0 0 40 50" width={size} height={size*1.25} aria-hidden="true">
    {kind==="flask"&&<><path d="M16 6 h8 v10 l6 18 a6 6 0 0 1-6 8 h-8 a6 6 0 0 1-6-8 l6-18 z" fill={color} opacity="0.3" stroke={C.ink} strokeWidth="1.2"/><rect x="15" y="3" width="10" height="4" fill={C.ink}/></>}
    {kind==="vial"&&<><rect x="14" y="6" width="12" height="32" rx="5" fill={color} opacity="0.3" stroke={C.ink} strokeWidth="1.2"/><rect x="15" y="3" width="10" height="4" fill={C.ink}/></>}
    {kind==="potion"&&<><path d="M14 14 h12 v4 l4 16 a8 8 0 0 1-20 0 l4-16 z" fill={color} opacity="0.32" stroke={C.ink} strokeWidth="1.2"/><rect x="16" y="8" width="8" height="6" fill="none" stroke={C.ink} strokeWidth="1.2"/></>}
    {kind==="cauldron"&&<><path d="M8 20 a12 12 0 0 0 24 0 z" fill={color} opacity="0.3" stroke={C.ink} strokeWidth="1.2"/><ellipse cx="20" cy="20" rx="12" ry="3.5" fill="none" stroke={C.ink} strokeWidth="1.2"/></>}
  </svg>;
}

function Tape({ w=52, rot=0, style }){
  return <div style={{position:"absolute", width:w, height:17, background:C.tape, transform:"rotate("+rot+"deg)", boxShadow:"0 1px 2px rgba(60,46,31,0.12)", borderLeft:"1px solid rgba(255,255,255,0.25)", ...style}} aria-hidden="true"/>;
}
function PaperGrain({ side="left" }){
  // NO blend modes — mobile Safari drops them inside transformed 3D containers.
  // Everything here is plain opacity over the base, so it always paints.
  const gx = side==="left" ? "78%" : "22%";  // clean-ish center sits away from spine
  return <div style={{position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden"}} aria-hidden="true">
    {/* visible tonal swing: bright near center, browned & dingy toward edges */}
    <div style={{position:"absolute", inset:0, background:
      "radial-gradient(115% 125% at "+gx+" 42%, #f2e9d0 0%, #e7d9bb 38%, #d8c49a 72%, #c4ab7c 90%, #b09865 100%)"}}/>
    {/* blotchy aging — solid blurred patches, opacity you can actually see */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}}>
      <defs><filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <g filter="url(#bl)">
        <ellipse cx="20%" cy="16%" rx="60" ry="44" fill="#b89a68" opacity="0.30"/>
        <ellipse cx="83%" cy="30%" rx="50" ry="60" fill="#a98a5c" opacity="0.26"/>
        <ellipse cx="68%" cy="72%" rx="80" ry="56" fill="#bda06e" opacity="0.28"/>
        <ellipse cx="32%" cy="84%" rx="64" ry="40" fill="#a8895a" opacity="0.24"/>
        <ellipse cx="50%" cy="48%" rx="46" ry="40" fill="#cbb585" opacity="0.18"/>
        <ellipse cx="12%" cy="58%" rx="40" ry="60" fill="#b0915f" opacity="0.22"/>
      </g>
    </svg>
    {/* a couple of real, visible stains — a tea ring and a dark spot */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}}>
      <defs><filter id="sb"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
      <circle cx="72%" cy="26%" r="30" fill="none" stroke="#9c7c4e" strokeWidth="3.5" opacity="0.30" filter="url(#sb)"/>
      <circle cx="72%" cy="26%" r="30" fill="#b89a68" opacity="0.08"/>
      <ellipse cx="28%" cy="40%" rx="7" ry="9" fill="#7a5f3a" opacity="0.22" filter="url(#sb)"/>
      <ellipse cx="60%" cy="62%" rx="4" ry="5" fill="#6e5436" opacity="0.20" filter="url(#sb)"/>
    </svg>
    {/* fiber speckle — fine, but at real opacity so it's not invisible */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.6}}>
      <filter id="fib"><feTurbulence type="fractalNoise" baseFrequency="0.45 0.6" numOctaves="2" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 0.38 0 0 0 0 0.30 0 0 0 0 0.18 0 0 0 0.16 0"/></filter>
      <rect width="100%" height="100%" filter="url(#fib)"/>
    </svg>
    {/* dark, irregular edge — the page is grubbier at its borders & spine */}
    <div style={{position:"absolute", inset:0, boxShadow:"inset 0 0 28px rgba(74,54,30,0.38), inset 0 0 70px rgba(90,68,40,0.18)"}}/>
    {/* the gutter side is dirtiest */}
    <div style={{position:"absolute", top:0, bottom:0, [side==="left"?"left":"right"]:0, width:"30%",
      background:"linear-gradient("+(side==="left"?"90deg":"270deg")+", rgba(74,54,30,0.34), rgba(74,54,30,0.10) 50%, transparent)"}}/>
  </div>;
}
function GhostWriting(){
  return <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.07, pointerEvents:"none"}} aria-hidden="true">
    {Array.from({length:11}).map((_,i)=>(<line key={i} x1="14%" x2={62+(i%4)*7+"%"} y1={22+i*6+"%"} y2={22+i*6+"%"} stroke="#5a4530" strokeWidth="1.4"/>))}
  </svg>;
}
function Hand({ children, color=C.greenDk, size=14, tilt=-0.5, style }){
  return <div style={{fontFamily:HAND, fontSize:size, color, transform:"rotate("+tilt+"deg)", lineHeight:1.4, ...style}}>{children}</div>;
}
function Eyebrow({ children }){
  return <div style={{fontFamily:DISPLAY, fontSize:11, letterSpacing:3, textTransform:"uppercase", color:C.inkFaint}}>{children}</div>;
}
function Title({ children, size=25 }){
  return <h2 style={{fontFamily:DISPLAY, fontSize:size, fontWeight:400, margin:"8px 0 10px", color:C.ink, fontStyle:"italic"}}>{children}</h2>;
}
function Coin({ value, loading, size=15 }){
  if(loading) return <span style={{fontStyle:"italic", color:C.inkFaint}}>…</span>;
  if(value==null) return <span style={{fontStyle:"italic", color:C.inkFaint, fontSize:size-3}}>not sold</span>;
  return <span style={{fontFamily:DISPLAY, fontSize:size, color:C.sanguine}}>{fmtG(value)}<span style={{fontSize:size-4, fontStyle:"italic"}}> g</span></span>;
}
function Tag({ children, color=C.ink, small }){
  return <span style={{display:"inline-block", fontFamily:DISPLAY, fontSize:small?10.5:12, fontStyle:"italic", color, border:"1px solid "+color, borderRadius:2, padding:small?"1px 6px":"2px 8px", opacity:0.92}}>{children}</span>;
}
const pad = { padding:"30px 32px 26px", height:"100%", boxSizing:"border-box", display:"flex", flexDirection:"column" };

/* ── OVERVIEW — the page you land on, a night's plan at a glance ── */
function Overview({ price, loading, live, go, meta }){
  const herbs = rankHerbs(price).slice(0,10);
  const craft = rankCraft(price).slice(0,10);
  return <div style={pad}>
    <Hand size={15} color={C.green} tilt={-1} style={{marginBottom:2}}>before i set out tonight —</Hand>
    <h1 style={{fontFamily:DISPLAY, fontSize:"clamp(24px,4vw,32px)", fontWeight:400, margin:"2px 0 4px", color:C.ink, lineHeight:1.05}}>The night's plan</h1>
    <div style={{fontFamily:DISPLAY, fontSize:12.5, fontStyle:"italic", color:C.inkFaint, marginBottom:16}}>what's selling best, and what's worth the making</div>

    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
      <Eyebrow>gather these first · top 10 by coin</Eyebrow>
    </div>
    <div style={{margin:"7px 0 16px"}}>
      {herbs.map((r,i)=>(
        <div key={r.id} onClick={()=>go("worth")} style={{display:"flex", gap:11, alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
          <span style={{fontFamily:DISPLAY, fontSize:16, fontStyle:"italic", color:i===0?C.sanguine:C.rule, minWidth:18}}>{i+1}</span>
          <Pressed id={r.id} size={26}/>
          <span style={{flex:1, fontFamily:DISPLAY, fontSize:14.5, color:C.ink}}>{r.item.name}</span>
          <Coin value={r.price} loading={loading} size={14}/>
        </div>
      ))}
    </div>

    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
      <Eyebrow>worth the making · top 10</Eyebrow>
      <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:C.inkFaint}}>what they sell for</span>
    </div>
    <div style={{margin:"7px 0 14px"}}>
      {craft.map((r,i)=>(
        <div key={r.id} onClick={()=>go("worth")} style={{display:"flex", gap:11, alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
          <span style={{fontFamily:DISPLAY, fontSize:16, fontStyle:"italic", color:i===0?C.sanguine:C.rule, minWidth:18}}>{i+1}</span>
          <Vial kind={r.item.kind} color={C.ochre} size={24}/>
          <span style={{flex:1, fontFamily:DISPLAY, fontSize:14.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{r.item.name}</span>
          <div style={{display:"flex", gap:12, alignItems:"center", flexShrink:0}}>
            <span style={{display:"inline-flex", alignItems:"center", gap:4, fontFamily:DISPLAY, fontSize:14}}><QGold size={12}/> <span style={{color:C.ochreDeep}}>{loading?"…":(r.saleGold==null?<span style={{fontSize:10, fontStyle:"italic", color:C.inkFaint}}>—</span>:fmtG(r.saleGold)+"g")}</span></span>
            <span style={{display:"inline-flex", alignItems:"center", gap:4, fontFamily:DISPLAY, fontSize:14}}><QSilver size={11}/> <span style={{color:C.ink2}}>{loading?"…":(r.saleSilver==null?"—":fmtG(r.saleSilver)+"g")}</span></span>
          </div>
        </div>
      ))}
    </div>

    <div style={{marginTop:"auto", display:"flex", gap:14, alignItems:"flex-start", paddingTop:10}}>
      <span style={{flexShrink:0}}><PriceStamp live={live} meta={meta}/></span>
      <Hand size={13} color={C.greenDk} tilt={-0.4} style={{flex:1}}>
        {live ? "the goblin market feeds these now. since i gather my own herbs, the gathered coin is what i truly keep." : "i set these by hand until the goblin market speaks."}
      </Hand>
    </div>
  </div>;
}
function OverviewRight({ go }){
  // a second leaf: this week's knowing + a couple reminders, in her voice
  return <div style={pad}>
    <Eyebrow>this week's knowing</Eyebrow>
    <Title size={21}>What the soil still owes</Title>
    <div style={{display:"flex", gap:20, marginBottom:14}}>
      <div><div style={{fontFamily:DISPLAY, fontSize:30, color:C.verdigris}}>{KP_HERB.weekOne}</div><div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>herb · first week</div></div>
      <div><div style={{fontFamily:DISPLAY, fontSize:30, color:C.ochreDeep}}>{KP_ALCH.weekOne}</div><div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>alchemy · first week</div></div>
    </div>
    <p style={{fontFamily:BODY, fontSize:13, lineHeight:1.7, color:C.inkSoft, margin:"0 0 14px"}}>
      The soil is generous at the start and stingy after. I claim every treasure and every first-gather while the pages are still mine alone, then settle into the dozen-a-week trickle.
    </p>
    <div onClick={()=>go("knowing")} style={{cursor:"pointer", fontFamily:DISPLAY, fontSize:13, color:C.sanguine, fontStyle:"italic", borderTop:"1px solid "+C.rule, paddingTop:10}}>
      the full reckoning, and where the treasures lie ›
    </div>
    <Hand size={14} color={C.greenDk} tilt={-0.6} style={{marginTop:16}}>
      remember: the eight treasures don't come twice. the dive with the ashes can wait — knowledge cannot.
    </Hand>
    <div style={{marginTop:"auto", position:"relative", paddingTop:20}}>
      <Tape w={40} rot={-18} style={{top:18, left:10}}/>
      <Pressed id={236780} size={70}/>
    </div>
  </div>;
}

/* ── SPECIMENS → a clickable herb-price gallery (drawings made functional) ── */
function SpecLeft({ price, loading, go }){
  // richest herb by live (or est) price, computed not hardcoded
  const richest=[...HERBS].map(h=>({id:h.id, p: price?(price(h.id)??h.est??0):(h.est??0)})).sort((a,b)=>b.p-a.p)[0];
  return <div style={pad}>
    <Eyebrow>the herb gallery</Eyebrow>
    <Title size={26}>What the soil gives up</Title>
    <p style={{fontFamily:BODY, fontSize:13.5, lineHeight:1.75, color:C.inkSoft, margin:"0 0 14px"}}>
      Every leaf here i pressed and drew myself, by lamplight. Beside each i keep its going rate, so a tired night never tempts me to sell the rare ones cheap. Tap any leaf to weigh it against the rest on the gathering page.
    </p>
    <div style={{fontFamily:DISPLAY, fontSize:11, letterSpacing:1, textTransform:"uppercase", color:C.inkFaint, marginBottom:8}}>tonight's richest leaf</div>
    <SpecMount id={richest.id} price={price} loading={loading} go={go} feature/>
    <Hand size={14.5} style={{marginTop:16}}>the rare one pays for the whole night. know it on sight.</Hand>
  </div>;
}
function SpecRight({ price, loading, go }){
  // richest first, and DROP the one featured on the left page (no repeat)
  const sorted=[...HERBS].map(h=>({id:h.id, p: price?(price(h.id)??h.est??0):(h.est??0)})).sort((a,b)=>b.p-a.p);
  const featured=sorted[0]?.id;
  const order=sorted.slice(1).map(x=>x.id); // skip the featured leaf
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
      <Eyebrow>the rest of the pressing</Eyebrow><Hand size={13} color={C.green} tilt={0}>richest first</Hand>
    </div>
    <div style={{overflowY:"auto", flex:1}}>{order.map(id=><SpecMount key={id} id={id} price={price} loading={loading} go={go}/>)}</div>
  </div>;
}
const HERB_HAND = {
  236761:"plentiful by the rivers. keeps its colour best of any.",
  236776:"never let it brown, or the flask-work spoils.",
  236774:"a workaday root. always wanted, never dear.",
  236778:"the scribes want it too — two markets for one stoop.",
  236770:"it drew blood again. the red sap stains the page.",
  236780:"one in a whole season. never, ever sell it cheap.",
};
function SpecMount({ id, mini, feature, price, loading, go }){
  const h=HERB(id);
  const pa = price ? (price(h.id) ?? null) : null;
  const pb = (price && h.gid) ? (price(h.gid) ?? null) : null;
  const both=[pa,pb].filter(v=>v!=null);
  const gold = both.length?Math.max(...both):(h.est??null);
  const silver = both.length>1?Math.min(...both):(both.length?both[0]:(h.est??null));
  const sz = feature?86:80;
  return <div onClick={()=>go&&go("worth")} style={{position:"relative", padding:"6px 4px 12px", marginBottom:feature?0:2, cursor:go?"pointer":"default", borderBottom:feature?"none":"1px solid "+C.ruleSoft}}>
    <Tape w={48} rot={-7} style={{top:-5, left:14}}/>{!feature&&<Tape w={48} rot={6} style={{top:-5, right:14}}/>}
    <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
      <div style={{flexShrink:0}}><Pressed id={id} size={sz}/></div>
      <div style={{flex:1, paddingTop:4}}>
        <h3 style={{fontFamily:DISPLAY, fontSize:17, fontWeight:400, margin:0, color:C.ink, fontStyle:"italic"}}>{h.name}</h3>
        <div style={{fontFamily:DISPLAY, fontSize:11.5, fontStyle:"italic", color:C.inkFaint, marginBottom:5}}>{h.latin} · № {h.no}</div>
        {/* gold first, then silver */}
        <div style={{display:"flex", gap:14, alignItems:"center"}}>
          <span style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:DISPLAY}}><QGold/> <span style={{color:C.ochreDeep, fontSize:15}}>{loading?"…":(gold==null?<span style={{fontSize:11, fontStyle:"italic", color:C.inkFaint}}>—</span>:fmtG(gold)+"g")}</span></span>
          <span style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:DISPLAY}}><QSilver/> <span style={{color:C.ink2, fontSize:15}}>{loading?"…":(silver==null?<span style={{fontSize:11, fontStyle:"italic", color:C.inkFaint}}>not listed</span>:fmtG(silver)+"g")}</span></span>
        </div>
        <Hand size={13} style={{marginTop:5}}>{HERB_HAND[id]}</Hand>
      </div>
    </div>
  </div>;
}

/* ── WORTH (Field Notes · live ranking · numbers stay plain) ── */
function fmtAgo(ts){
  if(!ts) return "";
  const m=Math.round((Date.now()-ts)/60000);
  if(m<1) return "just now"; if(m<60) return m+"m ago";
  const h=Math.round(m/60); return h<24?h+"h ago":Math.round(h/24)+"d ago";
}
function PriceStamp({ live, meta }){
  if(!live) return <span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint}}>by my reckoning</span>;
  return <span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.verdigris, textAlign:"right", lineHeight:1.3}}>
    ● live · {meta&&meta.realm?meta.realm:"realm"}{meta&&meta.updated?<span style={{color:C.inkFaint}}><br/>updated {fmtAgo(meta.updated)}</span>:null}
  </span>;
}
function Worth({ price, loading, live, meta }){
  const [side,setSide]=useState("herb");
  const ranked = side==="herb"?rankHerbs(price):rankCraft(price);
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
      <Eyebrow>{side==="herb"?"what to gather · by coin":"what to make · by margin"}</Eyebrow>
      <PriceStamp live={live} meta={meta}/>
    </div>
    <div style={{display:"flex", gap:6, marginBottom:12}}>
      {[["herb","the gathering"],["alch","the making"]].map(([k,l])=>(
        <button key={k} onClick={()=>setSide(k)} style={{background:side===k?C.ink:"transparent", color:side===k?C.paper:C.inkSoft, border:"1px solid "+(side===k?C.ink:C.rule), padding:"4px 11px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12}}>{l}</button>
      ))}
    </div>
    <div style={{overflowY:"auto"}}>
      {ranked.map(r=>(
        <div key={r.id} style={{display:"flex", gap:12, alignItems:"center", padding:"10px 0", borderBottom:"1px solid "+C.ruleSoft}}>
          <span style={{fontFamily:DISPLAY, fontSize:22, fontStyle:"italic", color:r.rank===1?C.sanguine:C.rule, minWidth:22, textAlign:"right"}}>{r.rank}</span>
          <div style={{flexShrink:0}}>{side==="herb"?<Pressed id={r.id} size={36}/>:<Vial kind={r.item.kind} color={C.ochre} size={30}/>}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:DISPLAY, fontSize:15.5, color:C.ink}}>{r.item.name}</div>
            {side==="herb"
              ? <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.inkFaint, display:"flex", gap:14, alignItems:"center"}}>
                  <span><QGold/> {r.saleGold==null?<span style={{fontStyle:"italic", fontSize:11}}>not listed</span>:<span style={{color:C.ochreDeep, fontSize:15}}>{fmtG(r.saleGold)}g</span>}</span>
                  <span><QSilver/> <span style={{color:C.ink2, fontSize:15}}>{r.saleSilver==null?"—":fmtG(r.saleSilver)+"g"}</span></span>
                </div>
              : <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.inkFaint, display:"flex", gap:14, alignItems:"center"}}>
                  <span><QGold/> {r.saleGold==null?<span style={{fontStyle:"italic", fontSize:11}}>not listed</span>:<span style={{color:C.ochreDeep, fontSize:15}}>{fmtG(r.saleGold)}g</span>}</span>
                  <span><QSilver/> <span style={{color:C.ink2, fontSize:15}}>{r.saleSilver==null?"—":fmtG(r.saleSilver)+"g"}</span></span>
                </div>}
          </div>
        </div>
      ))}
    </div>
    <Hand size={12.5} color={C.greenDk} tilt={-0.4} style={{marginTop:10}}>
      {side==="herb" ? "set by sale, the busiest first when two pay the same." : "set by what's left after the herbs are paid for — the true coin, not the loud one."}
    </Hand>
  </div>;
}

/* ── KNOWING (Knowledge + waypoints · reading voice, copyable tools) ── */
function Knowing({ }){
  const [prof,setProf]=useState("herb");
  const [done,setDone]=useState({});
  const [openWays,setOpenWays]=useState(null);
  const [copied,setCopied]=useState(null);
  const copy=(t,id)=>{try{navigator.clipboard&&navigator.clipboard.writeText(t);}catch(e){} setCopied(id); setTimeout(()=>setCopied(null),1300);};
  const d=prof==="herb"?KP_HERB:KP_ALCH;
  const accent=prof==="herb"?C.verdigris:C.ochreDeep;
  const k=(s,n)=>prof+"-"+s+"-"+n;
  return <div style={pad}>
    <div style={{display:"flex", gap:6, marginBottom:10}}>
      {[["herb","herbalism"],["alch","alchemy"]].map(([key,l])=>(
        <button key={key} onClick={()=>setProf(key)} style={{background:prof===key?C.ink:"transparent", color:prof===key?C.paper:C.inkSoft, border:"1px solid "+(prof===key?C.ink:C.rule), padding:"4px 11px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12}}>{l}</button>
      ))}
    </div>
    <Eyebrow>what i've come to know</Eyebrow>
    <div style={{display:"flex", gap:18, margin:"6px 0 12px"}}>
      <div><span style={{fontFamily:DISPLAY, fontSize:26, color:accent}}>{d.weekOne}</span> <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>first week</span></div>
      <div><span style={{fontFamily:DISPLAY, fontSize:26, color:C.inkSoft}}>{d.weekly}</span> <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>each after</span></div>
    </div>
    <div style={{overflowY:"auto"}}>
      {[["gathered but once",d.oneTime,"one"],["each reset",d.weeklySources,"wk"],["once a month",d.monthly,"mo"]].map(([title,items,sk])=>(
        <div key={sk} style={{marginBottom:14}}>
          <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.ink, borderBottom:"1px solid "+C.rule, paddingBottom:3, marginBottom:4}}>{title}</div>
          {items.map((it,n)=>{const on=done[k(sk,n)]; const wk=sk+"-"+n; const tl=it.ways?WAYPOINTS[it.ways]:null;
            return <div key={n} style={{borderBottom:"1px solid "+C.ruleSoft}}>
              <div style={{display:"flex", gap:9, padding:"7px 0", alignItems:"center"}}>
                <span onClick={()=>setDone(p=>({...p,[k(sk,n)]:!on}))} style={{cursor:"pointer", flexShrink:0}}><Vial kind="vial" color={on?accent:C.inkFaint} size={20}/></span>
                <div style={{flex:1, cursor:"pointer"}} onClick={()=>setDone(p=>({...p,[k(sk,n)]:!on}))}>
                  <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
                    <span style={{fontFamily:DISPLAY, fontSize:14, color:C.ink, textDecoration:on?"line-through":"none", opacity:on?.5:1}}>{it.name}</span>
                    <span style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:accent}}>+{it.kp}</span>
                  </div>
                  <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, opacity:on?.5:1}}>{it.detail}</div>
                </div>
                {it.way&&<button onClick={()=>copy(it.way,wk)} style={wayChip(copied===wk,accent)}>{copied===wk?"copied":"way"}</button>}
                {tl&&<button onClick={()=>setOpenWays(openWays===wk?null:wk)} style={wayChip(openWays===wk,accent)}>8 ways {openWays===wk?"−":"+"}</button>}
              </div>
              {tl&&openWays===wk&&<div style={{padding:"2px 2px 10px 30px"}}>
                <button onClick={()=>copy(tl.map(x=>x.w).join("\n"),"all-"+wk)} style={{...wayChip(copied==="all-"+wk,accent), marginBottom:6}}>{copied==="all-"+wk?"copied all":"copy all 8"}</button>
                {tl.map((t,ti)=>(<div key={ti} onClick={()=>copy(t.w,wk+"-"+ti)} style={{display:"flex", gap:8, padding:"5px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
                  <code style={{fontFamily:"monospace", fontSize:10, color:C.ink, background:C.paperDeep, padding:"1px 5px", borderRadius:2, flexShrink:0}}>{t.w.replace(/^\/way /,"")}</code>
                  <span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkSoft, flex:1}}>{t.note}</span>
                </div>))}
              </div>}
            </div>;
          })}
        </div>
      ))}
    </div>
    <Hand size={13} color={accent} tilt={-0.4} style={{marginTop:8}}>tap a "way" to copy its mark — the eight treasures don't come twice.</Hand>
  </div>;
}
function wayChip(on,accent){
  return {flexShrink:0, background:on?accent:C.paperDeep, color:on?C.paper:C.inkSoft, border:"1px solid "+(on?accent:C.rule), padding:"3px 8px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:10};
}

/* ── FORMULARY (tool · plainer · full encyclopedia + prices) ── */
function FormularyPage({ price, loading }){
  const [cat,setCat]=useState("All");
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(null);
  const ql=q.trim().toLowerCase();
  const shown=BOOK.filter(r=>(cat==="All"||r.cat===cat)&&(!ql||r.name.toLowerCase().includes(ql)||r.effect.toLowerCase().includes(ql)));
  return <div style={pad}>
    <Eyebrow>the formulary · every receipt</Eyebrow>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="search by name or effect…" style={{width:"100%", boxSizing:"border-box", background:C.card, border:"1px solid "+C.rule, color:C.ink, fontFamily:BODY, fontSize:13.5, padding:"8px 11px", margin:"8px 0 10px"}}/>
    <div style={{display:"flex", gap:4, flexWrap:"wrap", marginBottom:12}}>
      {BOOK_CATS.map(t=><button key={t} onClick={()=>setCat(t)} style={{background:cat===t?C.ink:"transparent", color:cat===t?C.paper:C.inkSoft, border:"1px solid "+(cat===t?C.ink:C.rule), padding:"3px 9px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:10.5}}>{t}</button>)}
    </div>
    <div style={{overflowY:"auto"}}>
      {shown.map((r,i)=>{const isOpen=open===r.name; const hasM=r.mats&&r.mats.length>0;
        return <div key={i} style={{borderBottom:"1px solid "+C.ruleSoft}}>
          <div onClick={()=>setOpen(isOpen?null:r.name)} style={{display:"flex", gap:12, padding:"11px 0", cursor:"pointer", alignItems:"flex-start"}}>
            <div style={{flexShrink:0}}><Vial kind={r.kind} color={r.bound?C.plum:C.ochre} size={28}/></div>
            <div style={{flex:1}}>
              <div style={{display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap", alignItems:"center"}}>
                <h3 style={{fontFamily:DISPLAY, fontSize:16, fontWeight:400, margin:0, color:C.ink}}>{r.name}</h3>
                <div style={{display:"flex", gap:5, alignItems:"center"}}>{(()=>{const pr=PRODUCTS.find(p=>p.name===r.name); return pr?<VBadge verified={pr.v===true}/>:null;})()}{r.bound&&<Tag small color={C.plum}>bound</Tag>}{r.mc&&<Tag small color={C.verdigris}>multicrafts</Tag>}</div>
              </div>
              <div style={{fontFamily:BODY, fontSize:12.5, color:C.inkSoft, marginTop:2, lineHeight:1.5}}>{r.effect}</div>
              {(()=>{const pr=PRODUCTS.find(p=>p.name===r.name); const mats=(pr&&pr.mats)||r.mats; if(!mats||!mats.length)return null;
                return <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:7}}>{mats.map((m,j)=>{const id=m.h??m.r; const mat=MAT(id); if(!mat)return null; const isHerb=!!m.h;
                  return <span key={j} style={{display:"inline-flex", alignItems:"center", gap:4, background:C.paperDeep, border:"1px solid "+C.ruleSoft, padding:"2px 7px 2px 4px", borderRadius:3}}>
                    {isHerb?<Pressed id={id} size={16}/>:<span style={{width:8,height:8,borderRadius:"50%",background:mat.color||C.ochre,display:"inline-block"}}/>}
                    <span style={{fontFamily:DISPLAY, fontSize:11, color:C.ink}}>{m.q}× {mat.short||mat.name.split(" ")[0]}</span>
                    <span style={{fontFamily:DISPLAY, fontSize:10, color:C.ochreDeep}}>· {loading?"…":fmtG((price(id)??mat.est??0)*m.q)}g</span>
                  </span>;})}</div>;})()}
              {isOpen&&<div style={{marginTop:9, paddingTop:9, borderTop:"1px dashed "+C.rule, display:"flex", flexDirection:"column", gap:6}}>
                <div style={{fontSize:12, color:C.ink}}><i style={{color:C.inkFaint}}>tree</i> &nbsp;{r.tree}</div>
                <div style={{fontSize:12, color:C.ink}}><i style={{color:C.inkFaint}}>unlock</i> &nbsp;{r.unlock}</div>
                {r.craftNote&&<div style={{fontSize:11.5, color:C.inkFaint, fontStyle:"italic"}}><i>note</i> &nbsp;{r.craftNote}</div>}
              </div>}
            </div>
            <span style={{color:C.inkFaint, fontSize:13}}>{isOpen?"−":"+"}</span>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

/* ── THE SCALE (tool · margin calculator) ── */
function ScalePage({ price, loading }){
  const sellable=PRODUCTS.filter(p=>p.tradeable);
  const [pid,setPid]=useState(sellable[0]?.id);
  const [n,setN]=useState(20);
  if(!sellable.length) return <div style={pad}><Eyebrow>the scale · weigh a craft</Eyebrow><Title size={22}>Not yet in this journal</Title><p style={{fontFamily:BODY, fontSize:13, lineHeight:1.7, color:C.inkSoft}}>The crafting recipes for this expansion haven't been written in yet, so there's nothing to weigh. The gathering side, herbs and live prices, is live; the alchemy crafts are the next pass.</p></div>;
  const prod=PRODUCTS.find(p=>p.id===pid) || sellable[0];
  const pa=price(prod.id)??null, pb=prod.gid?(price(prod.gid)??null):null;
  const sale = (pa!=null||pb!=null) ? Math.max(pa??0,pb??0) : (prod.est??0);
  const herbCost = matCost((prod.mats||[]).filter(m=>m.h), price);
  const reagentCost = matCost((prod.mats||[]).filter(m=>m.r), price); // vials + motes, always paid
  const gathered = sale - reagentCost;     // herbs free, but vials/motes still cost
  const bought = sale - herbCost - reagentCost;
  const verified = prod.v===true;
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
      <Eyebrow>the scale · weigh a craft</Eyebrow>
      <VBadge verified={verified}/>
    </div>
    <Title size={22}>What it leaves in hand</Title>
    <div style={{display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap", marginBottom:14}}>
      <div><div style={{fontFamily:DISPLAY, fontSize:10.5, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>the craft</div>
        <select value={pid} onChange={e=>setPid(Number(e.target.value))} style={{background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:15, padding:"3px 0"}}>{sellable.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div><div style={{fontFamily:DISPLAY, fontSize:10.5, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>how many</div>
        <input type="number" min="1" value={n} onChange={e=>setN(Math.max(1,parseInt(e.target.value)||1))} style={{width:70, background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:18, padding:"2px 0"}}/>
      </div>
    </div>
    {/* the recipe, spelled out */}
    <div style={{display:"flex", gap:7, flexWrap:"wrap", marginBottom:12}}>
      {(prod.mats||[]).map((m,j)=>{const id=m.h??m.r; const mat=MAT(id); if(!mat)return null; const isHerb=!!m.h;
        return <span key={j} style={{display:"inline-flex", alignItems:"center", gap:5, background:C.paperDeep, border:"1px solid "+C.ruleSoft, padding:"3px 8px", borderRadius:3}}>
          {isHerb?<Pressed id={id} size={15}/>:<span style={{width:8,height:8,borderRadius:"50%",background:mat.color||C.ochre,display:"inline-block"}}/>}
          <span style={{fontFamily:DISPLAY, fontSize:11.5, color:C.ink}}>{m.q}× {mat.short || mat.name.split(" ")[0]}</span>
          <span style={{fontFamily:DISPLAY, fontSize:10.5, color:C.ochreDeep}}>{loading?"…":fmtG((price(id)??mat.est??0)*m.q)}g</span>
        </span>;})}
    </div>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:8}}>
      {[["sells for",sale,C.sanguine],["vials/motes",reagentCost,C.inkSoft],["herbs",herbCost,C.inkSoft],["you keep",gathered,gathered>0?C.ochreDeep:C.sanguine]].map(([l,v,col],i)=>(
        <div key={i} style={{textAlign:"center", padding:"11px 3px", background:C.card, border:"1px solid "+C.ruleSoft}}>
          <div style={{fontFamily:DISPLAY, fontSize:17, color:col}}>{loading?"…":fmtG(v)}<span style={{fontSize:10, fontStyle:"italic"}}> g</span></div>
          <div style={{fontFamily:DISPLAY, fontSize:9, textTransform:"uppercase", letterSpacing:.3, color:C.inkFaint, marginTop:2}}>{l}</div>
        </div>
      ))}
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, marginBottom:14, textAlign:"center"}}>
      you gather the herbs free, but vials and motes are still bought, so "you keep" is the sell price minus those. buying every herb too, you'd keep {fmtG(bought)}g.
    </div>
    <div style={{textAlign:"center", padding:"14px", background:C.paperDeep, border:"1px solid "+C.rule}}>
      <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkSoft}}>{n} of these, gathered, leaves you</div>
      <div style={{fontFamily:DISPLAY, fontSize:30, color:gathered*n>0?C.ochreDeep:C.sanguine}}>{loading?"…":fmtG(gathered*n)}<span style={{fontSize:15, fontStyle:"italic"}}> g</span></div>
    </div>
    <Hand size={13} color={C.greenDk} tilt={-0.4} style={{marginTop:14}}>before multicraft's luck, every proc on top is found coin.</Hand>
  </div>;
}
// verified / estimated badge
function VBadge({ verified }){
  return <span style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:DISPLAY, fontSize:10, letterSpacing:.5, textTransform:"uppercase",
    color: verified?C.verdigris:C.inkFaint, border:"1px solid "+(verified?C.verdigris:C.rule), borderRadius:10, padding:"1px 8px", opacity:0.95}}>
    <span style={{width:6, height:6, borderRadius:"50%", background:verified?C.verdigris:"transparent", border:"1px solid "+(verified?C.verdigris:C.inkFaint)}}/>
    {verified?"verified recipe":"estimated recipe"}
  </span>;
}

/* ── MULTICRAFT BENCH (tool · plainer) ── */
function BenchPage({ price, loading }){
  const sellable=PRODUCTS.filter(p=>p.tradeable);
  const [pct,setPct]=useState(15);
  const [bonus,setBonus]=useState(0);
  const [pid,setPid]=useState(sellable[0]?.id);
  const [base,setBase]=useState(1);
  if(!sellable.length) return <div style={pad}><Eyebrow>the bench · multicraft's luck</Eyebrow><Title size={22}>Not yet in this journal</Title><p style={{fontFamily:BODY, fontSize:13, lineHeight:1.7, color:C.inkSoft}}>No crafts written in for this expansion yet, so there's nothing to roll multicraft on. The herbs and their live prices are in; the alchemy crafting side is the next pass.</p></div>;
  const prod=PRODUCTS.find(p=>p.id===pid) || sellable[0];
  const unit=price(prod.id)??prod.est??0;
  const procMult=1.5+Number(bonus);
  const p=Math.max(0,pct)/100;
  const eff=base*(1+p*(procMult-1));
  const extra=eff-base;
  return <div style={pad}>
    <Eyebrow>the bench · multicraft's luck</Eyebrow>
    <Title size={22}>The found coin</Title>
    <p style={{fontFamily:BODY, fontSize:12.5, color:C.inkSoft, lineHeight:1.6, margin:"0 0 12px"}}>
      Read your Multicraft straight off the professions panel (press <b>P</b>) — it shows as a percent already. Set it here to see the extra each craft drops for free.
    </p>
    <div style={{display:"flex", gap:14, flexWrap:"wrap", marginBottom:14, alignItems:"flex-end"}}>
      <Field label="multicraft %"><input type="number" min="0" value={pct} onChange={e=>setPct(Math.max(0,parseFloat(e.target.value)||0))} style={numIn}/></Field>
      <Field label="craft makes"><input type="number" min="1" value={base} onChange={e=>setBase(Math.max(1,parseInt(e.target.value)||1))} style={numIn}/></Field>
      <Field label="bonus / proc"><input type="number" min="0" step="0.1" value={bonus} onChange={e=>setBonus(Math.max(0,parseFloat(e.target.value)||0))} style={numIn}/></Field>
      <Field label="the craft"><select value={pid} onChange={e=>setPid(Number(e.target.value))} style={{...numIn, width:150}}>{sellable.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    </div>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
      {[["yield / craft",eff.toFixed(2),C.ink],["free items",("+"+extra.toFixed(2)),C.verdigris],["free gold / 100",fmtG(extra*unit*100)+"g",C.ochreDeep]].map(([l,v,col],i)=>(
        <div key={i} style={{textAlign:"center", padding:"12px 4px", background:C.card, border:"1px solid "+C.ruleSoft}}>
          <div style={{fontFamily:DISPLAY, fontSize:20, color:col}}>{loading&&i===2?"…":v}</div>
          <div style={{fontFamily:DISPLAY, fontSize:9.5, textTransform:"uppercase", letterSpacing:.5, color:C.inkFaint, marginTop:2}}>{l}</div>
        </div>
      ))}
    </div>
    <Hand size={12.5} color={C.greenDk} tilt={-0.4} style={{marginTop:14}}>multicraft only blesses what stacks — never gear, never the bound cauldron.</Hand>
  </div>;
}
function Field({ label, children }){
  return <div><div style={{fontFamily:DISPLAY, fontSize:10, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>{label}</div>{children}</div>;
}
const numIn={ width:70, background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:17, padding:"2px 0" };

/* ── loose hand-drawn terrain behind each zone's route ── */
function ZoneArt({ kind, color }){
  // deterministic scatter so it doesn't reflow on every render
  const rnd=(seed)=>{const x=Math.sin(seed*999.7)*43758.5; return x-Math.floor(x);};
  if(kind==="woods"){
    // rolling tree canopy + soft hills, an easy wooded vale
    return <g opacity="0.5">
      <path d="M0 64 Q25 56 50 62 T100 60 L100 90 L0 90 Z" fill={color} opacity="0.10"/>
      <path d="M0 72 Q30 66 60 71 T100 70 L100 90 L0 90 Z" fill={color} opacity="0.10"/>
      {Array.from({length:13}).map((_,i)=>{const x=6+i*7.2+rnd(i)*3, y=20+rnd(i+9)*46, s=3+rnd(i+3)*3;
        return <g key={i}><line x1={x} y1={y} x2={x} y2={y+s*1.4} stroke={color} strokeWidth="0.5" opacity="0.55"/>
          <ellipse cx={x} cy={y} rx={s} ry={s*1.2} fill={color} opacity="0.16"/></g>;})}
    </g>;
  }
  if(kind==="ruins"){
    // toppled troll columns & a stepped pyramid silhouette
    return <g opacity="0.5">
      <path d="M30 70 L42 30 L54 70 Z" fill={color} opacity="0.10"/>
      <path d="M38 70 L50 40 L62 70 Z" fill={color} opacity="0.10"/>
      {[[12,46],[20,60],[68,34],[80,56],[58,64],[88,44]].map(([x,y],i)=>(
        <g key={i}><rect x={x} y={y} width="3.2" height={10+rnd(i)*9} rx="0.6" fill={color} opacity="0.22" transform={`rotate(${(rnd(i+5)-0.5)*30} ${x+1.6} ${y})`}/></g>))}
      {Array.from({length:7}).map((_,i)=>{const x=10+i*12, y=78;
        return <rect key={i} x={x} y={y} width="6" height="3" fill={color} opacity="0.14"/>;})}
    </g>;
  }
  if(kind==="thicket"){
    // tall vertical mushroom stalks & roots — a steep, crowded climb
    return <g opacity="0.5">
      {Array.from({length:9}).map((_,i)=>{const x=8+i*10+rnd(i)*4, h=18+rnd(i+2)*34, cap=2.5+rnd(i)*2.5;
        return <g key={i}><line x1={x} y1={80} x2={x} y2={80-h} stroke={color} strokeWidth="1" opacity="0.4"/>
          <ellipse cx={x} cy={80-h} rx={cap} ry={cap*0.6} fill={color} opacity="0.2"/></g>;})}
      <path d="M0 80 Q20 70 35 78 T70 76 T100 80" fill="none" stroke={color} strokeWidth="0.6" opacity="0.4"/>
    </g>;
  }
  // void — broken islands, rifts, a fractured maze
  return <g opacity="0.55">
    {[[18,34,10],[44,26,13],[68,30,11],[80,50,9],[40,60,12],[60,66,8]].map(([x,y,s],i)=>(
      <path key={i} d={`M${x-s} ${y} L${x-s*0.3} ${y-s*0.5} L${x+s*0.6} ${y-s*0.3} L${x+s} ${y+s*0.4} L${x} ${y+s*0.7} L${x-s*0.7} ${y+s*0.3} Z`} fill={color} opacity="0.13"/>))}
    {Array.from({length:6}).map((_,i)=>{const x1=10+rnd(i)*80, y1=15+rnd(i+1)*60;
      return <line key={i} x1={x1} y1={y1} x2={x1+(rnd(i+4)-0.5)*30} y2={y1+(rnd(i+7)-0.5)*30} stroke={color} strokeWidth="0.4" opacity="0.45" strokeDasharray="1 1.5"/>;})}
  </g>;
}

/* ── FURNITURE & REWARDS (tool · housing decor, dyes, achievement prizes) ── */
function FurniturePage(){
  return <div style={pad}>
    <Eyebrow>furniture & rewards</Eyebrow>
    <Title size={22}>What the craft leaves behind</Title>
    <p style={{fontFamily:BODY, fontSize:12.5, lineHeight:1.65, color:C.inkSoft, margin:"0 0 14px"}}>
      Two different things people mix up: decor you <i>earn</i> from an achievement (account-wide, can't be crafted), and decor you <i>make</i> and sell. Here's both, with what's confirmed and what the game hasn't settled yet.
    </p>

    {/* the confirmed facts */}
    <div style={{background:C.card, border:"1px solid "+C.ruleSoft, padding:"10px 12px", marginBottom:16}}>
      <div style={{fontFamily:DISPLAY, fontSize:10.5, letterSpacing:1, textTransform:"uppercase", color:C.inkFaint, marginBottom:7}}>what's certain</div>
      {FURNITURE.facts.map((f,i)=>(
        <div key={i} style={{display:"flex", gap:8, marginBottom:6}}>
          <span style={{color:C.verdigris, flexShrink:0, fontSize:13}}>✦</span>
          <span style={{fontFamily:BODY, fontSize:12, lineHeight:1.5, color:C.inkSoft}}>{f}</span>
        </div>
      ))}
    </div>

    {/* (A) earned by achievement */}
    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
      <span style={{width:9, height:9, borderRadius:"50%", background:C.wax}}/>
      <span style={{fontFamily:DISPLAY, fontSize:14.5, color:C.ink}}>Earned, not crafted</span>
      <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>· complete the deed, keep it account-wide</span>
    </div>
    {FURNITURE.earned.map((it,i)=><RewardRow key={i} it={it} from={it.from}/>)}

    {/* (B) crafted decor */}
    <div style={{display:"flex", alignItems:"center", gap:8, margin:"16px 0 8px"}}>
      <span style={{width:9, height:9, borderRadius:"50%", background:C.ochreDeep}}/>
      <span style={{fontFamily:DISPLAY, fontSize:14.5, color:C.ink}}>Crafted to sell</span>
      <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>· tradable · needs Lumber</span>
    </div>
    {FURNITURE.crafted.map((it,i)=><RewardRow key={i} it={it} from={it.needs} skill={it.skill}/>)}

    <Hand size={13} color={C.greenDk} tilt={-0.3} style={{marginTop:14}}>the dyes are the quiet earner here — always wanted, never out of fashion.</Hand>
  </div>;
}
function RewardRow({ it, from, skill }){
  return <div style={{display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid "+C.ruleSoft, alignItems:"flex-start"}}>
    <div style={{flex:1}}>
      <div style={{display:"flex", gap:7, alignItems:"center", flexWrap:"wrap"}}>
        <span style={{fontFamily:DISPLAY, fontSize:14, color:C.ink}}>{it.name}</span>
        <CBadge confirmed={it.confirmed}/>
        {skill&&<span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint}}>skill {skill}</span>}
      </div>
      {from&&<div style={{fontFamily:DISPLAY, fontSize:11.5, fontStyle:"italic", color:C.ochreDeep, marginTop:1}}>{from}</div>}
      <div style={{fontFamily:BODY, fontSize:11.5, lineHeight:1.45, color:C.inkSoft, marginTop:2}}>{it.note}</div>
    </div>
  </div>;
}
// confirmed / unconfirmed badge
function CBadge({ confirmed }){
  return <span style={{display:"inline-flex", alignItems:"center", gap:4, fontFamily:DISPLAY, fontSize:9, letterSpacing:.4, textTransform:"uppercase",
    color: confirmed?C.verdigris:C.wax, border:"1px solid "+(confirmed?C.verdigris:C.wax), borderRadius:9, padding:"1px 7px", opacity:0.9}}>
    <span style={{width:5, height:5, borderRadius:"50%", background:confirmed?C.verdigris:"transparent", border:"1px solid "+(confirmed?C.verdigris:C.wax)}}/>
    {confirmed?"confirmed":"unconfirmed in-game"}
  </span>;
}

/* ── MAPS (tool · the four grounds + npc waypoints) ── */
function MapsPage(){
  const [a,setA]=useState(0);
  const [copied,setCopied]=useState(null);
  const zones = Array.isArray(ZONES) ? ZONES : [];
  if(!zones.length) return <div style={pad}><Eyebrow>the four grounds</Eyebrow><Title size={22}>No maps yet</Title><p style={{fontFamily:BODY, fontSize:13, lineHeight:1.7, color:C.inkSoft}}>This journal's farming grounds haven't been charted in yet.</p></div>;
  const z=zones[a] || zones[0];
  const copy=(t,i)=>{try{navigator.clipboard&&navigator.clipboard.writeText(t);}catch(e){} setCopied(i); setTimeout(()=>setCopied(null),1300);};
  const nodes = (z&&z.nodes)||[];
  const pathD=nodes.map((nd,i)=>(i===0?"M":"L")+" "+nd[0]+" "+nd[1]).join(" ");
  return <div style={pad}>
    <Eyebrow>the four grounds</Eyebrow>
    <div style={{display:"flex", gap:4, flexWrap:"wrap", margin:"8px 0 12px"}}>
      {zones.map((zo,i)=><button key={i} onClick={()=>setA(i)} style={{background:a===i?zo.color:"transparent", color:a===i?C.paper:C.inkSoft, border:"1px solid "+(a===i?zo.color:C.rule), padding:"4px 11px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12}}>{zo.name}</button>)}
    </div>
    <div style={{position:"relative", border:"1px solid "+C.rule, background:"radial-gradient(120% 100% at 50% 30%, "+C.paper+", "+C.paperDeep+")", padding:8, marginBottom:10}}>
      <svg viewBox="0 0 100 90" style={{width:"100%", display:"block"}}>
        {/* loose terrain illustration for this ground */}
        <ZoneArt kind={z.terrain} color={z.color}/>
        {/* rivers, where the zone has them */}
        {z.river&&z.river.length>0 && <path d={"M "+z.river.map(r=>r[0]+" "+r[1]).join(" L ")} fill="none" stroke={C.ink2} strokeWidth="1.4" strokeOpacity="0.3" strokeLinecap="round"/>}
        {/* the gathering loop */}
        <path d={pathD+" Z"} fill="none" stroke={z.color} strokeWidth="0.6" strokeOpacity="0.55" strokeDasharray="2 2.5"/>
        {nodes.map((nd,i)=><circle key={i} cx={nd[0]} cy={nd[1]} r="2.2" fill={z.color} opacity="0.9"/>)}
        {/* start marker */}
        {nodes[0] && <><circle cx={nodes[0][0]} cy={nodes[0][1]} r="3.4" fill="none" stroke={C.sanguine} strokeWidth="1"/>
        <text x={nodes[0][0]} y={nodes[0][1]-4.5} fill={C.sanguine} fontSize="4" textAnchor="middle" fontStyle="italic" fontFamily="Georgia,serif">start</text></>}
      </svg>
    </div>
    <div style={{display:"flex", gap:8, marginBottom:6}}><Tag small>{z.mote}</Tag><Tag small color={z.color}>{z.difficulty}</Tag></div>
    <p style={{fontFamily:BODY, fontSize:12.5, color:C.inkSoft, lineHeight:1.6, margin:"0 0 14px", fontStyle:"italic"}}>{z.notes}</p>
    {WAYPOINTS && Array.isArray(WAYPOINTS.npcs) && WAYPOINTS.npcs.length>0 && <>
    <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.ink, borderBottom:"1px solid "+C.rule, paddingBottom:3, marginBottom:4}}>folk & stations worth the mark</div>
    <div style={{overflowY:"auto"}}>{WAYPOINTS.npcs.map((it,i)=>(
      <div key={i} onClick={()=>copy(it.w,i)} style={{display:"flex", gap:9, padding:"7px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
        <div style={{flex:1}}><div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.ink}}>{it.label}</div><div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkSoft}}>{it.note}</div></div>
        <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:copied===i?C.verdigris:C.inkFaint, flexShrink:0}}>{copied===i?"copied":"copy"}</span>
      </div>
    ))}</div></>}
  </div>;
}

/* ── THE SPEC PLANNER (tool · allocate points, see the payoff, save the build) ── */
function SpecPlanner({ build, setBuild }){
  const [tree,setTree]=useState("herb");
  const T=SPEC_TREES[tree];
  const b=build[tree];
  const spent=T.branches.reduce((s,br)=>s+(b[br.key]||0),0);
  const left=T.cap-spent;
  const set=(brk,val,max)=>{
    const v=Math.max(0,Math.min(max,val));
    const others=T.branches.reduce((s,br)=>s+(br.key===brk?0:(b[br.key]||0)),0);
    const capped=Math.min(v, T.cap-others);
    setBuild(p=>({...p,[tree]:{...p[tree],[brk]:capped}}));
  };
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
      <Eyebrow>the planner · spend your knowing</Eyebrow>
      <button onClick={()=>setBuild(p=>({...p,[tree]:{}}))} style={{background:"transparent", border:"1px solid "+C.rule, color:C.inkSoft, fontFamily:DISPLAY, fontStyle:"italic", fontSize:11, padding:"2px 8px", cursor:"pointer"}}>reset</button>
    </div>
    <div style={{display:"flex", gap:6, marginBottom:10}}>
      {["herb","alch"].map(k=>(
        <button key={k} onClick={()=>setTree(k)} style={{background:tree===k?SPEC_TREES[k].accent:"transparent", color:tree===k?C.paper:C.inkSoft, border:"1px solid "+(tree===k?SPEC_TREES[k].accent:C.rule), padding:"4px 12px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5}}>{SPEC_TREES[k].label}</button>
      ))}
    </div>

    {/* points budget */}
    <div style={{display:"flex", alignItems:"baseline", gap:8, marginBottom:6}}>
      <span style={{fontFamily:DISPLAY, fontSize:28, color:left<0?C.sanguine:T.accent}}>{spent}</span>
      <span style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkFaint}}>of {T.cap} knowledge spent · {left} left</span>
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint, marginBottom:14}}>
      filled diamonds are the big payoffs. each branch shows its trunk and the sub-specs that split off it, with what unlocks at every point level.
    </div>

    {/* ── the trees ── */}
    <div style={{overflowY:"auto"}}>
      {T.branches.map(br=>{
        const pts=b[br.key]||0;
        const trunk=(br.trunk||[]).slice().sort((a,c)=>a.at-c.at);
        const pct=Math.min(100,(pts/br.max)*100);
        return <div key={br.key} style={{padding:"4px 0 18px", borderBottom:"1px solid "+C.rule, marginBottom:10}}>
          {/* branch header + stepper */}
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
            <span style={{width:12, height:12, borderRadius:3, transform:"rotate(45deg)", background:br.color, flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:DISPLAY, fontSize:16.5, color:C.ink}}>{br.name}</div>
              <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>{br.gist}</div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
              <button onClick={()=>set(br.key,pts-5,br.max)} style={stepBtn}>–</button>
              <span style={{fontFamily:DISPLAY, fontSize:16, color:C.ink, minWidth:48, textAlign:"center"}}>{pts}<span style={{fontSize:11, color:C.inkFaint}}>/{br.max}</span></span>
              <button onClick={()=>set(br.key,pts+5,br.max)} style={stepBtn}>+</button>
            </div>
          </div>

          {/* TRUNK */}
          <div style={{position:"relative", paddingLeft:30}}>
            <div style={{position:"absolute", left:13, top:12, bottom:12, width:2, background:C.ruleSoft}}/>
            <div style={{position:"absolute", left:13, top:12, width:2, background:br.color, height:`calc(${pct}% - 24px)`, minHeight:0, transition:"height .3s"}}/>
            {trunk.map((n,i)=>{const hit=pts>=n.at;
              return <div key={i} style={{position:"relative", display:"flex", gap:11, alignItems:"flex-start", padding:"6px 0"}}>
                <span style={{position:"absolute", left:-23, top:7, width:n.key?17:13, height:n.key?17:13,
                  borderRadius:n.key?3:"50%", transform:n.key?"rotate(45deg)":"none",
                  border:"2px solid "+(hit?br.color:C.rule), background:hit?br.color:C.paper,
                  boxShadow:hit&&n.key?"0 0 8px "+br.color:"none", flexShrink:0, transition:"all .2s"}}/>
                <span style={{fontFamily:DISPLAY, fontSize:12, fontWeight:700, color:hit?br.color:C.inkFaint, minWidth:22}}>{n.at}</span>
                <div style={{flex:1, opacity:hit?1:0.6}}>
                  <div style={{fontFamily:DISPLAY, fontSize:13.5, color:C.ink, fontWeight:n.key?700:400}}>{n.t}</div>
                  <div style={{fontFamily:DISPLAY, fontSize:11.5, fontStyle:"italic", color:C.inkSoft, lineHeight:1.4}}>{n.d}</div>
                </div>
              </div>;
            })}
          </div>

          {/* SUB-SPECS: each its own connected line, nodes by level */}
          {(br.subs||[]).map((sb,si)=>(
            <div key={si} style={{marginTop:10, marginLeft:30, position:"relative", paddingLeft:20}}>
              {/* the elbow connector into this sub-spec */}
              <div style={{position:"absolute", left:0, top:0, bottom:14, width:2, borderLeft:"2px dashed "+(sb.color||br.color), opacity:0.5}}/>
              <div style={{display:"flex", alignItems:"center", gap:7, marginBottom:4}}>
                <span style={{width:8, height:8, borderRadius:2, transform:"rotate(45deg)", background:sb.color||br.color, flexShrink:0}}/>
                <span style={{fontFamily:DISPLAY, fontSize:11.5, letterSpacing:1, textTransform:"uppercase", color:sb.color||br.color}}>{sb.name}</span>
              </div>
              {sb.nodes.map((n,j)=>{const hit=pts>=n.at;
                return <div key={j} style={{display:"flex", gap:9, alignItems:"flex-start", padding:"3px 0", opacity:hit?1:0.58}}>
                  <span style={{width:9, height:9, borderRadius:"50%", border:"1.5px solid "+(hit?(sb.color||br.color):C.rule), background:hit?(sb.color||br.color):"transparent", flexShrink:0, marginTop:4}}/>
                  <span style={{fontFamily:DISPLAY, fontSize:11.5, fontWeight:700, color:hit?(sb.color||br.color):C.inkFaint, minWidth:20}}>{n.at}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.ink}}>{n.t}</div>
                    <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkSoft, lineHeight:1.35}}>{n.d}</div>
                  </div>
                </div>;
              })}
            </div>
          ))}

          {pts>0 && <div style={{fontFamily:HAND, fontSize:12.5, color:C.greenDk, transform:"rotate(-0.3deg)", marginTop:12, marginLeft:30}}>{br.note}</div>}
        </div>;
      })}
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint, marginTop:8}}>
      point thresholds and what each node unlocks are taken from the Midnight profession guides. exact per-point stat values aren't published, so nodes are described by what they do. your build is kept while the journal is open.
    </div>
  </div>;
}
const stepBtn={ width:28, height:28, borderRadius:"50%", border:"1px solid "+C.rule, background:"rgba(255,255,255,0.3)", color:C.ink, fontFamily:DISPLAY, fontSize:17, cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" };

/* ── the ribboned sections of the book ── */
const SECTIONS = [
  { key:"overview",  ribbon:"#9c4a3c", title:"Tonight's Plan",     flavor:"the night's plan",        sub:"top sellers right now, ranked", voice:true },
  { key:"specimens", ribbon:"#6b7d4e", title:"Herb Gallery",       flavor:"the herb gallery",        sub:"every herb & what it sells for", voice:true },
  { key:"worth",     ribbon:"#c19a45", title:"What's Worth It",     flavor:"what's worth it",         sub:"full ranking · herbs & crafts by margin", voice:true },
  { key:"knowing",   ribbon:"#46627a", title:"Field Notes",         flavor:"what i've come to know",  sub:"tips, lore & gold-making wisdom", voice:true },
  { key:"planner",   ribbon:"#b06a86", title:"Spec Planner",        flavor:"the spec planner",        sub:"plan your talent trees point by point", voice:false },
  { key:"formulary", ribbon:"#7d6a9c", title:"Formulary",           flavor:"the formulary",           sub:"every recipe, mats & where to learn it", voice:false },
  { key:"scale",     ribbon:"#9a7833", title:"Scale & Bench",       flavor:"the scale & bench",       sub:"profit calculator & multicraft odds", voice:false },
  { key:"furniture", ribbon:"#a86a3c", title:"Furniture & Rewards",  flavor:"what the craft leaves behind", sub:"housing decor, dyes & achievement prizes", voice:false },
  { key:"maps",      ribbon:"#5a7d5e", title:"Farming Grounds",     flavor:"the four grounds",        sub:"routes & treasure waypoints", voice:false },
];

/* ── EXPANSION REGISTRY — the bookshelf ──────────────────────────
   Each expansion is a journal Gilshi keeps. Today Midnight is fully
   written; the rest are spines on the shelf, ready to be filled.
   Adding an expansion later = one entry here with its own data set. */
const EXPANSIONS = [
  { key:"midnight",  title:"Midnight",            short:"Midnight",  year:"12.0", spine:"#4a3324", spine2:"#2e2014", accent:C.sanguine, ready:true,
    cloth:"#46321f", gilt2:"#caa85e", tall:262, ornament:"diamond", wear:0.5, bands:3,
    subtitle:"Silvermoon · the four grounds", herbCount:6, craftCount:21,
    blurb:"Alchemy & Herbalism across Eversong, Zul'Aman, Harandar and the Voidstorm." },
  { key:"tww",       title:"The War Within",      short:"War Within",year:"11.0", spine:"#37434f", spine2:"#222b34", accent:C.ink2,  ready:true,
    cloth:"#33414c", gilt2:"#9fb0a0", tall:244, ornament:"knot", wear:0.7, bands:4,
    subtitle:"Khaz Algar · the four grounds", herbCount:6, craftCount:19,
    blurb:"Herbalism & Alchemy across Isle of Dorn, the Ringing Deeps, Hallowfall and Azj-Kahet. Herbs, recipes, spec trees and live pricing all in." },
  { key:"df",        title:"Dragonflight",        short:"Dragonflight",year:"10.0",spine:"#5a3f33", spine2:"#39271e", accent:C.wax,   ready:false,
    cloth:"#553a2e", gilt2:"#c79a5a", tall:270, ornament:"scroll", wear:0.6, bands:3,
    subtitle:"the Dragon Isles", blurb:"Coming soon. Decay & renewal across the Isles." },
  { key:"sl",        title:"Shadowlands",         short:"Shadowlands",year:"9.0",  spine:"#39384f", spine2:"#252436", accent:C.plum,  ready:false,
    cloth:"#363350", gilt2:"#b0a0c0", tall:236, ornament:"diamond", wear:0.8, bands:4,
    subtitle:"the realms of Death", blurb:"Coming soon. Death-blooms of the four covenants." },
  { key:"bfa",       title:"Battle for Azeroth",  short:"BfA",       year:"8.0", spine:"#46503c", spine2:"#2e3526", accent:C.verdigris, ready:false,
    cloth:"#434d39", gilt2:"#a8b07a", tall:256, ornament:"knot", wear:0.65, bands:3,
    subtitle:"Kul Tiras & Zandalar", blurb:"Coming soon. Akunda's bite and sea-stalk." },
  { key:"vanilla",   title:"Vanilla",             short:"Vanilla",   year:"1.0", spine:"#4a3b28", spine2:"#2c2013", accent:C.ochreDeep, ready:true,
    cloth:"#463526", gilt2:"#b89a54", tall:232, ornament:"diamond", wear:0.95, bands:5,
    subtitle:"classic Azeroth · the old craft", herbCount:17, craftCount:17,
    blurb:"The original 1-300 alchemy that still lives on retail as Classic Alchemy. Curated estimates, no live pricing — the removed raid flasks & Arcanite aren't here." },
];
const EXP = key => EXPANSIONS.find(e=>e.key===key) || EXPANSIONS[0];

/* index page (front of book) */
function IndexPage({ go, exp }){
  const e = exp || EXP("midnight");
  return <div style={pad}>
    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:2}}>
      <AlchemateMark size={20} color={C.ochreDeep}/>
      <span style={{fontFamily:DISPLAY, fontSize:12, letterSpacing:"0.18em", color:C.inkFaint, textTransform:"uppercase"}}>Alchemate</span>
    </div>
    <Hand size={14} color={C.green} tilt={-1} style={{marginBottom:4}}>kept by Gilshi — of Pandaria, Moon Guard</Hand>
    <h1 style={{fontFamily:DISPLAY, fontSize:"clamp(26px,5vw,40px)", fontWeight:400, margin:"2px 0 2px", color:C.ink, lineHeight:1.02}}>The {e.title} Journal</h1>
    <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkFaint, marginBottom:18}}>an alchemist's gold-making companion · {e.subtitle}</div>
    {SECTIONS.map((s,i)=>(
      <div key={s.key} onClick={()=>go(s.key)} style={{display:"flex", gap:14, alignItems:"baseline", padding:"9px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
        <span style={{width:10, height:10, borderRadius:2, background:s.ribbon, flexShrink:0, alignSelf:"center"}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:DISPLAY, fontSize:16.5, color:C.ink}}>{s.title}</div>
          <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>{s.sub}</div>
        </div>
        <span style={{fontFamily:DISPLAY, fontSize:16, color:C.inkFaint}}>›</span>
      </div>
    ))}
    <div style={{position:"absolute", bottom:22, right:26, opacity:0.9}}><Tape w={36} rot={28} style={{top:8, right:24}}/><Pressed id={236761} size={66}/></div>
  </div>;
}

/* which component pair renders for a section (left leaf, right leaf) */
function spreadFor(key, ctx){
  const { price, loading, live, go, build, setBuild, priceMeta } = ctx;
  switch(key){
    case "overview":  return [<Overview key="ol" price={price} loading={loading} live={live} go={go} meta={priceMeta}/>, <OverviewRight key="or" go={go}/>];
    case "specimens": return [<SpecLeft key="sl" price={price} loading={loading} go={go}/>, <SpecRight key="sr" price={price} loading={loading} go={go}/>];
    case "worth":     return [<Worth key="wl" price={price} loading={loading} live={live} meta={priceMeta}/>, <WorthHelp key="wr"/>];
    case "knowing":   return [<Knowing key="kl"/>, <KnowingHelp key="kr"/>];
    case "formulary": return [<FormularyPage key="fl" price={price} loading={loading}/>, null];
    case "scale":     return [<ScalePage key="cl" price={price} loading={loading}/>, <BenchPage key="cr" price={price} loading={loading}/>];
    case "furniture": return [<FurniturePage key="fu"/>, null];
    case "planner":   return [<SpecPlanner key="sp" build={build} setBuild={setBuild}/>, null];
    case "maps":      return [<MapsPage key="ml"/>, null];
    default:          return [<Overview key="d" price={price} loading={loading} live={live} go={go}/>, null];
  }
}
// small facing-page helpers for reading sections (kept light)
function WorthHelp(){
  return <div style={pad}>
    <Eyebrow>a steadier coin</Eyebrow><Title size={21}>The dye-work</Title>
    <p style={{fontFamily:BODY, fontSize:13, lineHeight:1.75, color:C.inkSoft}}>Ten of any herb, the cheapest i can find, ground to a single pigment — then to dye at the neighbourhood table. No skill in it, none gained, and it never goes to waste. The decorators always come back.</p>
    <div style={{display:"flex", gap:14, flexWrap:"wrap", marginTop:12}}>{[["Blue",C.ink2],["Red",C.sanguine],["Green",C.verdigris],["Amethyst",C.plum]].map(([n,c],i)=>(<span key={i} style={{display:"inline-flex", alignItems:"center", gap:6, fontFamily:DISPLAY, fontSize:13, color:C.inkSoft}}><span style={{width:12, height:12, borderRadius:"50%", background:c, border:"1px solid "+C.ink}}/>{n}</span>))}</div>
    <Hand size={14} style={{marginTop:18}}>Argentleaf makes the truest blue. i keep the browned ones just for this.</Hand>
  </div>;
}
function KnowingHelp(){
  const facts=[
    ["the pool holds","1,000","at most"],
    ["it fills","1 / 6 min","10 an hour"],
    ["dry to full","~100 hrs","there is no hurrying it"],
    ["Ingenuity refunds","~50%","up to 70% at most"],
  ];
  return <div style={pad}>
    <Eyebrow>the patient pool</Eyebrow><Title size={21}>On concentration</Title>
    <p style={{fontFamily:BODY, fontSize:13, lineHeight:1.7, color:C.inkSoft, margin:"0 0 12px"}}>The reckoning is fixed, not a feeling. I keep a second craft and a second pool, and spend only where the worth is real.</p>
    <div style={{border:"1px solid "+C.rule, background:"rgba(255,255,255,0.18)"}}>
      {facts.map((f,i)=>(
        <div key={i} style={{display:"flex", alignItems:"baseline", gap:8, padding:"8px 12px", borderBottom: i<facts.length-1?"1px solid "+C.ruleSoft:"none"}}>
          <span style={{flex:1, fontFamily:BODY, fontSize:12.5, color:C.inkSoft}}>{f[0]}</span>
          <span style={{fontFamily:DISPLAY, fontSize:16, color:C.sanguine}}>{f[1]}</span>
          <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, minWidth:96, textAlign:"right"}}>{f[2]}</span>
        </div>
      ))}
    </div>
    <Hand size={13.5} color={C.green} style={{marginTop:14}}>so: spend it on what stacks and sells, never on trinkets. the pool you waste is a hundred hours you don't get back.</Hand>
  </div>;
}

/* ════════════ the bookshelf (Alchemate landing) ════════════ */
function Bookshelf({ onOpen }){
  const [hover,setHover]=useState("midnight");
  const cur=EXP(hover);
  return <div style={{position:"relative", zIndex:5, width:"min(96vw,1080px)", maxWidth:"100%", padding:"0 16px"}}>
    {/* masthead */}
    <div style={{textAlign:"center", marginBottom:"clamp(18px,4vh,40px)"}}>
      <div style={{display:"inline-flex", alignItems:"center", gap:12, marginBottom:6}}>
        <AlchemateMark size={38}/>
        <h1 style={{fontFamily:DISPLAY, fontWeight:400, fontSize:"clamp(34px,7vw,60px)", letterSpacing:"0.06em", margin:0, color:"#f0e2c2", textShadow:"0 2px 18px rgba(0,0,0,0.6)"}}>ALCHEMATE</h1>
      </div>
      <div style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:"clamp(12px,2vw,15px)", color:"#c9b693", letterSpacing:"0.04em"}}>
        the alchemist's gold-making companion · journals kept by Gilshi of Moon Guard
      </div>
    </div>

    {/* the shelf */}
    <div style={{position:"relative", display:"flex", justifyContent:"center", alignItems:"flex-end", gap:"clamp(8px,1.6vw,18px)",
      padding:"0 clamp(10px,4vw,46px) 0", minHeight:"clamp(210px,34vh,320px)"}}>
      {EXPANSIONS.map((e,i)=>{
        const on=hover===e.key;
        const lean=[0.6,-0.8,0.4,-1.1,0.7][i]||0; // gentle natural tilt per book
        return <button key={e.key} onMouseEnter={()=>setHover(e.key)} onFocus={()=>setHover(e.key)}
          onClick={()=>e.ready&&onOpen(e.key)} disabled={!e.ready}
          aria-label={e.title+(e.ready?"":" (coming soon)")}
          style={{cursor:e.ready?"pointer":"not-allowed", border:"none", background:"transparent", padding:0,
            transformOrigin:"bottom center", transition:"transform .35s cubic-bezier(.4,.1,.2,1)",
            transform: on?"translateY(-20px) rotate(0deg)":`translateY(0) rotate(${lean}deg)`, outline:"none"}}>
          <Spine e={e} on={on}/>
        </button>;
      })}
      {/* the wooden shelf board */}
      <div style={{position:"absolute", left:"clamp(0px,2vw,28px)", right:"clamp(0px,2vw,28px)", bottom:-2, height:18, borderRadius:3,
        background:"linear-gradient(180deg,#6a4d33,#3a2918)", boxShadow:"0 14px 30px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,220,170,0.18)"}}/>
      <div style={{position:"absolute", left:"clamp(0px,2vw,28px)", right:"clamp(0px,2vw,28px)", bottom:-12, height:12, borderRadius:"0 0 4px 4px",
        background:"linear-gradient(180deg,#2c1f13,#1a120a)"}}/>
    </div>

    {/* the chosen book's plate */}
    <div style={{textAlign:"center", marginTop:"clamp(22px,5vh,46px)", minHeight:64}}>
      <div style={{fontFamily:DISPLAY, fontSize:"clamp(20px,3.4vw,28px)", color:"#f0e2c2"}}>{cur.title} <span style={{color:"#9c8a6a", fontSize:"0.6em", fontStyle:"italic"}}>· patch {cur.year}</span></div>
      <div style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:13.5, color:"#c1ad88", margin:"3px 0 12px"}}>{cur.subtitle}</div>
      <div style={{fontFamily:BODY, fontSize:13, color:"#b3a384", maxWidth:440, margin:"0 auto 16px", lineHeight:1.6, opacity:0.92}}>{cur.blurb}</div>
      {cur.ready
        ? <button onClick={()=>onOpen(cur.key)} className="openbtn" style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:15, color:"#1c140b",
            background:"linear-gradient(180deg,#e7cd8e,#caa85e)", border:"1px solid #8a6a30", borderRadius:24, padding:"9px 26px", cursor:"pointer",
            boxShadow:"0 6px 18px rgba(0,0,0,0.4)"}}>open the journal ✦</button>
        : <span style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:13, color:"#8a7a5c", border:"1px solid #5a4a32", borderRadius:24, padding:"8px 22px"}}>not yet written</span>}
    </div>
  </div>;
}

/* a single 3D-ish book spine on the shelf */
function Spine({ e, on }){
  const W=58, H=e.tall||250;
  const ready=e.ready;
  const gilt=e.gilt2||"#caa85e";
  const cloth=e.cloth||e.spine;
  const dk=e.spine2||"#2a1d12";
  // raised band y-positions across the spine
  const bandN=e.bands||3;
  const bandYs=[]; for(let i=1;i<=bandN;i++){ bandYs.push(H*(0.16+ (0.62*i/(bandN+1)))); }
  const uid=e.key;
  const orn=(cx,cy)=>{
    if(e.ornament==="knot") return <path d={`M${cx-6} ${cy} q6 -7 12 0 q-6 7 -12 0 M${cx} ${cy-6} q7 6 0 12 q-7 -6 0 -12`} fill="none" stroke={gilt} strokeWidth="0.9" opacity={ready?0.8:0.4}/>;
    if(e.ornament==="scroll") return <path d={`M${cx-7} ${cy+3} q3 -8 7 -3 q4 5 7 -3 M${cx-7} ${cy-3} q3 8 7 3 q4 -5 7 3`} fill="none" stroke={gilt} strokeWidth="0.9" opacity={ready?0.8:0.4}/>;
    return <g opacity={ready?0.8:0.4} fill="none" stroke={gilt} strokeWidth="0.9"><path d={`M${cx} ${cy-7} L${cx+6} ${cy} L${cx} ${cy+7} L${cx-6} ${cy} Z`}/><circle cx={cx} cy={cy} r="1.6" fill={gilt} stroke="none"/></g>;
  };
  return <div style={{position:"relative", width:W, height:H, filter: on?"drop-shadow(0 22px 30px rgba(0,0,0,0.6))":"drop-shadow(0 12px 20px rgba(0,0,0,0.5))", transition:"filter .35s"}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        {/* cloth weave */}
        <filter id={`weave-${uid}`}><feTurbulence type="turbulence" baseFrequency="0.9 0.4" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0"/></filter>
        {/* broad foxing/aging blotches */}
        <filter id={`fox-${uid}`}><feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="3" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 0.42 0 0 0 0 0.32 0 0 0 0 0.16 0 0 0 0.5 0"/></filter>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dk}/><stop offset="0.12" stopColor={cloth}/><stop offset="0.5" stopColor={cloth}/><stop offset="0.84" stopColor={cloth}/><stop offset="1" stopColor={dk}/>
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.4" stopColor="#fff" stopOpacity="0"/><stop offset="0.5" stopColor="#fff" stopOpacity="0.10"/><stop offset="0.6" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* body */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" fill={`url(#sp-${uid})`} stroke="rgba(0,0,0,0.5)" strokeWidth="1"/>
      {/* cloth weave texture */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" filter={`url(#weave-${uid})`} opacity="0.5"/>
      {/* foxing/age blotches */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" filter={`url(#fox-${uid})`} opacity={0.25+0.35*(e.wear||0.5)}/>
      {/* center sheen */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" fill={`url(#sheen-${uid})`}/>

      {/* gilt rule border (double line, antique) */}
      <rect x="6" y="7" width={W-12} height={H-14} fill="none" stroke={gilt} strokeWidth="1" opacity={ready?0.7:0.34}/>
      <rect x="8.5" y="9.5" width={W-17} height={H-19} fill="none" stroke={gilt} strokeWidth="0.5" opacity={ready?0.5:0.25}/>

      {/* raised bands across spine, each with highlight + shadow */}
      {bandYs.map((by,i)=>(
        <g key={i}>
          <rect x="2" y={by-3} width={W-4} height="6" fill={dk} opacity="0.55"/>
          <rect x="2" y={by-3} width={W-4} height="1.4" fill="#fff" opacity="0.10"/>
          <rect x="2" y={by+1.6} width={W-4} height="1.4" fill="#000" opacity="0.30"/>
          <line x1="7" y1={by} x2={W-7} y2={by} stroke={gilt} strokeWidth="0.5" opacity={ready?0.55:0.28}/>
        </g>
      ))}

      {/* title panel (between first two bands) */}
      <rect x="6.5" y={H*0.20} width={W-13} height={H*0.30} fill="none" stroke={gilt} strokeWidth="0.8" opacity={ready?0.65:0.3}/>
      {/* corner ticks on the panel */}
      {[[8.5,H*0.20+2],[W-8.5,H*0.20+2],[8.5,H*0.50-2],[W-8.5,H*0.50-2]].map(([x,y],i)=>(
        <path key={i} d={`M${x-2} ${y} L${x} ${y} L${x} ${y+(i<2?2:-2)}`} fill="none" stroke={gilt} strokeWidth="0.7" opacity={ready?0.6:0.3}/>
      ))}

      {/* ornaments in the lower panels */}
      {orn(W/2, H*0.62)}
      {orn(W/2, H*0.78)}

      {/* the alembic emblem near the foot */}
      <g transform={`translate(${W/2-9}, ${H-30}) scale(0.56)`} opacity={ready?0.9:0.4}>
        <path d="M13 4 h6 M16 4 v7 l6 12 a4 4 0 0 1 -3.6 5.6 h-8.8 A4 4 0 0 1 6 23 l6 -12 V4" fill="none" stroke={gilt} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      </g>

      {/* ── wear: scuffed corners, frayed head-cap, chipped foot ── */}
      <path d={`M2 10 Q1 4 9 2`} fill="none" stroke="#000" strokeWidth="2.5" opacity={0.3+0.4*(e.wear||0.5)} strokeLinecap="round"/>
      <path d={`M${W-2} ${H-9} Q${W-1} ${H-3} ${W-9} ${H-2}`} fill="none" stroke="#000" strokeWidth="2.5" opacity={0.3+0.4*(e.wear||0.5)} strokeLinecap="round"/>
      {/* rubbed lighter patches where gilt has worn */}
      <ellipse cx={W*0.3} cy={H*0.34} rx="7" ry="14" fill={cloth} opacity={0.4*(e.wear||0.5)}/>
      <ellipse cx={W*0.7} cy={H*0.7} rx="6" ry="11" fill={dk} opacity={0.3*(e.wear||0.5)}/>
      {/* a couple of nicks along the fore edge */}
      <path d={`M${W-2} ${H*0.4} l-3 1 l3 1 Z`} fill={dk} opacity="0.6"/>
      <path d={`M2 ${H*0.55} l3 1 l-3 1 Z`} fill={dk} opacity="0.6"/>
      {/* frayed head-cap threads */}
      <g stroke={gilt} strokeWidth="0.5" opacity={ready?0.5:0.25}>
        <line x1={W*0.4} y1="2" x2={W*0.4} y2="5"/><line x1={W*0.55} y1="2" x2={W*0.55} y2="4.5"/><line x1={W*0.62} y1="2" x2={W*0.62} y2="5.5"/>
      </g>
    </svg>

    {/* vertical title, overlaid in the panel */}
    <div style={{position:"absolute", top:H*0.205, left:0, right:0, height:H*0.29, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none"}}>
      <span style={{writingMode:"vertical-rl", transform:"rotate(180deg)", fontFamily:DISPLAY, fontSize: e.short.length>9?10.5:12.5, letterSpacing:"0.1em",
        color: ready?gilt:"#8f8068", textShadow:"0 1px 1px rgba(0,0,0,0.7)", whiteSpace:"nowrap", fontWeight:600}}>
        {e.short.toUpperCase()}
      </span>
    </div>

    {!ready && <div style={{position:"absolute", inset:0, borderRadius:"2.5px", background:"rgba(20,14,8,0.34)"}}/>}
  </div>;
}

/* the Alchemate mark: an alembic/flask glyph */
function AlchemateMark({ size=28, color="#caa85e" }){
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Alchemate">
    <defs><linearGradient id="amk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={color}/><stop offset="1" stopColor="#9a7833"/></linearGradient></defs>
    <path d="M13 4 h6 M16 4 v7 l6 12 a4 4 0 0 1 -3.6 5.6 h-8.8 A4 4 0 0 1 6 23 l6 -12 V4" fill="none" stroke="url(#amk)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M9.4 19 h13.2" stroke="url(#amk)" strokeWidth="1.2" opacity="0.7"/>
    <circle cx="13.6" cy="23" r="1.1" fill={color}/><circle cx="17.6" cy="25" r="1.4" fill={color} opacity="0.8"/><circle cx="19" cy="21.5" r="0.9" fill={color} opacity="0.7"/>
  </svg>;
}

/* ════════════ the book ════════════ */
export default function App(){
  const [onShelf, setOnShelf] = useState(true);          // start at the bookshelf
  const [expansion, setExpansion] = useState("midnight"); // which journal is open
  const [section, setSection] = useState("index");
  const [scene, setScene] = useState("table");
  const [opening, setOpening] = useState(false);          // shelf→book transition
  const [turning, setTurning] = useState(false);
  const [mobile, setMobile] = useState(typeof window!=="undefined" && window.innerWidth<820);
  const [priceData, setPriceData] = useState(null); // { prices, realm, region, updated }
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState({ herb:{}, alch:{} });
  const [navOpen, setNavOpen] = useState(false);

  useEffect(()=>{
    const on=()=>setMobile(window.innerWidth<820); window.addEventListener("resize",on);
    return ()=>window.removeEventListener("resize",on);
  },[]);

  // price fetch — runs on open and whenever the expansion changes, so the
  // ids pulled match the active book's herbs/products/reagents.
  useEffect(()=>{
    if(CONFIG.ue.enabled){
      setLoading(true);
      setPriceData(null);
      fetchPrices(CONFIG.ue.realm).then(p=>{ setPriceData(p); setLoading(false); });
    }
  },[expansion]);
  const prices = priceData && priceData.prices;
  const price = useCallback((id)=> (prices && prices[id]!=null) ? prices[id] : null, [prices]);
  const live = CONFIG.ue.enabled && !!prices;
  const priceMeta = { realm: (priceData&&priceData.realm)||CONFIG.ue.realm, updated: priceData&&priceData.updated, live };

  const turnTo = (key)=>{ if(key===section){return;} setTurning(true); setTimeout(()=>{ setSection(key); setTurning(false); }, 500); };
  const openJournal = (key)=>{ loadExpansion(key); setExpansion(key); setSection("index"); setOpening(true); setOnShelf(false); setTimeout(()=>setOpening(false), 700); };
  const backToShelf = ()=>{ setOnShelf(true); };
  const ctx = { price, loading, live, go:turnTo, build, setBuild, priceMeta };
  const isIndex = section==="index";
  const curIdx = SECTIONS.findIndex(s=>s.key===section);
  const curSec = SECTIONS[curIdx] || null;
  const prevKey = curIdx>0 ? SECTIONS[curIdx-1].key : null;
  const nextKey = curIdx>=0 && curIdx<SECTIONS.length-1 ? SECTIONS[curIdx+1].key : null;
  const tableScene = scene==="table" && !mobile;
  const [leftLeaf, rightLeaf] = isIndex ? [<IndexPage key="ix" go={turnTo} exp={EXP(expansion)}/>, null] : spreadFor(section, ctx);
  // on desktop, if a section has no right leaf, center the single leaf
  const single = isIndex || rightLeaf==null;

  // ── the bookshelf is the entry point ──
  if(onShelf){
    return (
      <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative",
        background:"radial-gradient(90% 80% at 50% 30%, #2c2013 0%, #1c1409 55%, #0f0a05 100%)"}}>
        <ShelfBg/>
        <Bookshelf onOpen={openJournal}/>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative",
      background: tableScene ? "radial-gradient(80% 70% at 50% 38%, #3a2c1c 0%, #271b11 60%, #160e07 100%)" : "radial-gradient(70% 60% at 50% 30%, #36281a, #170f08)"}}>
      <SceneBg tableScene={tableScene}/>

      <div className={opening?"bookopen":"bookidle"} style={{position:"relative", zIndex:5, transition:"transform 0.7s cubic-bezier(.5,.05,.2,1)",
        transform: tableScene ? "perspective(1700px) rotateX(13deg) scale(0.9)" : "perspective(2200px) rotateX(3deg) scale(1)",
        transformOrigin:"center 60%", width: mobile?"100vw":"min(94vw, 1040px)", height: mobile?"100vh":"min(90vh, 740px)", maxWidth:"100%"}}>

        {/* cover — tooled leather with grain */}
        <div style={{position:"absolute", inset: mobile?0:-16, background:"linear-gradient(155deg, "+C.cover+", "+C.coverDk+")", borderRadius: mobile?0:8, boxShadow:"0 40px 90px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.45)", overflow:"hidden"}}>
          {/* leather grain */}
          <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.5, mixBlendMode:"overlay"}} aria-hidden="true">
            <filter id="leather"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.85" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/></filter>
            <rect width="100%" height="100%" filter="url(#leather)"/>
          </svg>
          {/* broad mottling */}
          <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.4}} aria-hidden="true">
            <filter id="leather2"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0.15 0 0 0 0 0.10 0 0 0 0 0.06 0 0 0 0.5 0"/></filter>
            <rect width="100%" height="100%" filter="url(#leather2)"/>
          </svg>
          {/* gilt tooled border + spine emboss (desktop) */}
          {!mobile && <div style={{position:"absolute", inset:10, border:"1px solid rgba(202,168,94,0.35)", borderRadius:5, pointerEvents:"none"}}/>}
          {!mobile && !single && <div style={{position:"absolute", left:"50%", top:0, bottom:0, width:20, transform:"translateX(-50%)", background:"linear-gradient(90deg, rgba(0,0,0,0.4), rgba(255,220,170,0.06) 50%, rgba(0,0,0,0.4))", pointerEvents:"none"}}/>}
        </div>

        {/* ribbons (quick visual access; the labeled menu is the main nav) */}
        <div style={{position:"absolute", top: mobile?44:-16, left:0, right:0, display:"flex", justifyContent:"center", gap:mobile?9:14, zIndex:9}}>
          {SECTIONS.map(sec=>(
            <button key={sec.key} onClick={()=>turnTo(sec.key)} title={sec.title} aria-label={sec.title} className="ribbon"
              style={{width:mobile?11:13, height: section===sec.key?(mobile?40:72):(mobile?28:54), background:sec.ribbon, border:"none", cursor:"pointer", padding:0, boxShadow:"0 3px 5px rgba(0,0,0,0.3)", transition:"height 0.3s", clipPath:"polygon(0 0,100% 0,100% 86%,50% 100%,0 86%)"}}/>
          ))}
        </div>

        {/* spread */}
        <div style={{position:"absolute", inset: mobile?0:6, top: mobile?62:10, display:"flex", borderRadius: mobile?0:3, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
          {/* visible page-stack thickness along the outer edges (desktop book feel) */}
          {!mobile && <div style={{position:"absolute", left:-4, top:6, bottom:6, width:5, borderRadius:"2px 0 0 2px", background:"repeating-linear-gradient(90deg, #e8dcc0, #d8c9a4 1.5px, #cbb894 3px)", boxShadow:"-2px 0 6px rgba(0,0,0,0.3)", zIndex:1}}/>}
          {!mobile && <div style={{position:"absolute", right:-4, top:6, bottom:6, width:5, borderRadius:"0 2px 2px 0", background:"repeating-linear-gradient(90deg, #cbb894, #d8c9a4 1.5px, #e8dcc0 3px)", boxShadow:"2px 0 6px rgba(0,0,0,0.3)", zIndex:1}}/>}
          {!mobile && !single && (
            <div style={{...leafBase, borderRight:"1px solid "+C.rule, background:"radial-gradient(130% 100% at 85% 50%, "+C.paperHi+", "+C.paperLo+" 92%, "+C.paperDeep+")"}}>
              <GhostWriting/>
              <PaperGrain side="left"/>
              <div style={{position:"relative", zIndex:3, height:"100%", display:"flex", flexDirection:"column", overflow:"hidden"}}>{leftLeaf}</div>
              <Gutter side="right"/>
            </div>
          )}
          <div style={{position:"relative", flex:1}}>
            <div className={turning?"turning":""} style={{...leafBase, background:"radial-gradient(130% 100% at 15% 50%, "+C.paperHi+", "+C.paperLo+" 92%, "+C.paperDeep+")", transformOrigin:"left center", transformStyle:"preserve-3d", transition:"transform 0.5s cubic-bezier(.4,.05,.3,1)", transform: turning?"rotateY(-19deg)":"rotateY(0)", zIndex:2}}>
              <GhostWriting/>
              <PaperGrain side="right"/>
              <div style={{position:"relative", zIndex:3, height:"100%", display:"flex", flexDirection:"column", overflow:"hidden"}}>
                {mobile && !isIndex ? <div style={{overflowY:"auto", height:"100%"}}>{leftLeaf}{rightLeaf}</div> : (single ? leftLeaf : rightLeaf)}
              </div>
              <Gutter side="left"/>
              {turning && <div style={{position:"absolute", inset:0, background:"linear-gradient(90deg, rgba(0,0,0,0.16), transparent 45%)", pointerEvents:"none"}}/>}
            </div>
          </div>
          {/* center spine: the dark valley where two pages meet in an open book */}
          {!mobile && !single && <div style={{position:"absolute", left:"50%", top:0, bottom:0, width:34, transform:"translateX(-50%)", pointerEvents:"none", zIndex:4,
            background:"linear-gradient(90deg, rgba(58,42,28,0) 0%, rgba(58,42,28,0.16) 38%, rgba(40,28,16,0.34) 50%, rgba(58,42,28,0.16) 62%, rgba(58,42,28,0) 100%)"}}/>}
        </div>

        {/* a soft page-curl highlight near the spine on each page, sells the curve */}
        {!mobile && !single && <div style={{position:"absolute", left:"50%", top:16, bottom:16, width:60, transform:"translateX(-50%)", pointerEvents:"none", zIndex:5,
          background:"linear-gradient(90deg, transparent, rgba(255,250,235,0.18) 44%, transparent 50%, rgba(255,250,235,0.18) 56%, transparent)"}}/>}

        {tableScene && <div style={{position:"absolute", inset:0, pointerEvents:"none", borderRadius:3, background:"radial-gradient(80% 70% at 50% 30%, rgba(248,242,224,0.14), transparent 72%)", zIndex:8, mixBlendMode:"soft-light"}}/>}
      </div>

      {/* ── always-visible top bar: where you are + quick jump ── */}
      <div style={{position:"fixed", top:0, left:0, right:0, zIndex:25, display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
        background:"linear-gradient(180deg, rgba(26,18,11,0.92), rgba(26,18,11,0.0))", pointerEvents:"none"}}>
        <button onClick={()=>setNavOpen(o=>!o)} aria-label="jump to a page" style={{pointerEvents:"auto", display:"flex", alignItems:"center", gap:7, background:"rgba(40,30,18,0.85)", color:"#e8d9b8", border:"1px solid #6a5436", borderRadius:8, fontFamily:DISPLAY, fontStyle:"italic", fontSize:13, padding:"7px 13px", cursor:"pointer", backdropFilter:"blur(4px)"}}>
          <span style={{fontSize:15, lineHeight:1}}>☰</span> jump
        </button>
        <div style={{pointerEvents:"none", display:"flex", alignItems:"center", gap:8, color:"#d8c9a8"}}>
          <span style={{width:10, height:10, borderRadius:2, background: curSec?curSec.ribbon:"#9c8a6e", display:"inline-block"}}/>
          <span style={{fontFamily:DISPLAY, fontSize:14}}>{isIndex ? "the index" : (curSec?curSec.title:"")}</span>
          {curIdx>=0 && <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:"#9a8a6e"}}>· {curIdx+1} of {SECTIONS.length}</span>}
        </div>
      </div>

      {/* ── the quick-jump menu (labeled, tap to go straight there) ── */}
      {navOpen && <>
        <div onClick={()=>setNavOpen(false)} style={{position:"fixed", inset:0, zIndex:29, background:"rgba(16,10,5,0.55)", backdropFilter:"blur(2px)"}}/>
        <div style={{position:"fixed", top:54, left:14, zIndex:30, width:"min(86vw, 320px)", background:"#efe3c6", border:"1px solid "+C.cover, borderRadius:10, boxShadow:"0 20px 50px rgba(0,0,0,0.5)", overflow:"hidden"}}>
          <div style={{padding:"11px 14px 7px", fontFamily:DISPLAY, fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.inkFaint, borderBottom:"1px solid "+C.ruleSoft}}>jump to any page</div>
          <div onClick={()=>{turnTo("index"); setNavOpen(false);}} style={navRow(isIndex)}>
            <span style={{width:11, height:11, borderRadius:2, background:"#9c8a6e", flexShrink:0}}/>
            <span style={{flex:1, fontFamily:DISPLAY, fontSize:15, color:C.ink}}>the index</span>
            {isIndex && <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.sanguine}}>here</span>}
          </div>
          {SECTIONS.map(sec=>{const on=sec.key===section;
            return <div key={sec.key} onClick={()=>{turnTo(sec.key); setNavOpen(false);}} style={navRow(on)}>
              <span style={{width:11, height:11, borderRadius:2, background:sec.ribbon, flexShrink:0, marginTop:3}}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:DISPLAY, fontSize:15, color:C.ink}}>{sec.title}</div>
                <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>{sec.sub}</div>
              </div>
              {!sec.voice && <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:C.inkFaint, marginTop:3}}>tool</span>}
              {on && <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.sanguine, marginTop:3}}>here</span>}
            </div>;
          })}
        </div>
      </>}

      {/* ── prev / next stepping (keeps the page-turn feel) ── */}
      {!isIndex && prevKey && <button onClick={()=>turnTo(prevKey)} aria-label="previous page" className="stepnav" style={stepNav("left", mobile)}>‹</button>}
      {!isIndex && nextKey && <button onClick={()=>turnTo(nextKey)} aria-label="next page" className="stepnav" style={stepNav("right", mobile)}>›</button>}

      {/* ── shelf return (top-left, the Alchemate home) ── */}
      <button onClick={backToShelf} className="scenebtn" aria-label="back to the bookshelf"
        style={{position:"fixed", top:14, left:14, zIndex:21, display:"flex", alignItems:"center", gap:7, background:"rgba(30,22,14,0.82)", color:"#e7cd8e", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"7px 13px 7px 10px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>
        <AlchemateMark size={15}/> the shelf
      </button>

      {/* ── scene toggle + index return ── */}
      <button onClick={()=>setScene(scene==="table"?"held":"table")} className="scenebtn"
        style={{position:"fixed", bottom:18, right:18, zIndex:20, background:"rgba(30,22,14,0.8)", color:"#d8c9a8", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"8px 14px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>
        {scene==="table" ? "take it up ✦" : "set it down ✦"}
      </button>
      {!isIndex && <button onClick={()=>turnTo("index")} className="scenebtn" style={{position:"fixed", bottom:18, left:18, zIndex:20, background:"rgba(30,22,14,0.8)", color:"#d8c9a8", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"8px 14px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>✦ index</button>}

      <style>{"@media (prefers-reduced-motion: reduce){ *{transition:none !important; animation:none !important;} } .ribbon:hover{ filter:brightness(1.12); } .ribbon:focus-visible,.scenebtn:focus-visible,.stepnav:focus-visible,.openbtn:focus-visible{ outline:2px solid "+C.candle+"; outline-offset:2px; } .stepnav:hover{ background:rgba(40,30,18,0.92) !important; } select,input,button{ outline-color:"+C.sanguine+"; } h1,h2,h3{ text-shadow:0 0 0.4px rgba(42,32,23,0.25); } p,span,div{ -webkit-font-smoothing:auto; } @keyframes bookOpen{ 0%{ transform:perspective(2200px) rotateX(3deg) rotateY(-26deg) scale(0.82); opacity:0.3;} 60%{ opacity:1;} 100%{ transform:perspective(2200px) rotateX(3deg) rotateY(0) scale(1);} } .bookopen{ animation:bookOpen 0.7s cubic-bezier(.4,.1,.2,1);} @keyframes idleFloat{ 0%,100%{ filter:drop-shadow(0 30px 50px rgba(0,0,0,0.5));} 50%{ filter:drop-shadow(0 38px 60px rgba(0,0,0,0.55));} } .openbtn:hover{ filter:brightness(1.06); transform:translateY(-1px);} .openbtn{ transition:all .2s;}"}</style>
    </div>
  );
}
function navRow(on){
  return { display:"flex", alignItems:"center", gap:11, padding:"11px 14px", cursor:"pointer", borderBottom:"1px solid "+C.ruleSoft, background:on?"rgba(156,74,60,0.10)":"transparent" };
}
function stepNav(side, mobile){
  return { position:"fixed", [side]:mobile?6:18, top:"50%", transform:"translateY(-50%)", zIndex:18,
    width:mobile?34:42, height:mobile?52:64, borderRadius:10, border:"1px solid #5a4330",
    background:"rgba(30,22,14,0.6)", color:"#d8c9a8", fontFamily:DISPLAY, fontSize:24, cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(3px)" };
}

// ── botanical desk objects, drawn in the same ink-on-paper hand as the pressed specimens ──
function Sprig({ size=70, color="#6f7a4a", tilt=0, opacity=0.8 }){
  return <svg viewBox="0 0 60 90" width={size} height={size*1.5} style={{display:"block", transform:`rotate(${tilt}deg)`, opacity}} aria-hidden="true">
    <path d="M30 88 C30 70 30 50 31 30 C31 18 29 10 27 4" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    {[68,58,48,38,28,20].map((y,i)=>{const left=i%2===0; const x=31; const dx=left?-14:14;
      return <path key={i} d={`M${x} ${y} C${x+dx*0.5} ${y-2} ${x+dx} ${y-6} ${x+dx} ${y-12} C${x+dx*0.6} ${y-10} ${x+dx*0.3} ${y-6} ${x} ${y}`} fill={color} opacity="0.55" stroke={color} strokeWidth="0.8"/>;})}
  </svg>;
}
function PottedHerb({ size=78, opacity=0.85 }){
  return <svg viewBox="0 0 80 100" width={size} height={size*1.25} style={{display:"block"}} aria-hidden="true">
    {/* leaves */}
    <g fill="#67733f" opacity="0.7" stroke="#4f5a30" strokeWidth="0.8">
      <path d="M40 52 C30 40 26 26 30 12 C36 24 42 36 42 52"/>
      <path d="M40 54 C50 40 56 28 53 14 C46 26 42 38 42 54"/>
      <path d="M40 55 C28 48 18 42 14 30 C26 36 36 42 42 55"/>
      <path d="M40 55 C52 48 62 42 66 30 C54 36 46 42 42 55"/>
      <path d="M40 56 C40 42 40 30 40 16 C40 32 41 44 42 56" opacity="0.85"/>
    </g>
    {/* terracotta pot */}
    <path d="M24 58 L56 58 L52 86 L28 86 Z" fill="#9c6b44" stroke="#73492b" strokeWidth="1.2"/>
    <rect x="22" y="54" width="36" height="7" rx="1.5" fill="#ab774d" stroke="#73492b" strokeWidth="1.2"/>
    <path d="M28 86 L52 86" stroke="#5e3a22" strokeWidth="1" opacity="0.5"/>
  </svg>;
}
function Vine({ height=200, color="#6f7a4a", opacity=0.6, flip=false }){
  return <svg viewBox="0 0 50 220" width={height*0.23} height={height} style={{display:"block", transform:flip?"scaleX(-1)":"none", opacity}} aria-hidden="true">
    <path d="M25 0 C14 30 34 56 22 86 C12 112 32 138 22 168 C16 190 26 206 24 220" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {[18,44,74,100,130,158,188].map((y,i)=>{const left=i%2===0;
      return <g key={i}><path d={`M${left?24:22} ${y} C${left?10:36} ${y-3} ${left?4:42} ${y-12} ${left?8:38} ${y-20} C${left?16:30} ${y-14} ${left?22:24} ${y-6} ${left?24:22} ${y}`} fill={color} opacity="0.5" stroke={color} strokeWidth="0.7"/></g>;})}
  </svg>;
}
function Leaf({ size=34, color="#747d4c", tilt=0, opacity=0.55 }){
  return <svg viewBox="0 0 40 24" width={size} height={size*0.6} style={{display:"block", transform:`rotate(${tilt}deg)`, opacity}} aria-hidden="true">
    <path d="M2 12 C12 2 28 2 38 12 C28 22 12 22 2 12 Z" fill={color} stroke="#525c33" strokeWidth="0.8"/>
    <path d="M4 12 L36 12" stroke="#525c33" strokeWidth="0.7" opacity="0.6"/>
  </svg>;
}
/* a large floor fern in a glazed urn — a statement plant for the study corners */
function TallFern({ height=320, color="#5e6c3a", opacity=0.85, flip=false }){
  // arcing fronds radiating from the pot
  const fronds=[-62,-44,-26,-8,8,26,44,62];
  return <svg viewBox="0 0 160 260" width={height*0.62} height={height} style={{display:"block", transform:flip?"scaleX(-1)":"none", opacity}} aria-hidden="true">
    {fronds.map((a,i)=>{
      const rad=a*Math.PI/180, len=92+ (i%3)*16;
      const tipx=80+Math.sin(rad)*len, tipy=150-Math.cos(rad)*len;
      const cx=80+Math.sin(rad)*len*0.5 - Math.cos(rad)*16, cy=150-Math.cos(rad)*len*0.5 - Math.sin(rad)*16;
      return <g key={i}>
        <path d={`M80 152 Q${cx} ${cy} ${tipx} ${tipy}`} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
        {/* leaflets along the frond */}
        {Array.from({length:7}).map((_,j)=>{const t=(j+1)/8;
          const px=80+(tipx-80)*t + (cx-80)*0.3*(1-Math.abs(0.5-t)*2);
          const py=152+(tipy-152)*t + (cy-152)*0.3*(1-Math.abs(0.5-t)*2);
          return <ellipse key={j} cx={px} cy={py} rx="6" ry="2.6" fill={color} opacity="0.7" transform={`rotate(${a+ (a>0?40:-40)} ${px} ${py})`}/>;})}
      </g>;
    })}
    {/* glazed urn */}
    <path d="M54 150 q-8 4 -6 16 l6 60 q2 14 26 14 t26 -14 l6 -60 q2 -12 -6 -16 Z" fill="#4a6360" stroke="#2c3c3a" strokeWidth="2"/>
    <ellipse cx="80" cy="152" rx="28" ry="8" fill="#3a4f4d" stroke="#2c3c3a" strokeWidth="2"/>
    <path d="M62 175 q18 6 36 0" fill="none" stroke="#2c3c3a" strokeWidth="1" opacity="0.5"/>
  </svg>;
}
/* a bundle of herbs hung to dry, head-down from a beam */
function HangingBundle({ size=120, color="#7a6a3a", opacity=0.8 }){
  return <svg viewBox="0 0 70 150" width={size*0.47} height={size} style={{display:"block", opacity}} aria-hidden="true">
    {/* twine + peg */}
    <line x1="35" y1="0" x2="35" y2="34" stroke="#5a4a30" strokeWidth="1.5"/>
    <rect x="30" y="30" width="10" height="8" rx="2" fill="#6a5536"/>
    {/* stems fanning down */}
    {[-22,-13,-4,5,14,23].map((a,i)=>{
      const rad=a*Math.PI/180, x2=35+Math.sin(rad)*90, y2=38+Math.cos(rad)*100;
      return <g key={i}>
        <path d={`M35 38 Q${35+Math.sin(rad)*30} ${90} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="1.6"/>
        {/* dried flower head at the tip */}
        <circle cx={x2} cy={y2} r="4" fill={i%2?"#9c8a4a":"#8a5a4a"} opacity="0.75"/>
        {Array.from({length:5}).map((_,j)=><ellipse key={j} cx={x2} cy={y2} rx="5.5" ry="1.8" fill={color} opacity="0.5" transform={`rotate(${j*36} ${x2} ${y2})`}/>)}
      </g>;
    })}
  </svg>;
}

function SceneBg({ tableScene }){
  if(!tableScene) return <div style={{position:"absolute", inset:0, background:"radial-gradient(circle at 50% 40%, transparent, rgba(0,0,0,0.5))"}} aria-hidden="true"/>;
  return <div style={{position:"absolute", inset:0, overflow:"hidden"}} aria-hidden="true">
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}}><defs><filter id="wd"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.06" numOctaves="3"/><feColorMatrix type="matrix" values="0 0 0 0 0.28 0 0 0 0 0.20 0 0 0 0 0.12 0 0 0 0.5 0"/></filter></defs><rect width="100%" height="100%" filter="url(#wd)" opacity="0.5"/></svg>
    {/* an even daylight wash across the table, soft and ambient */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(90% 80% at 50% 30%, rgba(228,214,180,0.16), transparent 70%)"}}/>

    {/* ── a working herbalist's bench: pots, vines, loose leaves around the edges ── */}
    {/* left side: candle + a potted herb beside it */}
    <div style={{position:"absolute", left:"7%", top:"22%", opacity:0.85}}>
      <div style={{width:13, height:42, background:"linear-gradient("+C.paperHi+",#d8c8a3)", borderRadius:3, margin:"0 auto", boxShadow:"0 6px 12px rgba(0,0,0,0.3)"}}/>
      <div style={{position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)", width:11, height:18, background:"radial-gradient(circle at 50% 70%, "+C.candle+", #c4762a 60%, transparent 72%)", borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%", filter:"blur(1px)", opacity:0.8}}/>
    </div>
    <div style={{position:"absolute", left:"4%", bottom:"12%"}}><PottedHerb size={92}/></div>
    {/* a vine trailing down the far left edge */}
    <div style={{position:"absolute", left:"-1%", top:"6%"}}><Vine height={230} opacity={0.5}/></div>

    {/* right side: pressed specimens, a sprig laid across the corner, a small pot */}
    <div style={{position:"absolute", right:"8%", bottom:"16%", transform:"rotate(18deg)", opacity:0.8}}><Pressed id={236776} size={58}/></div>
    <div style={{position:"absolute", right:"17%", bottom:"9%", transform:"rotate(-12deg)", opacity:0.62}}><Pressed id={236780} size={46}/></div>
    <div style={{position:"absolute", right:"3%", top:"14%"}}><Sprig size={84} tilt={26} opacity={0.7}/></div>
    <div style={{position:"absolute", right:"-1%", top:"40%"}}><Vine height={200} flip opacity={0.45}/></div>

    {/* a few loose leaves scattered across the surface */}
    <div style={{position:"absolute", left:"30%", bottom:"7%"}}><Leaf size={38} tilt={-18}/></div>
    <div style={{position:"absolute", left:"42%", top:"10%"}}><Leaf size={28} tilt={32} opacity={0.4}/></div>
    <div style={{position:"absolute", right:"30%", top:"16%"}}><Leaf size={32} tilt={-40} opacity={0.45}/></div>
    <div style={{position:"absolute", left:"20%", top:"40%"}}><Leaf size={24} tilt={12} opacity={0.35}/></div>

    <div style={{position:"absolute", inset:0, background:"radial-gradient(70% 60% at 50% 42%, transparent, rgba(0,0,0,0.55))"}}/>
  </div>;
}
/* warm reading-room ambiance behind the bookshelf */
function ShelfBg(){
  const vh = (typeof window!=="undefined" && window.innerHeight) ? window.innerHeight : 800;
  return <div style={{position:"absolute", inset:0, overflow:"hidden"}} aria-hidden="true">
    {/* deep back wall: warm plaster, vignetted */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(120% 90% at 50% 8%, #3a2c1b 0%, #271c10 45%, #150e07 100%)"}}/>
    {/* faint vertical wood paneling on the back wall */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.5}}>
      <defs>
        <filter id="plaster"><feTurbulence type="fractalNoise" baseFrequency="0.015 0.04" numOctaves="3" seed="6"/><feColorMatrix type="matrix" values="0 0 0 0 0.18 0 0 0 0 0.12 0 0 0 0 0.07 0 0 0 0.5 0"/></filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#plaster)" opacity="0.5"/>
      {/* panel seams */}
      {Array.from({length:7}).map((_,i)=>(<line key={i} x1={`${8+i*14}%`} y1="0" x2={`${8+i*14}%`} y2="100%" stroke="#000" strokeWidth="1.5" opacity="0.16"/>))}
    </svg>

    {/* ── tall arched window, upper right, with cool night light ── */}
    <svg style={{position:"absolute", right:"6%", top:"6%", width:"clamp(120px,18vw,230px)", height:"clamp(180px,30vh,360px)", opacity:0.9}} viewBox="0 0 120 200" preserveAspectRatio="xMidYMin meet">
      <defs>
        <linearGradient id="nightpane" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a3a52"/><stop offset="0.6" stopColor="#1c2a40"/><stop offset="1" stopColor="#141d2e"/></linearGradient>
        <radialGradient id="moon" cx="0.7" cy="0.25" r="0.3"><stop offset="0" stopColor="#cdd9ea" stopOpacity="0.9"/><stop offset="1" stopColor="#cdd9ea" stopOpacity="0"/></radialGradient>
      </defs>
      {/* stone surround */}
      <path d="M6 196 V60 a54 54 0 0 1 108 0 V196 Z" fill="#1a130b" stroke="#3a2c1c" strokeWidth="5"/>
      {/* panes */}
      <path d="M14 192 V60 a46 46 0 0 1 92 0 V192 Z" fill="url(#nightpane)"/>
      <circle cx="78" cy="66" r="30" fill="url(#moon)"/>
      <circle cx="80" cy="60" r="11" fill="#dde6f2" opacity="0.85"/>
      {/* muntins */}
      <g stroke="#0f0a06" strokeWidth="3" opacity="0.85">
        <line x1="60" y1="14" x2="60" y2="192"/><line x1="14" y1="86" x2="106" y2="86"/><line x1="20" y1="140" x2="100" y2="140"/>
        <path d="M14 60 a46 46 0 0 1 92 0" fill="none"/>
      </g>
    </svg>
    {/* cool light spilling from the window onto the scene */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(40% 50% at 80% 18%, rgba(160,185,220,0.12), transparent 60%)"}}/>

    {/* ── a tall cabinet of bottles behind, left side, slightly out of focus ── */}
    <div style={{position:"absolute", left:"3%", top:"14%", width:"clamp(90px,13vw,170px)", height:"clamp(170px,40vh,380px)", filter:"blur(1.2px)", opacity:0.7}}>
      <div style={{position:"absolute", inset:0, background:"linear-gradient(180deg,#3a2a1a,#241910)", borderRadius:4, border:"2px solid #1a120a"}}/>
      {/* three shelves of little bottles */}
      {[18,46,74].map((ty,si)=>(
        <div key={si} style={{position:"absolute", left:"8%", right:"8%", top:ty+"%", height:"3%", background:"#1a120a"}}/>
      ))}
      {[[14,8],[30,7],[48,9],[66,7],[80,8], [12,36],[34,35],[56,37],[76,36], [20,64],[44,63],[70,65]].map(([lx,ty],i)=>{
        const cols=["#6b7d4e","#9c4a3c","#46627a","#7d6a9c","#c19a45"]; const c=cols[i%cols.length];
        return <div key={i} style={{position:"absolute", left:lx+"%", top:ty+"%", width:7, height:`${10+ (i%4)*3}%`, background:`linear-gradient(180deg, ${c}, rgba(0,0,0,0.4))`, borderRadius:"2px 2px 1px 1px", opacity:0.85}}/>;
      })}
    </div>

    {/* ── a hanging lamp above, the warm key light ── */}
    <svg style={{position:"absolute", left:"50%", top:"-2%", transform:"translateX(-50%)", width:"clamp(60px,8vw,110px)", height:"clamp(70px,12vh,150px)", opacity:0.92}} viewBox="0 0 80 110">
      <line x1="40" y1="0" x2="40" y2="34" stroke="#2a1d12" strokeWidth="2.5"/>
      <path d="M22 34 H58 L50 58 a16 10 0 0 1 -28 0 Z" fill="#3a2a1a" stroke="#1a120a" strokeWidth="2"/>
      <ellipse cx="40" cy="58" rx="14" ry="6" fill="#f3c87a" opacity="0.9"/>
      <circle cx="40" cy="60" r="5" fill="#fff0cc"/>
    </svg>
    {/* the lamp's warm pool of light over the shelf */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(46% 42% at 50% 30%, rgba(243,200,122,0.26), rgba(243,200,122,0.05) 55%, transparent 72%)"}}/>

    {/* ── alembic + retort silhouettes on a near surface, lower left ── */}
    <svg style={{position:"absolute", left:"8%", bottom:"2%", width:"clamp(70px,11vw,150px)", height:"clamp(80px,16vh,180px)", opacity:0.8}} viewBox="0 0 100 110">
      <defs><linearGradient id="glassg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a6a55" stopOpacity="0.5"/><stop offset="1" stopColor="#2a2218" stopOpacity="0.8"/></linearGradient></defs>
      {/* round-bottom flask */}
      <path d="M30 18 h10 v20 a22 22 0 1 1 -10 0 V18 Z" fill="url(#glassg)" stroke="#1a140c" strokeWidth="1.5"/>
      <ellipse cx="35" cy="74" rx="14" ry="10" fill="#6b7d4e" opacity="0.4"/>
      {/* tall retort with curved neck */}
      <path d="M64 96 a18 18 0 1 1 18 -2 q10 -6 16 -2" fill="url(#glassg)" stroke="#1a140c" strokeWidth="1.5"/>
      <ellipse cx="70" cy="92" rx="13" ry="9" fill="#9c4a3c" opacity="0.4"/>
    </svg>
    {/* candle, lower right, with its own small glow */}
    <div style={{position:"absolute", right:"12%", bottom:"6%", opacity:0.85}}>
      <div style={{width:9, height:"clamp(30px,6vh,56px)", background:"linear-gradient(#e7d9bb,#bda77f)", borderRadius:2, margin:"0 auto", boxShadow:"0 6px 12px rgba(0,0,0,0.4)"}}/>
      <div style={{position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", width:9, height:15, background:"radial-gradient(circle at 50% 70%, #ffe7a0, #f3a83a 55%, transparent 72%)", borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%", filter:"blur(0.6px)"}}/>
    </div>
    <div style={{position:"absolute", right:"8%", bottom:"4%", width:120, height:120, background:"radial-gradient(circle, rgba(243,168,58,0.18), transparent 65%)"}}/>

    {/* drifting dust motes in the lamp light */}
    {Array.from({length:14}).map((_,i)=>{const x=20+((i*53)%60), y=14+((i*37)%62); const s=1.5+((i*7)%4);
      return <div key={i} style={{position:"absolute", left:x+"%", top:y+"%", width:s, height:s, borderRadius:"50%", background:"rgba(243,210,150,0.55)", filter:"blur(0.6px)"}}/>;})}

    {/* ── large plants & specimens filling the room ── */}
    {/* big floor fern, lower-left corner, in front of the bottle cabinet */}
    <div style={{position:"absolute", left:"-2%", bottom:"-4%", opacity:0.9}}><TallFern height={Math.min(380,vh*0.52)}/></div>
    {/* a second tall plant on the right, behind the candle */}
    <div style={{position:"absolute", right:"-3%", bottom:"-3%", opacity:0.82}}><TallFern height={Math.min(340,vh*0.46)} color="#566a3c" flip/></div>
    {/* trailing vines down both upper edges */}
    <div style={{position:"absolute", left:"1%", top:"-2%"}}><Vine height={Math.min(300,vh*0.4)} opacity={0.5}/></div>
    <div style={{position:"absolute", right:"22%", top:"-2%"}}><Vine height={Math.min(240,vh*0.32)} flip opacity={0.4}/></div>
    {/* bundles of herbs hung to dry from the top beam */}
    <div style={{position:"absolute", left:"32%", top:"-1%", opacity:0.78}}><HangingBundle size={Math.min(150,vh*0.2)}/></div>
    <div style={{position:"absolute", left:"44%", top:"-1%", opacity:0.66}}><HangingBundle size={Math.min(120,vh*0.16)} color="#6a5a3a"/></div>
    {/* framed pressed specimens on the back wall, left of the window */}
    <div style={{position:"absolute", right:"30%", top:"10%", opacity:0.6, transform:"rotate(-1.5deg)"}}>
      <div style={{padding:8, background:"#2a1d12", border:"2px solid #46321f", borderRadius:2, boxShadow:"0 8px 18px rgba(0,0,0,0.5)"}}><div style={{background:C.paper, padding:6}}><Pressed id={236776} size={54}/></div></div>
    </div>
    <div style={{position:"absolute", right:"40%", top:"24%", opacity:0.5, transform:"rotate(2deg)"}}>
      <div style={{padding:7, background:"#2a1d12", border:"2px solid #46321f", borderRadius:2, boxShadow:"0 8px 18px rgba(0,0,0,0.5)"}}><div style={{background:C.paper, padding:5}}><Pressed id={236761} size={44}/></div></div>
    </div>
    {/* a potted herb on the near shelf-edge, lower center-left */}
    <div style={{position:"absolute", left:"22%", bottom:"-2%", opacity:0.8}}><PottedHerb size={Math.min(110,vh*0.15)}/></div>

    {/* final atmospheric vignette */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(85% 75% at 50% 46%, transparent, rgba(0,0,0,0.55))"}}/>
  </div>;
}
const leafBase = { flex:1, height:"100%", position:"relative", overflow:"hidden", background:C.paper };
function Gutter({ side }){
  const bg = side==="left" ? "linear-gradient(90deg, rgba(58,42,28,0.2), transparent)" : "linear-gradient(270deg, rgba(58,42,28,0.2), transparent)";
  return <div style={{position:"absolute", top:0, bottom:0, [side]:0, width:32, pointerEvents:"none", zIndex:2, background:bg}} aria-hidden="true"/>;
}
   words kept to herbarium-tag brevity.
   APP-READY: live data routes through CONFIG + fetchPrices/fetchCharacter.
   ════════════════════════════════════════════════════════════════ */

const CONFIG = {
  ue:   { enabled: true, base: "https://api.undermine.exchange", region: "us", realm: "moon-guard", apiKey: "" },
  bnet: { enabled: false, clientId: "", redirectUri: "", region: "us", realm: "moon-guard", character: "gilshi" },
};

const C = {
  // foxed field-journal paper (deeper & warmer than the old herbarium cream)
  paper: "#e7d9bb", paperHi: "#f0e7ce", paperDeep: "#dccdaa", paperEdge: "#d3c4a3", card: "#ecdfc2",
  paperLo: "#d8c8a3", foxing: "#c4b08a",
  ink: "#2a2017", inkSoft: "#574838", inkFaint: "#897962",
  rule: "#b6a684", ruleSoft: "#cabfa1",
  sanguine: "#9c4a3c", verdigris: "#6b7d4e", sage: "#8a9c72", lotus: "#9c6a82",
  ochre: "#c19a45", ochreDeep: "#9a7833", ink2: "#46627a", plum: "#7d6a9c", wax: "#9a3f38",
  green: "#6b7d4e", greenDk: "#4a5733",
  // the physical book
  cover: "#5e4632", coverDk: "#3a2a1c", candle: "#f3c87a",
  tape: "rgba(206,196,168,0.55)", thread: "#9c4a3c",
};
const DISPLAY = "'Hoefler Text','Baskerville','Garamond','Times New Roman',serif";
const BODY = "'Iowan Old Style','Palatino Linotype','Palatino',Georgia,serif";
const HAND = "'Segoe Script','Bradley Hand','Brush Script MT',cursive";

/* ── DATA ───────────────────────────────────────────────────── */
const HERBS = [
  { id:236761, gid:236767, name:"Tranquility Bloom", latin:"Flos tranquillitatis", no:"01", role:"common potion base", tier:"common", est:8,  vel:10, color:C.sage },
  { id:236776, gid:236777, name:"Argentleaf",        latin:"Folium argenteum",     no:"02", role:"flask reagent",       tier:"common", est:14, vel:8,  color:C.verdigris },
  { id:236774, gid:236775, name:"Azeroot",           latin:"Radix azerothi",       no:"03", role:"potion base",         tier:"common", est:9,  vel:7,  color:C.verdigris },
  { id:236778, gid:236779, name:"Mana Lily",         latin:"Lilium manae",         no:"04", role:"inscription & potions",tier:"common", est:11, vel:8,  color:C.ink2 },
  { id:236770, gid:236771, name:"Sanguithorn",       latin:"Spina sanguinea",      no:"05", role:"flask reagent",       tier:"uncommon",est:22, vel:6,  color:C.sanguine },
  { id:236780, name:"Nocturnal Lotus",   latin:"Lotus nocturna",       no:"06", role:"rare flask gate · gathered by chance",tier:"premium",est:180,vel:4,color:C.lotus },
];
const HERB = id => HERBS.find(h=>h.id===id);

// non-herb crafting reagents that carry a real AH cost: the four motes + the vial.
// these are priced live alongside herbs so craft margins include them.
const REAGENTS = [
  { id:240990, name:"Sunglass Vial",          short:"Vial",  est:3,   color:C.ochre, kind:"vial" },
  { id:236949, name:"Mote of Light",          short:"Light", est:2,   color:C.ochre, kind:"mote" },
  { id:236950, name:"Mote of Primal Energy",  short:"Primal",est:6,   color:C.verdigris, kind:"mote" },
  { id:236951, name:"Mote of Wild Magic",     short:"Wild",  est:5,   color:C.sage, kind:"mote" },
  { id:236952, name:"Mote of Pure Void",      short:"Void",  est:9,   color:C.plum, kind:"mote" },
];
const REAGENT = id => REAGENTS.find(r=>r.id===id);
const MOTES = REAGENTS.filter(r=>r.kind==="mote"); // back-compat for any mote-only views
// resolve any material id (herb or reagent) to {name, est, ...} for cost math
const MAT = id => HERB(id) || REAGENT(id);

// FULL sellable catalog — the ranking engine scores every tradeable entry here.
// est/vel are realm estimates (clearly labeled in-app) until live UE data replaces them.
// ids are real where verified; placeholders resolve to real ids by name when hosted.
const PRODUCTS = [
  // ── Flasks (combat · one per secondary stat) ── mats ESTIMATED (wiki blocks recipe scrape)
  { id:241326, gid:241327, name:"Flask of the Shattered Sun",   cat:"Flask", kind:"flask", role:"Crit flask · flagship seller",  est:420, vel:9, v:false, mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6},{r:240990,q:2}], tradeable:true },
  { id:241322, gid:241323, name:"Flask of the Magisters",       cat:"Flask", kind:"flask", role:"Mastery · default healer flask", est:430, vel:9, v:false, mats:[{h:236780,q:1},{h:236770,q:8},{h:236778,q:6},{r:240990,q:2}], tradeable:true },
  { id:241325, gid:241324, name:"Flask of the Blood Knights",   cat:"Flask", kind:"flask", role:"Haste · often top DPS flask",    est:445, vel:8, v:false, mats:[{h:236780,q:1},{h:236770,q:6},{h:236776,q:8},{r:240990,q:2}], tradeable:true },
  { id:241320, gid:241321, name:"Flask of Thalassian Resistance",cat:"Flask",kind:"flask", role:"Vers · the base flask",          est:300, vel:5, v:false, mats:[{h:236774,q:8},{h:236776,q:6},{r:240990,q:2}], tradeable:true },
  { id:241332, name:"Vicious Thalassian Flask of Honor",         cat:"Flask", kind:"flask", role:"PvP · honor gains · Honor-bought recipe", est:120, vel:3, v:true, mats:[{h:236761,q:6},{h:236770,q:8},{h:236774,q:6},{r:240990,q:2}], tradeable:true },
  // ── Phials (profession stats) ── mats ESTIMATED
  { id:241311, name:"Haranir Phial of Finesse",     cat:"Phial", kind:"vial",  role:"gathering · sells to farmers",   est:75,  vel:5, v:false, mats:[{h:236774,q:3},{h:236778,q:2},{r:240990,q:1}], tradeable:true },
  { id:241312, name:"Haranir Phial of Ingenuity",   cat:"Phial", kind:"vial",  role:"crafting · sells to crafters",   est:80,  vel:5, v:false, mats:[{h:236770,q:3},{h:236778,q:2},{r:240990,q:1}], tradeable:true },
  { id:241317, name:"Haranir Phial of Perception",  cat:"Phial", kind:"vial",  role:"gathering · rare-find buff",     est:85,  vel:4, v:false, mats:[{h:236774,q:3},{h:236778,q:2},{r:240990,q:1}], tradeable:true },
  // ── Light potions ── VERIFIED from leveling guides
  { id:241309, name:"Light's Potential",            cat:"Light Potion", kind:"potion", role:"safe stat potion · bulk seller", est:55, vel:10, v:true,  mats:[{h:236761,q:8},{h:236774,q:3},{h:236776,q:3},{r:236949,q:1},{r:240990,q:5}], tradeable:true },
  { id:241296, gid:241297, name:"Potion of Zealotry",           cat:"Light Potion", kind:"potion", role:"Light combat variant",     est:48, vel:6, v:false, mats:[{h:236761,q:6},{h:236774,q:3},{r:240990,q:5}], tradeable:true },
  { id:241300, gid:241301, name:"Lightfused Mana Potion",       cat:"Light Potion", kind:"potion", role:"healer mana potion",       est:42, vel:8, v:true,  mats:[{h:236761,q:8},{h:236778,q:3},{r:240990,q:5}], tradeable:true },
  { id:241305, gid:241304, name:"Silvermoon Health Potion",     cat:"Light Potion", kind:"potion", role:"health · off combat CD",   est:30, vel:9, v:true,  mats:[{h:236761,q:6},{r:240990,q:5}], tradeable:true },
  { id:237055, name:"Refreshing Serum",             cat:"Light Potion", kind:"potion", role:"early utility · Stone mat", est:25, vel:4, v:true,  mats:[{h:236761,q:8},{h:236770,q:3},{r:240990,q:5}], tradeable:true },
  // ── Void potions ── Recklessness VERIFIED, others ESTIMATED
  { id:241332000, name:"Potion of Recklessness",    cat:"Void Potion", kind:"potion", role:"big stats, lose lowest · renown-gated", est:90, vel:4, v:true,  mats:[{h:236761,q:8},{h:236774,q:4},{r:236950,q:2},{r:240990,q:5}], tradeable:true },
  { id:241292, name:"Draught of Rampant Abandon",   cat:"Void Potion", kind:"potion", role:"more stats · puddle silences", est:70, vel:6, v:false, mats:[{h:236780,q:1},{h:236770,q:2},{r:240990,q:5}], tradeable:true },
  { id:241295, name:"Potion of Devoured Dreams",    cat:"Void Potion", kind:"potion", role:"void utility · risk/reward",   est:60, vel:4, v:false, mats:[{h:236770,q:3},{h:236778,q:2},{r:236952,q:1},{r:240990,q:5}], tradeable:true },
  { id:268954, gid:268955, name:"Entropic Extract",             cat:"Void Potion", kind:"potion", role:"early void leveling potion",   est:22, vel:3, v:true,  mats:[{h:236761,q:3},{r:240990,q:5}], tradeable:true },
  // ── Reagents / transmute products ──
  { id:237200, name:"Wondrous Synergist",           cat:"Reagent", kind:"vial", role:"daily · value unproven",      est:260, vel:2, v:false, mats:[{h:236780,q:1},{h:236776,q:5}], cooldown:"18h", tradeable:true },
  { id:237201, name:"Composite Flora",              cat:"Reagent", kind:"vial", role:"crafted reagent · feeds recipes", est:40, vel:5, v:true,  mats:[{h:236761,q:6},{h:236776,q:4},{r:236951,q:4},{r:236950,q:4}], tradeable:true },
  // ── Bound · never sold (listed, flagged) ──
  { id:237300, name:"Cauldron of Sin'dorei Flasks", cat:"Cauldron", kind:"cauldron", role:"raid utility · bound", est:null, vel:0, v:false, mats:[{h:236780,q:8},{h:236770,q:20},{h:236776,q:20}], tradeable:false },
];

// ── THE FULL ALCHEMY ENCYCLOPEDIA ──────────────────────────
// effect = what it does · tree/unlock/cost verified from Camberon's Cauldron tables
// bound: false=AH-tradeable, true=soulbound/warbound · mc: can Multicraft
const BOOK = [
  // ─ FLASKS (Thalassian combat · one per secondary stat · 1hr · persist through death) ─
  { cat:"Flask", name:"Flask of the Shattered Sun", effect:"+Critical Strike for 1 hr. Persists through death. The Crit flask.", tree:"Fluent in Flasks",
    unlock:"Craft Sin'dorei flasks 10×, then research: 5 Stabilized Derivate · 1 Nocturnal Lotus · 50 Moxie",
    mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6}], craftNote:"per-craft herb amounts derived from the bulk-leveling batch; an exact single-craft list isn't individually published", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of the Magisters", effect:"+Mastery for 1 hr. Persists through death. Default healer flask, highest healing.", tree:"Fluent in Flasks",
    unlock:"Craft Sin'dorei flasks 10×, then research: 50 Moxie",
    mats:[{h:236780,q:1},{h:236770,q:8},{h:236778,q:6}], craftNote:"plus ~2 Mote of Pure Void per craft; herb amounts derived from batch", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of the Blood Knights", effect:"+Haste for 1 hr. Persists through death. Often the top DPS flask.", tree:"Fluent in Flasks",
    unlock:"Drink a Flask of Thalassian Resistance to reveal it, then research: 50 Moxie",
    mats:[{h:236780,q:1},{h:236770,q:6},{h:236776,q:8}], craftNote:"plus ~2 Mote of Wild Magic per craft; herb amounts derived from batch", bound:false, mc:true, kind:"flask" },
  { cat:"Flask", name:"Flask of Thalassian Resistance", effect:"+Versatility for 1 hr. Persists through death. The base flask — taught by the spec, unlocks the others.", tree:"Fluent in Flasks",
    unlock:"Fluent in Flasks specialization node (no Camberon's research)",
    mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6}], craftNote:"this is the 'Sin'dorei flask' you craft 10× to reveal the others", bound:false, mc:true, kind:"flask" },
  // ─ FLASK CAULDRONS (bound · group) ─
  { cat:"Cauldron", name:"Cauldron of Sin'dorei Flasks", effect:"Place for the raid: members draw a Fleeting version of any of the 4 flasks (by their class/spec). 5 min, 40 charges.", tree:"Fluent in Flasks",
    unlock:"30 Knowledge in Fluent in Flasks",
    mats:[{h:236780,q:8},{h:236770,q:20},{h:236776,q:20}], craftNote:"plus ~100 Moxie; scales the single-flask recipe up for the whole raid", bound:true, mc:false, kind:"cauldron" },
  { cat:"Cauldron", name:"Voidlight Potion Cauldron", effect:"Place for the raid: members draw void combat potions. Bound utility.", tree:"Potion Prowess",
    unlock:"30 Knowledge in Potion Prowess",
    mats:[], craftNote:"~20 Stabilized Derivate + 75 Moxie + void-line herbs; exact per-craft list isn't published", bound:true, mc:false, kind:"cauldron" },
  // ─ PHIALS (Haranir · profession stats · 30 min · persist through death) ─
  { cat:"Phial", name:"Haranir Phial of Finesse", effect:"+Finesse & +Deftness (gathering) for 30 min. Persists through death. Sells to gatherers.", tree:"Fluent in Flasks",
    unlock:"Craft Haranir phials, research at Camberon's",
    mats:[{h:236774,q:3},{h:236778,q:2}], craftNote:"", bound:false, mc:true, kind:"vial" },
  { cat:"Phial", name:"Haranir Phial of Ingenuity", effect:"+Ingenuity & +Crafting Speed for 30 min. Persists through death. Sells to crafters.", tree:"Fluent in Flasks",
    unlock:"Craft Haranir phials 15×, then research: 25 Moxie",
    mats:[{h:236774,q:3},{h:236778,q:2}], craftNote:"herb amounts mirror the Finesse phial; an exact list isn't separately published", bound:false, mc:true, kind:"vial" },
  // ─ LIGHT POTIONS ─
  { cat:"Light Potion", name:"Light's Potential", effect:"+secondary stats, short burst (combat potion). The safe DPS/healer potion. Top bulk seller.", tree:"Potion Prowess",
    unlock:"Create 5 Midnight Healing Potions, then research: 50 Moxie",
    mats:[{h:236761,q:8},{h:236774,q:3},{h:236776,q:3}], craftNote:"plus 1 Mote of Light per craft (from the leveling batch: 80 Mote, 640 Tranquility, 240 Azeroot, 240 Argentleaf for ~80 crafts)", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Potion of Zealotry", effect:"Light combat potion variant. Stat burst on use.", tree:"Potion Prowess",
    unlock:"Brew 10 Light Potions, then research: 50 Moxie",
    mats:[], craftNote:"per-craft mats aren't individually published; uses Light-line herbs (Tranquility, Azeroot)", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Lightfused Mana Potion", effect:"Restores mana. Shares a cooldown with combat potions. The healer's mana potion.", tree:"Potion Prowess",
    unlock:"Recycle Midnight Potions 5× (free research)",
    mats:[{h:236761,q:8},{h:236778,q:3}], craftNote:"plus 5 Sunglass Vial (vendor: Melaris) per craft", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Silvermoon Health Potion", effect:"Restores health. Off the combat-potion cooldown — usable any time. Keep stacks on you.", tree:"Trainer",
    unlock:"Learned from Camberon (trainer) — no research",
    mats:[{h:236761,q:6}], craftNote:"plus Sunglass Vial (vendor) per craft", bound:false, mc:true, kind:"potion" },
  { cat:"Light Potion", name:"Refreshing Serum", effect:"Early utility potion. A leveling staple and a Philosopher's Stone reagent.", tree:"Trainer",
    unlock:"Trainer / first crafts — no research",
    mats:[{h:236761,q:8},{h:236770,q:3}], craftNote:"plus 5 Sunglass Vial (vendor) per craft", bound:false, mc:true, kind:"potion" },
  // ─ VOID POTIONS (risk/reward) ─
  { cat:"Void Potion", name:"Draught of Rampant Abandon", effect:"Bigger stat burst than Light's Potential, BUT drops a puddle that silences you if you stand in it. The risky DPS potion.", tree:"Potion Prowess",
    unlock:"Craft Void Potions 10×, then research: 50 Moxie",
    mats:[{h:236780,q:1},{h:236770,q:2}], craftNote:"per-craft herb amounts derived; a void-line recipe", bound:false, mc:true, kind:"potion" },
  { cat:"Void Potion", name:"Potion of Devoured Dreams", effect:"Void utility potion with a risk/reward effect.", tree:"Potion Prowess",
    unlock:"Craft Void Potions 15×, then research: 25 Moxie",
    mats:[], craftNote:"per-craft mats aren't individually published; void-line herbs", bound:false, mc:true, kind:"potion" },
  { cat:"Void Potion", name:"Entropic Extract", effect:"Early void-side leveling potion.", tree:"Trainer",
    unlock:"Trainer / first crafts — no research",
    mats:[{h:236761,q:3}], craftNote:"plus 5 Sunglass Vial (vendor) per craft", bound:false, mc:true, kind:"potion" },
  // ─ TRANSMUTES (motes Multicraft · materials don't · 18h shared cooldown) ─
  { cat:"Transmute", name:"Transmute: Mote of Light", effect:"Converts 10 of another mote → 8 Mote of Light. Multicrafts for more. Cycle: Light → Wild Magic → Pure Void → Primal Energy → Light.", tree:"Transmutation Authority",
    unlock:"Perform 5 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"10 of the prior mote in the cycle → 8 Mote of Light (Multicraft yields extra)", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Transmute: Mote of Primal Energy", effect:"Converts 10 of another mote → 8 Primal Energy. Multicrafts.", tree:"Transmutation Authority",
    unlock:"Perform 5 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"10 motes → 8 Primal Energy; 18h shared transmute cooldown", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Transmute: Mote of Wild Magic", effect:"Converts 10 of another mote → 8 Wild Magic. Multicrafts.", tree:"Transmutation Authority",
    unlock:"Trainer / early transmute",
    mats:[], craftNote:"10 Mote of Light + 1 Stabilized Derivate → 8 Wild Magic", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Transmute: Mote of Pure Void", effect:"Converts 10 of another mote → 8 Pure Void. Multicrafts.", tree:"Transmutation Authority",
    unlock:"Perform 10 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"10 motes → 8 Pure Void; 18h shared transmute cooldown", bound:false, mc:true, kind:"vial" },
  { cat:"Transmute", name:"Bouquet of Herbs", effect:"Material transmute → herbs. Cannot Multicraft (Resourcefulness only).", tree:"Transmutation Authority",
    unlock:"Perform 5 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"material conversion → herbs; net cost depends on your server's input:output prices", bound:false, mc:false, kind:"vial" },
  { cat:"Transmute", name:"School of Gems", effect:"Material transmute → gems. Cannot Multicraft.", tree:"Transmutation Authority",
    unlock:"Perform 10 Midnight Transmutations, then research: 25 Moxie",
    mats:[], craftNote:"material conversion → gems; check the AH input:output ratio", bound:false, mc:false, kind:"vial" },
  { cat:"Transmute", name:"Wondrous Synergist", effect:"Daily-cooldown reagent (18h, ~9h with talents). Feeds cauldrons & decor. Multicrafts. Value unproven — read your server first.", tree:"Transmutation Authority",
    unlock:"Synthesis Synergy sub-spec",
    mats:[{h:236780,q:1},{h:236776,q:5}], craftNote:"daily cooldown; exact per-craft mats aren't fully published", bound:false, mc:true, kind:"vial" },
  // ─ REAGENTS ─
  { cat:"Reagent", name:"Stabilized Derivate", effect:"Core intermediate — needed for almost every Camberon's research. Made by recycling your own potions/flasks. Never vendor spare potions; recycle them.", tree:"Core",
    unlock:"Recycle Potions / Recycle Flasks (known from the start)",
    mats:[], craftNote:"use the Recycle ability on potions/flasks you've crafted — no herb cost", bound:false, mc:true, kind:"vial" },
  { cat:"Reagent", name:"Composite Flora", effect:"Crafted reagent from motes + herbs. Feeds higher recipes.", tree:"Core",
    unlock:"First crafts — no research",
    mats:[{h:236761,q:6},{h:236776,q:4}], craftNote:"plus 4 Mote of Wild Magic + 4 Mote of Primal Energy per craft", bound:false, mc:true, kind:"vial" },
  // ─ EQUIPMENT / TRINKETS ─
  { cat:"Equipment", name:"Primal Philosopher's Stone", effect:"BoP starter trinket. REQUIRED to perform transmutes — craft it early.", tree:"Core",
    unlock:"Level Alchemy to 10, then research at Camberon's (free)",
    mats:[], craftNote:"2 Stabilized Derivate · 2 Mote of Light · 5 Refreshing Serum per craft (no raw herbs)", bound:true, mc:false, kind:"flask" },
  { cat:"Equipment", name:"Magister's Alchemist Stone", effect:"Epic trinket EMBELLISHMENT — enhances your potion effects. A real seller via crafting orders.", tree:"Transmutation Authority",
    unlock:"30 pts Transmutation Authority",
    mats:[], craftNote:"~30 Stabilized Derivate + a Spark (account cooldown item); BoP via orders", bound:false, mc:false, kind:"flask" },
  // ─ DYES (no skill req · 2-step · AH-tradeable) ─
  { cat:"Dye", name:"Pigments (step 1)", effect:"Convert 10 of ANY herb → 1 pigment. Quality is irrelevant — use the cheapest herb. Different herbs make different colors. No skill needed, no skill gained.", tree:"Classic Alchemy",
    unlock:"Known from the start — any skill level",
    mats:[], craftNote:"10 of any single herb → 1 pigment (any expansion's herbs work)", bound:false, mc:false, kind:"potion" },
  { cat:"Dye", name:"Dyes (step 2)", effect:"Turn 1 pigment → 1 dye at the neighborhood Dye Crafting Table (Founder's Point for Alliance). AH-tradeable, never bound. A steady repeat-buy market.", tree:"Classic Alchemy",
    unlock:"At the Dye Crafting Table — no skill required",
    mats:[], craftNote:"1 pigment → 1 dye; see the Dyes page for every color a pigment makes", bound:false, mc:false, kind:"potion" },
  // ─ HOUSING DECOR ─
  { cat:"Decor", name:"Alchemical Decor (set)", effect:"Candles, glowing bottles, ritual basins, decorative cauldrons, lab furnishings — Alchemy crafts mood. Tradable. Many feed on Wondrous Synergist.", tree:"Decor",
    unlock:"~Alchemy skill 80",
    mats:[], craftNote:"each piece needs Lumber (free neighborhood axe) + reagents. Exact Midnight decor recipe mats are still settling in-game and not yet published", bound:false, mc:false, kind:"cauldron" },
];

// dye color tree — which pigment makes which dyes
const DYES = [
  { pigment:"Blue", color:C.ink2, dyes:["Alliance Blue","Dusk Lily Grey","Midnight Blue","Nazjatar Navy","Zephras Blue"] },
  { pigment:"Purple", color:C.plum, dyes:["Arcwine","Forsaken Plum","Kirin Tor Violet","Moonberry Amethyst","Netherstorm Fuchsia","Nightsong Lilac","Void Violet"] },
  { pigment:"Red", color:C.sanguine, dyes:["Deep Mageroyal Red","Firebloom Red","Gilnean Rose","Hinterlands Hickory","Horde Red","Mahogany","Rain Poppy Red","Ratchet Rust"] },
  { pigment:"Green", color:C.verdigris, dyes:["Dustwallow Green","Earthroot","Emerald Dreaming","Gravemoss Green","Grizzly Hills Green","Lush Green","Silversage Green"] },
  { pigment:"Brown", color:C.ochreDeep, dyes:["Dark Gold","Earthen Brown","Heartwood","Kalimdor Sand","Mesquite Brown","Pale Umber","Timbermaw Brown","Vol'dun Taupe","Warm Teak"] },
  { pigment:"Orange", color:C.ochre, dyes:["Bronze","Copper","Elwynn Pumpkin","Koboldhide Brown"] },
  { pigment:"Teal", color:C.sage, dyes:["Kul Tiran Steel","Tidesage Teal","Un'goro Green","Vortex Teal"] },
];

const BOOK_CATS = ["All","Flask","Cauldron","Phial","Light Potion","Void Potion","Transmute","Reagent","Equipment","Dye","Decor"];

// ── TOMTOM WAYPOINTS (verified) ────────────────────────────
// each: label + the exact /way string to paste in-game
const WAYPOINTS = {
  alchTreasures: [
    { w:"/way #2393 47.8, 51.8 Pristine Potion", note:"Silvermoon · fly up, atop the building behind the Alchemy trainer" },
    { w:"/way #2393 45.1, 44.7 Vial of Eversong Oddities", note:"Silvermoon City" },
    { w:"/way #2393 49.1, 75.8 Freshly Plucked Peacebloom", note:"Silvermoon City" },
    { w:"/way #2437 40.4, 51.1 Vial of Zul'Aman Oddities", note:"Zul'Aman" },
    { w:"/way #2536 49.1, 23.6 Measured Ladle", note:"Zul'Aman, Atal'Aman · may be phased behind campaign" },
    { w:"/way #2413 34.8, 24.7 Vial of Rootlands Oddities", note:"Harandar · inside the building" },
    { w:"/way #2444 41.9, 40.6 Vial of Voidstorm Oddities", note:"Voidstorm, Slayer's Rise" },
    { w:"/way #2405 32.8, 43.3 Failed Experiment", note:"Voidstorm" },
  ],
  herbTreasures: [
    { w:"/way #2393 49.0, 75.9 Simple Leaf Pruners", note:"Silvermoon City" },
    { w:"/way #2395 64.2, 30.5 A Spade", note:"Eversong Woods" },
    { w:"/way #2437 41.9, 45.9 Sweeping Harvester's Scythe", note:"Zul'Aman" },
    { w:"/way #2413 51.1, 55.7 Planting Shovel", note:"Harandar" },
    { w:"/way #2413 38.3, 66.9 Bloomed Bud", note:"Harandar" },
    { w:"/way #2413 36.6, 25.1 Lightbloom Root", note:"Harandar" },
    { w:"/way #2413 76.1, 51.1 Harvester's Sickle", note:"Harandar" },
    { w:"/way #2405 34.7, 57.0 Peculiar Lotus", note:"Voidstorm" },
  ],
  npcs: [
    { label:"Camberon — Alchemy trainer & Cauldron", w:"/way Silvermoon City Camberon", note:"Silvermoon City. Cauldron object sits right beside him. Melaris (vial vendor) is next to him too." },
    { label:"Void Researcher Anomander — Alchemy Renown book", w:"/way Voidstorm Void Researcher Anomander", note:"Voidstorm. Sells Beyond the Event Horizon (10 KP). Needs Renown 9 with The Singularity + 75 Moxie." },
    { label:"Naynar — Herbalism Renown book", w:"/way Harandar Naynar", note:"Sells Traditions of the Haranir (10 KP). Needs Renown 6 with Hara'ti + 75 Moxie." },
    { label:"Chel the Chip — Herbalism Abundance book & travel toy", w:"/way Harandar Chel the Chip", note:"Sells Echo of Abundance (10 KP, 1,600 Abundance + 75 Moxie) and Dundun's travel toy." },
    { label:"Botanist Nathera — Herbalism weekly quest", w:"/way Silvermoon City Botanist Nathera", note:"Weekly herb hand-in for 3 KP." },
    { label:"Mirvedon — PvP flask (Honor)", w:"/way Silvermoon City Mirvedon", note:"Sells the PvP flask for Honor." },
    { label:"Dye Crafting Table (Alliance)", w:"/way Founder's Point Dye Crafting Table", note:"Turn pigments into dyes here. (Horde: Razorwind Shores.)" },
  ],
};

const KP_HERB = { weekOne:91, weekly:13,
  oneTime:[
    {name:"First-gather discoveries",kp:34,detail:"1 each · 34 node variants"},
    {name:"Traditions of the Haranir",kp:10,detail:"Naynar · 75 Moxie · Renown 6 Hara'ti",way:"/way Harandar Naynar"},
    {name:"Echo of Abundance",kp:10,detail:"Chel the Chip · 1,600 Abundance + 75 Moxie",way:"/way Harandar Chel the Chip"},
    {name:"Eight treasures",kp:24,detail:"3 each · Harandar holds four",ways:"herbTreasures"},
  ],
  weeklySources:[
    {name:"Trainer quest",kp:3,detail:"Botanist Nathera · hand in herbs",way:"/way Silvermoon City Botanist Nathera"},
    {name:"Gathering drops",kp:9,detail:"5 plumes, then a tail"},
    {name:"Inscription treatise",kp:1,detail:"public order or alt"},
  ],
  monthly:[{name:"Darkmoon Faire",kp:3,detail:"5 Moonberry Juice · first Sunday monthly"}],
  catchup:"Phoenix Ember drops when you're behind — no weekly cap.",
};
const KP_ALCH = { weekOne:50, weekly:18,
  oneTime:[
    {name:"First-craft discoveries",kp:"~",detail:"1 per new recipe"},
    {name:"Beyond the Event Horizon",kp:10,detail:"Void Researcher Anomander · 75 Moxie · Renown 9",way:"/way Voidstorm Void Researcher Anomander"},
    {name:"Eight treasures",kp:24,detail:"3 each · one may be phased",ways:"alchTreasures"},
  ],
  weeklySources:[
    {name:"Patron orders",kp:"12–24",detail:"the main source · check often"},
    {name:"Trainer quest",kp:2,detail:"Camberon · 3 crafting orders",way:"/way Silvermoon City Camberon"},
    {name:"Treasure drops",kp:4,detail:"Spore Sample + Aged Cruor"},
    {name:"Inscription treatise",kp:1,detail:"public order or alt"},
  ],
  monthly:[{name:"Darkmoon Faire",kp:3,detail:"5 Moonberry Juice · first Sunday monthly"}],
  catchup:"Flickers replace Glimmers in orders when you're behind.",
};

const RECIPES = [
  {name:"Light's Potential",tree:"Potion Prowess",unlock:"craft 5 healing potions",cost:"Derivate ×3",note:"best leveling recipe",sell:true},
  {name:"Voidlight Draught",tree:"Potion Prowess",unlock:"craft 10 potions",cost:"Derivate ×5 · 20 Moxie",note:"risk/reward void potion",sell:true},
  {name:"Voidlight Potion Cauldron",tree:"Potion Prowess",unlock:"30 pts Potion Prowess",cost:"Derivate ×20 · 75 Moxie",note:"bound · raid utility",sell:false},
  {name:"Sin'dorei Flasks",tree:"Fluent in Flasks",unlock:"craft 5 flasks",cost:"Derivate ×4",note:"craft 10 to unlock Shattered Sun",sell:true},
  {name:"Flask of the Shattered Sun",tree:"Fluent in Flasks",unlock:"craft 10 Sin'dorei Flasks",cost:"Derivate ×5 · Lotus ×1 · 50 Moxie",note:"your flagship seller",sell:true},
  {name:"Cauldron of Sin'dorei Flasks",tree:"Fluent in Flasks",unlock:"30 pts Fluent in Flasks",cost:"Derivate ×25 · 100 Moxie",note:"bound · 5 min, 40 charges",sell:false},
  {name:"Haranir Phial of Finesse",tree:"Fluent in Flasks",unlock:"craft 5 phials",cost:"Derivate ×6",note:"sells to gatherers",sell:true},
  {name:"Wondrous Synergist",tree:"Transmutation Authority",unlock:"Synthesis Synergy",cost:"18h cooldown",note:"value unproven",sell:true},
  {name:"Magister's Alchemist Stone",tree:"Transmutation Authority",unlock:"30 pts Transmutation Authority",cost:"Derivate ×30 · Spark",note:"epic embellishment",sell:true},
];

// ── RANKING ENGINE ─────────────────────────────────────────
// The order is COMPUTED, not hardcoded. Today it runs on the app's price
// estimates; when hosted, the same scorer reads live Undermine Exchange
// price + quantity and the ranking rebuilds itself. No UI change at switchover.
//
// Herbs   → score = sale price per unit · velocity breaks ties
// Craft   → score = MARGIN (sale price − live mat cost) · velocity breaks ties
//
// vel (1–10) is a stand-in for UE's daily "quantity" (how fast it moves).
// When live, swap item.vel for the real quantity figure from the API.

// editorial notes by id (the human read on each item — kept, but no longer sets the order)
const HERB_NOTE = {
  236780:"rarest · pure profit · never vendor",
  236770:"flask reagent · carries a premium",
  236776:"second in demand · always liquid",
  236778:"inscription gives a second market",
  236761:"plentiful · move in big stacks",
  236774:"utility herb · lowest priority",
};
const ALCH_NOTE = {
  237100:"flagship flask · Gold fetches a premium · list Tue–Thu",
  237050:"cheap, multicrafts, always wanted",
  237051:"niche · good when void is the current tier",
  237102:"light competition · sells to gatherers",
  237200:"unproven · cauldron & decor only · daily cooldown",
};
// grade is derived from where an item lands in the live ranking, not fixed
const gradeFor = (rankIdx, total) => {
  const pct = rankIdx/Math.max(1,total-1);
  if(rankIdx===0) return "finest";
  if(pct<=0.34) return "choice";
  if(pct<=0.67) return "good";
  return "plain";
};

// returns herbs sorted by live (or estimated) sale price, velocity as tiebreaker
function rankHerbs(price){
  const scored = HERBS.map(h=>{
    const pa = price(h.id) ?? null;
    const pb = h.gid ? (price(h.gid) ?? null) : null;
    let saleGold=null, saleSilver=null;
    if(pa!=null && pb!=null){ saleGold=Math.max(pa,pb); saleSilver=Math.min(pa,pb); }
    else if(pa!=null){ saleSilver=pa; }
    else if(pb!=null){ saleSilver=pb; }
    else { saleSilver=h.est ?? null; }
    const baseline = saleSilver ?? h.est ?? 0;
    return { id:h.id, item:h, price:baseline, saleSilver, saleGold, vel:h.vel??0, score:(saleGold ?? baseline) };
  }).sort((a,b)=> b.score-a.score || b.vel-a.vel );
  return scored.map((s,i)=>({ ...s, rank:i+1, grade:gradeFor(i,scored.length), why:HERB_NOTE[s.id]||s.item.role }));
}

// UE's commodity feed returns ONE price per item — the market sell price in gold.

// returns tradeable craftables with BOTH qualities' market prices.
// We fetch both quality IDs, then label by PRICE: the higher is always Gold,
// the lower is always Silver. (Never trust which ID is which — let coin decide.)
function rankCraft(price){
  const sellable = PRODUCTS.filter(p=>p.tradeable);
  const scored = sellable.map(prod=>{
    const pa = price(prod.id) ?? null;
    const pb = prod.gid ? (price(prod.gid) ?? null) : null;
    // only call it a gold/silver pair when we truly have TWO live prices
    let saleGold=null, saleSilver=null;
    if(pa!=null && pb!=null){ saleGold=Math.max(pa,pb); saleSilver=Math.min(pa,pb); }
    else if(pa!=null){ saleSilver=pa; }            // single price = the base (silver)
    else if(pb!=null){ saleSilver=pb; }
    else { saleSilver=prod.est ?? null; }          // fall back to estimate
    const baseline = saleSilver ?? prod.est ?? 0;
    const cost = matCost(prod.mats, price);                 // herbs + vials + motes
    const herbCost = matCost((prod.mats||[]).filter(m=>m.h), price); // herb portion only
    const reagentCost = cost - herbCost;                    // vials + motes
    // "gathered" = you farmed the herbs free, but still bought vials/motes
    const marginGathered = baseline - reagentCost;
    const marginBuy = baseline - cost;
    return { id:prod.id, item:prod, sale:baseline, saleSilver, saleGold,
             cost, herbCost, reagentCost, verified:prod.v===true,
             marginGathered, marginBuy, margin:baseline,
             vel:prod.vel??0, score:(saleGold ?? baseline) };
  }).sort((a,b)=> b.score-a.score || b.vel-a.vel );
  return scored.map((s,i)=>({ ...s, rank:i+1, grade:gradeFor(i,scored.length), why:ALCH_NOTE[s.id]||s.item.role }));
}

const ALCH_UTILITY = [
  {id:237300,name:"Cauldron of Sin'dorei Flasks",why:"bound when made · place it for the raid, five minutes, forty charges · the worth is flasks unbought"},
];

const CONC_FACTS = [
  {k:"the pool",v:"per character, per profession · capped at 1,000"},
  {k:"refill",v:"1 per 6 min · 10/hour · ~100h dry to full"},
  {k:"Ingenuity",v:"refunds part of what you spend · ~50%, capped 70%"},
  {k:"rising cost",v:"the last skill points cost far more than the first"},
  {k:"spend on",v:"Gold-worth consumables, quality orders, lasting tools"},
  {k:"the end",v:"fully maxed, you reach top rank unaided"},
];
const STATS = [
  {name:"Multicraft",color:C.verdigris,note:"the gold-maker · ~⅓ more yield"},
  {name:"Ingenuity",color:C.plum,note:"refunds Concentration"},
  {name:"Resourcefulness",color:C.ochre,note:"fewer reagents · lifts order profit"},
  {name:"Crafting Speed",color:C.inkFaint,note:"never worth gearing for"},
];

/* ── FURNITURE & REWARDS ──────────────────────────────────────
   Two distinct buckets players confuse:
   (A) achievement-reward decor — EARNED by completing a profession
       achievement, account-wide, applied retroactively, NOT craftable.
   (B) crafted decor — you MAKE it (needs Lumber + often Wondrous
       Synergist) and can sell it. Fully tradable.
   Midnight housing decor is still settling in-game, so specific
   item↔achievement mappings are marked confirmed:false until verified. */
const FURNITURE = {
  // shared facts that ARE confirmed
  facts: [
    "Every Midnight decor craft needs Lumber — a universal reagent. Lumber needs no profession; grab the free axe from a neighborhood NPC and harvest it in any zone.",
    "Decor recipes start unlocking around Alchemy skill 80-85. They're costly to craft but fully tradable, so they sell on the AH.",
    "Wondrous Synergist (the daily-cooldown transmute) feeds many decor recipes and both cauldrons — its price rides the decor market.",
    "Achievement decor is applied retroactively: achievements you've already earned can grant their decor the moment housing goes live. Duplicates are then buyable from vendors.",
  ],
  // (A) earned by achievements — NOT craftable
  earned: [
    { name:"Crafting-achievement decor", from:"Alchemy & Herbalism crafting achievements", confirmed:false,
      note:"Profession achievements grant housing decor account-wide. The exact piece per achievement isn't published yet for these two professions." },
    { name:"Lotus Hunter mount", from:"Herbalism · gather 1,000 Nocturnal Lotus", confirmed:true,
      note:"a cosmetic mount, not furniture — but the marquee earned reward of the gathering grind." },
  ],
  // (B) crafted by the professions — tradable, sellable
  crafted: [
    { name:"Alchemy housing decor (set)", skill:"~80+", confirmed:true, needs:"Lumber + reagents, many use Wondrous Synergist",
      note:"candles, glowing bottles, ritual basins, decorative cauldrons, lab furnishings. Tradable. Specific recipe mats still settling in-game." },
    { name:"Dyes", skill:"learned mid-level", confirmed:true, needs:"pigments (from Inscription milling) refined by Alchemy",
      note:"Alchemy + Inscription collaboration. Always-needed repeat-buy; steady coin. Tradable." },
    { name:"Dragon's-hoard & themed pieces", skill:"~85+", confirmed:false, needs:"Lumber + Wondrous Synergist (likely)",
      note:"named decorative sets are reported but exact recipes aren't confirmed for Midnight yet." },
  ],
};
const ACHIEVEMENTS = [
  {name:"First Harvest",req:"gather all herb variants",reward:"≈34 KP",type:"Knowledge",note:"front-loaded · do it early", confirmed:true},
  {name:"Lotus Hunter",req:"gather 1,000 Nocturnal Lotus",reward:"the gathering mount",type:"Mount",note:"the premium-herb grind", confirmed:true},
  {name:"Sin'dorei Alchemist",req:"craft 5 flasks",reward:"flask recipes via the Cauldron",type:"Recipe",note:"by deed, not chance · this is how the Discovery system works", confirmed:true},
  {name:"Crafting-achievement decor",req:"various Alchemy/Herbalism crafting achievements",reward:"housing decor (account-wide)",type:"Decor",note:"granted retroactively · exact piece-per-achievement not yet published", confirmed:false},
];

const ZONES = [
  {name:"Eversong Woods",difficulty:"gentle",mote:"Mote of Light",color:C.ochre,terrain:"woods",notes:"even ground, few foes · follow the rivers, where nodes gather thickest",
   nodes:[[20,30],[35,25],[50,35],[65,28],[78,40],[70,58],[55,65],[40,60],[28,52],[22,42]],river:[[15,48],[35,50],[55,55],[75,50],[88,58]]},
  {name:"Zul'Aman",difficulty:"trying",mote:"Mote of Wild Magic",color:C.sanguine,terrain:"ruins",notes:"crowded · carry Deftness or be interrupted · richest in Argentleaf & Azeroot",
   nodes:[[25,35],[42,30],[58,38],[72,32],[80,48],[68,60],[50,68],[32,62],[20,50]],river:[]},
  {name:"Harandar",difficulty:"severe",mote:"Mote of Primal Energy",color:C.verdigris,terrain:"thicket",notes:"vertical thicket, dense with foes · four treasures wait here",
   nodes:[[30,22],[50,18],[68,25],[78,42],[72,60],[55,70],[38,66],[25,50],[42,45],[60,48]],river:[]},
  {name:"Voidstorm",difficulty:"harsh",mote:"Mote of Pure Void",color:C.plum,terrain:"void",notes:"a hostile maze · the sole Pure Void source · bring all the Deftness you can",
   nodes:[[22,40],[38,28],[55,32],[70,26],[82,44],[74,62],[58,70],[40,64],[28,55]],river:[]},
];

const DEFAULT_CHAR = { name:"Gilshi", realm:"Moon Guard", faction:"Alliance", race:"Pandaren", class:"Death Knight", herbSkill:100, herbMax:100, alchSkill:100, alchMax:100, herbKP:0, alchKP:0 };

async function fetchPrices(realm){
  // Calls our own serverless proxy (/api/prices), which talks to Undermine
  // Exchange server-side. Returns { prices:{id:gold}, realm, updated } so the
  // app can show which realm and how fresh the numbers are.
  const allIds=[...HERBS,...PRODUCTS,...REAGENTS].flatMap(i=>[i.id, i.gid].filter(Boolean));
  const ids=[...new Set(allIds)].join(",");
  const region=CONFIG.ue.region||"us";
  try{
    const r=await fetch("/api/prices?region="+region+"&realm="+encodeURIComponent(realm)+"&ids="+ids);
    if(!r.ok) return null;
    const d=await r.json();
    const src = d.prices || d; // tolerate either shape
    const out={}; for(const k in src){ if(src[k]!=null) out[String(k)]=src[k]; }
    return { prices:out, realm, region, updated: d.updated || Date.now() };
  }catch{return null;}
}
const fmtG = n => n==null?"-":n>=1000?`${(n/1000).toFixed(1)}k`:Math.round(n).toLocaleString();

// total material cost of a recipe across BOTH herbs and reagents (vials, motes).
// price(id) is the live lookup; falls back to each mat's labeled estimate.
function matCost(mats, price){
  return (mats||[]).reduce((sum,m)=>{
    const id = m.h ?? m.r;
    const mat = MAT(id);
    const unit = (price && price(id)!=null) ? price(id) : (mat?.est ?? 0);
    return sum + unit*(m.q||0);
  },0);
}

// in-game quality marks: silver diamond (lower), gold glowing pentagon (higher)
function QSilver({ size=12 }){
  return <svg width={size} height={size} viewBox="0 0 16 16" style={{display:"inline-block", verticalAlign:"-1px"}} aria-label="silver quality">
    <defs><linearGradient id="qsil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8edf2"/><stop offset="0.5" stopColor="#b8c2cc"/><stop offset="1" stopColor="#8a96a3"/></linearGradient></defs>
    <path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" fill="url(#qsil)" stroke="#6c7682" strokeWidth="1"/>
    <path d="M8 3.5 L6 7 L8 6 L10 7 Z" fill="#f5f8fb" opacity="0.7"/>
  </svg>;
}
function QGold({ size=13 }){
  return <svg width={size} height={size} viewBox="0 0 16 16" style={{display:"inline-block", verticalAlign:"-1px"}} aria-label="gold quality">
    <defs>
      <radialGradient id="qglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0.5" stopColor="#ffe9a8" stopOpacity="0.9"/><stop offset="1" stopColor="#ffd24d" stopOpacity="0"/></radialGradient>
      <linearGradient id="qgold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe9a0"/><stop offset="0.5" stopColor="#f4b733"/><stop offset="1" stopColor="#c8841a"/></linearGradient>
    </defs>
    <circle cx="8" cy="8" r="8" fill="url(#qglow)"/>
    <path d="M8 1.6 L14 6 L11.7 13.2 L4.3 13.2 L2 6 Z" fill="url(#qgold)" stroke="#9c6512" strokeWidth="1" strokeLinejoin="round"/>
    <path d="M8 3.4 L6.5 6.5 L8 5.7 L9.5 6.5 Z" fill="#fff6dc" opacity="0.8"/>
  </svg>;
}

/* ════════════════════════════════════════════════════════════════
   ILLUSTRATIONS — the interface is drawn
   ════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════
   SPECIALIZATION TREES — verified structure, Midnight (12.0.x)
   Point thresholds and branch names are confirmed; exact per-point
   stat values are mostly unpublished, so effects are described by
   their known milestones with honest notes where precision is unknown.
   ════════════════════════════════════════════════════════════════ */
// per-branch NODES: the real point gates and what each grants, for the visual tree.
// Sourced from Midnight profession guides (Lorewoven, Method, Icy Veins, Wowhead).
// "at" = points needed; nodes with parent>=0 hang off a sub-branch line.
const SPEC_TREES = {
  herb: {
    label:"Herbalism", accent:C.verdigris, cap:90,
    branches:[
      { key:"botany", name:"Botany", color:C.verdigris, max:40,
        gist:"quality of life. mounted gathering at 40 — the first thing a non-druid needs.",
        trunk:[
          {at:1,  t:"Botany root", d:"+Finesse and +Deftness trickle in as you fill the trunk"},
          {at:10, t:"Sub-spec unlocked", d:"opens the Mulching and Cultivation lines below"},
          {at:40, t:"Mounted Gathering", d:"gather without dismounting — roughly doubles route speed", key:true},
        ],
        subs:[
          { name:"Mulching", color:C.sage, nodes:[
            {at:20, t:"Imbued Mulch", d:"10 Tranquility Bloom → mulch that forces a Nocturnal Lotus on your next pick"},
            {at:30, t:"Magical Mulch", d:"mulch that guarantees a Finesse proc (bonus herbs) next gather"},
            {at:40, t:"Empowered Mulch", d:"mulch that guarantees a max-rank Gold herb next gather"},
          ]},
          { name:"Cultivation", color:C.lotus, nodes:[
            {at:20, t:"Seeds", d:"plant seeds on Rich Soil by rivers, harvest herbs on the spot"},
            {at:30, t:"Infused seeds", d:"planted herbs can roll elemental / higher-rank variants"},
            {at:40, t:"Overload synergy", d:"cuts Overload cooldown, ties Cultivation into mote farming"},
          ]},
        ],
        note:"the 40-point payoff (mounted gathering) is the whole reason. both subs are minor — Mulching's Lotus mulch is the pick if you go there." },
      { key:"bountiful", name:"Bountiful Harvests", color:C.ochreDeep, max:40,
        gist:"pure yield. +1 min & +1 max herb at 40, plus skill for more Gold-quality.",
        trunk:[
          {at:1,  t:"Bountiful root", d:"+yield and +herb skill (more Gold quality) as you fill it"},
          {at:10, t:"Sub-spec unlocked", d:"opens per-herb focus lines below"},
          {at:40, t:"+1 Min & +1 Max Yield", d:"every node gives at least one more herb, often two", key:true},
        ],
        subs:[
          { name:"Per-herb focus", color:C.ochre, nodes:[
            {at:20, t:"Tranquility / Sanguithorn / Mana Lily / Argentleaf", d:"pick one: ~15-20% Finesse proc for bonus herbs + skill for that herb"},
            {at:40, t:"Maxed herb focus", d:"at 40 in one herb, raises that herb's Nocturnal Lotus drop rate"},
          ]},
        ],
        note:"strongest gold tree once you can gather mounted. focus the herb selling highest on Moon Guard." },
      { key:"overload", name:"Midnight Overload", color:C.plum, max:40,
        gist:"infused-node farming. a second Overload charge at 40. only if you chase elemental nodes.",
        trunk:[
          {at:1,  t:"Overload root", d:"passive Overload cooldown reduction — free to grab"},
          {at:40, t:"Second Overload Charge", d:"double-dip infused nodes for twice the motes", key:true},
        ],
        subs:[
          { name:"By element", color:C.ink2, nodes:[
            {at:15, t:"Voidbound (Voidstorm)", d:"more Mote of Pure Void · also grants a portal back out of deep nodes"},
            {at:15, t:"Wild (Zul'Aman)", d:"more Mote of Wild Magic — the Inscription treatise mote"},
            {at:15, t:"Lightfused (Eversong)", d:"more Mote of Light from light-infused nodes"},
            {at:15, t:"Primal (Harandar)", d:"more Mote of Primal Energy from primal nodes"},
          ]},
        ],
        note:"heavy cost for a benefit only on rare infused nodes. take Voidbound first for the safety portal. last priority for most." },
    ],
  },
  alch: {
    label:"Alchemy", accent:C.ochreDeep, cap:90,
    branches:[
      { key:"flasks", name:"Fluent in Flasks", color:C.sanguine, max:30,
        gist:"flasks & phials. the personal/raid flask duration perks live here, very early.",
        trunk:[
          {at:1,  t:"Fluent root", d:"learn the base Thalassian flask; +flask & phial skill"},
          {at:5,  t:"Personal flask duration ×2", d:"your own flasks last twice as long"},
          {at:15, t:"Party/raid flask duration ×2", d:"doubles flask duration for the whole group — unlocked early, huge raid value", key:true},
          {at:30, t:"Cauldron of Sin'dorei Flasks", d:"one craft, flasks for the whole raid (warbound, not sellable)"},
        ],
        subs:[
          { name:"Sin'dorei Specialist (Thalassian)", color:C.ochreDeep, nodes:[
            {at:10, t:"Flask Abundance", d:"the gold-making node: multiplies Multicraft on Thalassian flasks — free extra flasks"},
            {at:30, t:"Concentration & skill", d:"big Ingenuity + reduced Concentration use → natural Gold-rank flasks"},
          ]},
          { name:"Haranir Secrets (Phials)", color:C.verdigris, nodes:[
            {at:10, t:"Phial Abundance", d:"Multicraft on Haranir profession phials — free extra phials"},
            {at:30, t:"Phial mastery", d:"skill & Concentration savings for Gold-rank phials"},
          ]},
        ],
        note:"go to 15 first in every build — the raid duration perk is the best early value in the whole profession. Flask Abundance is the seller's node." },
      { key:"potions", name:"Potion Prowess", color:C.ink2, max:30,
        gist:"potions, split into Light and Void lines. the bulk-volume sellers.",
        trunk:[
          {at:1,  t:"Prowess root", d:"+potions per craft; +potion skill"},
          {at:10, t:"Sub-spec unlocked", d:"unlocks Light's Potential (Light) and Void-Shrouded Tincture (Void)"},
          {at:20, t:"More recipes + yield", d:"opens the deeper potion recipes and raises yield"},
          {at:30, t:"Voidlight Potion Cauldron", d:"group potion cauldron (bound utility)", key:true},
        ],
        subs:[
          { name:"Path of Light", color:C.ochre, nodes:[
            {at:10, t:"Prolific Potioneer · Light", d:"unlock the Light Multicraft node"},
            {at:30, t:"Maxed Light", d:"fill for max Multicraft + quality on Light's Potential and kin"},
          ]},
          { name:"Path of Void", color:C.plum, nodes:[
            {at:10, t:"Prolific Potioneer · Void", d:"unlock the Void Multicraft node"},
            {at:30, t:"Maxed Void", d:"max Multicraft + quality on Void potions (higher risk/reward brews)"},
          ]},
        ],
        note:"Light's Potential is the steady bulk earner — go Path of Light for AH volume. Prolific Potioneer is the node that actually prints gold." },
      { key:"transmute", name:"Transmutation Authority", color:C.verdigris, max:30,
        gist:"transmutes & reagents. mote cycling and the Wondrous Synergist daily.",
        trunk:[
          {at:1,  t:"Authority root", d:"learn mote transmutes: 10 of one mote → 8 of another (18h shared CD, can Multicraft)"},
          {at:5,  t:"Sub-spec unlocked", d:"early — opens Synthesis Synergy"},
          {at:30, t:"Magister's Alchemist Stone", d:"epic embellishment trinket that boosts your potion effects", key:true},
        ],
        subs:[
          { name:"Synthesis Synergy", color:C.ochreDeep, nodes:[
            {at:5,  t:"Wondrous Synergist", d:"daily-cooldown transmute reagent used in cauldrons & housing decor"},
            {at:20, t:"Transmute Multicraft", d:"free extra motes / reagents on transmute crafts"},
          ]},
        ],
        note:"niche. worth it for dedicated transmuters or the Magister's Stone. Synergist's value swings with the housing-decor market — watch it." },
      { key:"mastery", name:"Alchemical Mastery", color:C.plum, max:30,
        gist:"the efficiency tree. Resourcefulness (cheaper crafts) + skill that applies to everything.",
        trunk:[
          {at:1,  t:"Mastery root", d:"flat Alchemy skill that applies to every craft — helps reach Gold rank"},
          {at:10, t:"Sub-spec unlocked", d:"opens the three Resourcefulness lines below"},
        ],
        subs:[
          { name:"Recycle", color:C.sanguine, nodes:[
            {at:20, t:"Resourcefulness · flasks & phials", d:"chance to use fewer mats on flasks/phials → pure margin"},
          ]},
          { name:"Reuse", color:C.ink2, nodes:[
            {at:20, t:"Resourcefulness · potions", d:"chance to use fewer mats on potions → pure margin"},
          ]},
          { name:"Reduce", color:C.verdigris, nodes:[
            {at:20, t:"Resourcefulness · reagents", d:"chance to use fewer mats on transmutes & other crafts"},
          ]},
        ],
        note:"unlocks no recipes, only stats — but 10-20 points here is free money once your main tree is set. match the line to whatever you craft most." },
    ],
  },
};


// each herb → its own pressed-specimen silhouette + tints.
// stylized field-journal botanicals (Gilshi's own drawings), grounded in
// lore where it exists — not claimed as screen-accurate game art.
const FORM = {
  236761:{form:"bellbloom", green:"#7c8a55", flower:"#e2cf86"}, // Tranquility Bloom — riverside bells
  236776:{form:"silverfern",green:"#8a9472", flower:"#d2d6c0"}, // Argentleaf — silver frond
  236774:{form:"root",      green:"#9a7d52", flower:"#b89a64"}, // Azeroot — knotted root
  236778:{form:"lily",      green:"#6f7f86", flower:"#a8b8c6"}, // Mana Lily — true lily
  236770:{form:"bramble",   green:"#6e5642", flower:"#9c4a3c"}, // Sanguithorn — blood bramble
  236780:{form:"lotus",     green:"#54657f", flower:"#8a76aa"}, // Nocturnal Lotus — dark lotus
};
function pressedOf(id){ const h=HERB(id)||{}; const f=FORM[id]||{form:"bellbloom",green:C.green,flower:C.ochre}; return {...f, no:h.no||"", name:h.name||""}; }

function Pressed({ id, s, size=110 }){
  const sp = s || pressedOf(id);
  const k = sp.no || id || "x";
  const G = "url(#st"+k+")", F = "url(#pr"+k+")", AG = "url(#ag"+k+")";
  return (
    <svg viewBox="0 0 120 150" width={size} height={size*1.25} style={{display:"block", filter:"saturate(0.8)"}} aria-hidden="true">
      <defs>
        <radialGradient id={"pr"+k} cx="50%" cy="42%" r="62%"><stop offset="0%" stopColor={sp.flower} stopOpacity="0.96"/><stop offset="100%" stopColor={sp.green} stopOpacity="0.9"/></radialGradient>
        <linearGradient id={"st"+k} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sp.green}/><stop offset="100%" stopColor={C.greenDk}/></linearGradient>
        <filter id={"ag"+k}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.4 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="over"/></filter>
      </defs>
      <ellipse cx="60" cy="80" rx="44" ry="60" fill={C.foxing} opacity="0.15"/>

      {sp.form==="bellbloom"&&<g filter={AG}>
        {/* arching stem with drooping bell-blossoms — a calm riverside flower */}
        <path d="M60 134 C58 108 54 86 60 58 C63 44 60 34 60 30" stroke={G} strokeWidth="2.2" fill="none"/>
        {[[44,52,-20],[74,60,18],[52,40,-10],[68,44,12]].map(([x,y,r],i)=>(
          <g key={i} transform={"rotate("+r+" "+x+" "+y+")"}>
            <path d={"M"+x+" "+(y-8)+" C"+(x-7)+" "+(y-2)+" "+(x-7)+" "+(y+8)+" "+x+" "+(y+11)+" C"+(x+7)+" "+(y+8)+" "+(x+7)+" "+(y-2)+" "+x+" "+(y-8)+" Z"} fill={F} opacity="0.92"/>
            <path d={"M"+x+" "+(y+11)+" l-3 4 M"+x+" "+(y+11)+" l3 4 M"+x+" "+(y+11)+" l0 5"} stroke={sp.flower} strokeWidth="1" opacity="0.8"/>
          </g>
        ))}
        <path d="M58 96 C46 92 40 98 36 106 C46 104 53 100 58 98 Z" fill={sp.green} opacity="0.85"/>
      </g>}

      {sp.form==="silverfern"&&<g filter={AG}>
        {/* a frond: central rachis with paired silver leaflets */}
        <path d="M60 138 C60 104 60 70 60 34" stroke={G} strokeWidth="1.8" fill="none"/>
        {Array.from({length:9}).map((_,i)=>{const y=40+i*11; const len=26-i*2.2;
          return <g key={i}>
            <path d={"M60 "+y+" Q"+(60-len*0.6)+" "+(y-2)+" "+(60-len)+" "+(y+6)} stroke={sp.flower} strokeWidth="2.4" fill="none" opacity="0.85" strokeLinecap="round"/>
            <path d={"M60 "+y+" Q"+(60+len*0.6)+" "+(y-2)+" "+(60+len)+" "+(y+6)} stroke={sp.green} strokeWidth="2.4" fill="none" opacity="0.8" strokeLinecap="round"/>
          </g>;})}
        <circle cx="60" cy="34" r="3" fill={sp.flower} opacity="0.7"/>
      </g>}

      {sp.form==="root"&&<g filter={AG}>
        {/* a knotted taproot with hairy tendrils and a few leaves up top */}
        <path d="M60 40 C56 56 66 64 60 82 C55 98 64 110 58 128 C57 134 60 138 60 138" stroke={G} strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M60 40 C56 56 66 64 60 82 C55 98 64 110 58 128" stroke={sp.flower} strokeWidth="2" fill="none" opacity="0.4"/>
        {[[60,70,-1],[60,96,1],[58,118,-1]].map(([x,y,d],i)=>(<g key={i}>
          <path d={"M"+x+" "+y+" q"+(d*-16)+" 4 "+(d*-22)+" 14"} stroke={sp.green} strokeWidth="1.4" fill="none" opacity="0.7"/>
          <path d={"M"+x+" "+y+" q"+(d*16)+" 5 "+(d*20)+" 16"} stroke={sp.green} strokeWidth="1.4" fill="none" opacity="0.7"/>
        </g>))}
        {[[-1],[1]].map(([d],i)=>(<path key={i} d={"M60 40 C"+(60+d*10)+" 30 "+(60+d*16)+" 26 "+(60+d*12)+" 18 C"+(60+d*6)+" 24 "+(60+d*2)+" 30 60 40 Z"} fill={sp.green} opacity="0.8"/>))}
      </g>}

      {sp.form==="lily"&&<g filter={AG}>
        {/* a true lily: six recurved petals + stamens */}
        <path d="M60 134 C59 108 60 88 60 74" stroke={G} strokeWidth="2.2" fill="none"/>
        {Array.from({length:6}).map((_,i)=>{const a=(i/6)*Math.PI*2 - Math.PI/2;
          const tx=60+Math.cos(a)*30, ty=66+Math.sin(a)*30;
          return <path key={i} d={"M60 66 Q"+(60+Math.cos(a)*10-Math.sin(a)*7)+" "+(66+Math.sin(a)*10+Math.cos(a)*7)+" "+tx+" "+ty+" Q"+(60+Math.cos(a)*10+Math.sin(a)*7)+" "+(66+Math.sin(a)*10-Math.cos(a)*7)+" 60 66 Z"} fill={F} opacity="0.9"/>;})}
        {Array.from({length:5}).map((_,i)=>{const a=(i/5)*Math.PI*2;return <line key={i} x1="60" y1="66" x2={60+Math.cos(a)*9} y2={66+Math.sin(a)*9} stroke={C.greenDk} strokeWidth="1" opacity="0.7"/>;})}
        <circle cx="60" cy="66" r="3.5" fill={sp.green}/>
        <path d="M59 92 C48 90 42 96 39 104 C49 102 55 98 59 95 Z" fill={sp.green} opacity="0.8"/>
      </g>}

      {sp.form==="bramble"&&<g filter={AG}>
        {/* a thorned blood-bramble with sharp barbs and red sap beads */}
        <path d="M60 136 C54 112 66 92 56 70 C52 60 58 50 58 42" stroke={G} strokeWidth="2.8" fill="none"/>
        {[126,112,98,84,70,56].map((y,i)=>{const d=i%2?1:-1; return <path key={i} d={"M60 "+y+" l"+(d*15)+" -7 l"+(d*-4)+" 5"} stroke={C.greenDk} strokeWidth="1.6" fill="none" strokeLinecap="round"/>;})}
        <circle cx="58" cy="42" r="8.5" fill={F} opacity="0.92"/>
        <circle cx="58" cy="42" r="8.5" fill="none" stroke={C.sanguine} strokeWidth="0.6"/>
        {[[64,60],[52,76],[68,90]].map(([x,y],i)=>(<g key={i}><ellipse cx={x} cy={y} rx="2.6" ry="4" fill={C.sanguine} opacity="0.5"/><circle cx={x} cy={y-3} r="1.2" fill={C.sanguine} opacity="0.6"/></g>))}
      </g>}

      {sp.form==="lotus"&&<g filter={AG}>
        {/* a dark, luminous many-petaled lotus — the rare one */}
        <ellipse cx="60" cy="70" rx="30" ry="22" fill={sp.green} opacity="0.18"/>
        {Array.from({length:10}).map((_,i)=>{const a=(i/10)*Math.PI*2;return <path key={i} d={"M60 70 Q"+(60+Math.cos(a)*9)+" "+(70+Math.sin(a)*9)+" "+(60+Math.cos(a)*30)+" "+(70+Math.sin(a)*30)+" Q"+(60+Math.cos(a+0.18)*9)+" "+(70+Math.sin(a+0.18)*9)+" 60 70 Z"} fill={F} opacity="0.78"/>;})}
        {Array.from({length:6}).map((_,i)=>{const a=(i/6)*Math.PI*2+0.3;return <path key={i} d={"M60 70 Q"+(60+Math.cos(a)*7)+" "+(70+Math.sin(a)*7)+" "+(60+Math.cos(a)*18)+" "+(70+Math.sin(a)*18)+" Q"+(60+Math.cos(a+0.25)*7)+" "+(70+Math.sin(a+0.25)*7)+" 60 70 Z"} fill={sp.flower} opacity="0.6"/>;})}
        <circle cx="60" cy="70" r="7" fill={sp.flower}/><circle cx="60" cy="70" r="7" fill="none" stroke={C.greenDk} strokeWidth="0.6"/>
        <circle cx="60" cy="70" r="11" fill="none" stroke={sp.flower} strokeWidth="0.6" opacity="0.4"/>
        <path d="M60 98 C58 112 60 126 60 136" stroke={G} strokeWidth="2.2" fill="none"/>
      </g>}
    </svg>
  );
}

// a small glass vessel for crafted goods (kept simple, journal-toned)
function Vial({ kind="potion", color=C.green, size=30 }){
  return <svg viewBox="0 0 40 50" width={size} height={size*1.25} aria-hidden="true">
    {kind==="flask"&&<><path d="M16 6 h8 v10 l6 18 a6 6 0 0 1-6 8 h-8 a6 6 0 0 1-6-8 l6-18 z" fill={color} opacity="0.3" stroke={C.ink} strokeWidth="1.2"/><rect x="15" y="3" width="10" height="4" fill={C.ink}/></>}
    {kind==="vial"&&<><rect x="14" y="6" width="12" height="32" rx="5" fill={color} opacity="0.3" stroke={C.ink} strokeWidth="1.2"/><rect x="15" y="3" width="10" height="4" fill={C.ink}/></>}
    {kind==="potion"&&<><path d="M14 14 h12 v4 l4 16 a8 8 0 0 1-20 0 l4-16 z" fill={color} opacity="0.32" stroke={C.ink} strokeWidth="1.2"/><rect x="16" y="8" width="8" height="6" fill="none" stroke={C.ink} strokeWidth="1.2"/></>}
    {kind==="cauldron"&&<><path d="M8 20 a12 12 0 0 0 24 0 z" fill={color} opacity="0.3" stroke={C.ink} strokeWidth="1.2"/><ellipse cx="20" cy="20" rx="12" ry="3.5" fill="none" stroke={C.ink} strokeWidth="1.2"/></>}
  </svg>;
}

function Tape({ w=52, rot=0, style }){
  return <div style={{position:"absolute", width:w, height:17, background:C.tape, transform:"rotate("+rot+"deg)", boxShadow:"0 1px 2px rgba(60,46,31,0.12)", borderLeft:"1px solid rgba(255,255,255,0.25)", ...style}} aria-hidden="true"/>;
}
function PaperGrain({ side="left" }){
  // NO blend modes — mobile Safari drops them inside transformed 3D containers.
  // Everything here is plain opacity over the base, so it always paints.
  const gx = side==="left" ? "78%" : "22%";  // clean-ish center sits away from spine
  return <div style={{position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden"}} aria-hidden="true">
    {/* visible tonal swing: bright near center, browned & dingy toward edges */}
    <div style={{position:"absolute", inset:0, background:
      "radial-gradient(115% 125% at "+gx+" 42%, #f2e9d0 0%, #e7d9bb 38%, #d8c49a 72%, #c4ab7c 90%, #b09865 100%)"}}/>
    {/* blotchy aging — solid blurred patches, opacity you can actually see */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}}>
      <defs><filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <g filter="url(#bl)">
        <ellipse cx="20%" cy="16%" rx="60" ry="44" fill="#b89a68" opacity="0.30"/>
        <ellipse cx="83%" cy="30%" rx="50" ry="60" fill="#a98a5c" opacity="0.26"/>
        <ellipse cx="68%" cy="72%" rx="80" ry="56" fill="#bda06e" opacity="0.28"/>
        <ellipse cx="32%" cy="84%" rx="64" ry="40" fill="#a8895a" opacity="0.24"/>
        <ellipse cx="50%" cy="48%" rx="46" ry="40" fill="#cbb585" opacity="0.18"/>
        <ellipse cx="12%" cy="58%" rx="40" ry="60" fill="#b0915f" opacity="0.22"/>
      </g>
    </svg>
    {/* a couple of real, visible stains — a tea ring and a dark spot */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}}>
      <defs><filter id="sb"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
      <circle cx="72%" cy="26%" r="30" fill="none" stroke="#9c7c4e" strokeWidth="3.5" opacity="0.30" filter="url(#sb)"/>
      <circle cx="72%" cy="26%" r="30" fill="#b89a68" opacity="0.08"/>
      <ellipse cx="28%" cy="40%" rx="7" ry="9" fill="#7a5f3a" opacity="0.22" filter="url(#sb)"/>
      <ellipse cx="60%" cy="62%" rx="4" ry="5" fill="#6e5436" opacity="0.20" filter="url(#sb)"/>
    </svg>
    {/* fiber speckle — fine, but at real opacity so it's not invisible */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.6}}>
      <filter id="fib"><feTurbulence type="fractalNoise" baseFrequency="0.45 0.6" numOctaves="2" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 0.38 0 0 0 0 0.30 0 0 0 0 0.18 0 0 0 0.16 0"/></filter>
      <rect width="100%" height="100%" filter="url(#fib)"/>
    </svg>
    {/* dark, irregular edge — the page is grubbier at its borders & spine */}
    <div style={{position:"absolute", inset:0, boxShadow:"inset 0 0 28px rgba(74,54,30,0.38), inset 0 0 70px rgba(90,68,40,0.18)"}}/>
    {/* the gutter side is dirtiest */}
    <div style={{position:"absolute", top:0, bottom:0, [side==="left"?"left":"right"]:0, width:"30%",
      background:"linear-gradient("+(side==="left"?"90deg":"270deg")+", rgba(74,54,30,0.34), rgba(74,54,30,0.10) 50%, transparent)"}}/>
  </div>;
}
function GhostWriting(){
  return <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.07, pointerEvents:"none"}} aria-hidden="true">
    {Array.from({length:11}).map((_,i)=>(<line key={i} x1="14%" x2={62+(i%4)*7+"%"} y1={22+i*6+"%"} y2={22+i*6+"%"} stroke="#5a4530" strokeWidth="1.4"/>))}
  </svg>;
}
function Hand({ children, color=C.greenDk, size=14, tilt=-0.5, style }){
  return <div style={{fontFamily:HAND, fontSize:size, color, transform:"rotate("+tilt+"deg)", lineHeight:1.4, ...style}}>{children}</div>;
}
function Eyebrow({ children }){
  return <div style={{fontFamily:DISPLAY, fontSize:11, letterSpacing:3, textTransform:"uppercase", color:C.inkFaint}}>{children}</div>;
}
function Title({ children, size=25 }){
  return <h2 style={{fontFamily:DISPLAY, fontSize:size, fontWeight:400, margin:"8px 0 10px", color:C.ink, fontStyle:"italic"}}>{children}</h2>;
}
function Coin({ value, loading, size=15 }){
  if(loading) return <span style={{fontStyle:"italic", color:C.inkFaint}}>…</span>;
  if(value==null) return <span style={{fontStyle:"italic", color:C.inkFaint, fontSize:size-3}}>not sold</span>;
  return <span style={{fontFamily:DISPLAY, fontSize:size, color:C.sanguine}}>{fmtG(value)}<span style={{fontSize:size-4, fontStyle:"italic"}}> g</span></span>;
}
function Tag({ children, color=C.ink, small }){
  return <span style={{display:"inline-block", fontFamily:DISPLAY, fontSize:small?10.5:12, fontStyle:"italic", color, border:"1px solid "+color, borderRadius:2, padding:small?"1px 6px":"2px 8px", opacity:0.92}}>{children}</span>;
}
const pad = { padding:"30px 32px 26px", height:"100%", boxSizing:"border-box", display:"flex", flexDirection:"column" };

/* ── OVERVIEW — the page you land on, a night's plan at a glance ── */
function Overview({ price, loading, live, go, meta }){
  const herbs = rankHerbs(price).slice(0,10);
  const craft = rankCraft(price).slice(0,10);
  return <div style={pad}>
    <Hand size={15} color={C.green} tilt={-1} style={{marginBottom:2}}>before i set out tonight —</Hand>
    <h1 style={{fontFamily:DISPLAY, fontSize:"clamp(24px,4vw,32px)", fontWeight:400, margin:"2px 0 4px", color:C.ink, lineHeight:1.05}}>The night's plan</h1>
    <div style={{fontFamily:DISPLAY, fontSize:12.5, fontStyle:"italic", color:C.inkFaint, marginBottom:16}}>what's selling best, and what's worth the making</div>

    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
      <Eyebrow>gather these first · top 10 by coin</Eyebrow>
    </div>
    <div style={{margin:"7px 0 16px"}}>
      {herbs.map((r,i)=>(
        <div key={r.id} onClick={()=>go("worth")} style={{display:"flex", gap:11, alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
          <span style={{fontFamily:DISPLAY, fontSize:16, fontStyle:"italic", color:i===0?C.sanguine:C.rule, minWidth:18}}>{i+1}</span>
          <Pressed id={r.id} size={26}/>
          <span style={{flex:1, fontFamily:DISPLAY, fontSize:14.5, color:C.ink}}>{r.item.name}</span>
          <Coin value={r.price} loading={loading} size={14}/>
        </div>
      ))}
    </div>

    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
      <Eyebrow>worth the making · top 10</Eyebrow>
      <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:C.inkFaint}}>what they sell for</span>
    </div>
    <div style={{margin:"7px 0 14px"}}>
      {craft.map((r,i)=>(
        <div key={r.id} onClick={()=>go("worth")} style={{display:"flex", gap:11, alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
          <span style={{fontFamily:DISPLAY, fontSize:16, fontStyle:"italic", color:i===0?C.sanguine:C.rule, minWidth:18}}>{i+1}</span>
          <Vial kind={r.item.kind} color={C.ochre} size={24}/>
          <span style={{flex:1, fontFamily:DISPLAY, fontSize:14.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{r.item.name}</span>
          <div style={{display:"flex", gap:12, alignItems:"center", flexShrink:0}}>
            <span style={{display:"inline-flex", alignItems:"center", gap:4, fontFamily:DISPLAY, fontSize:14}}><QGold size={12}/> <span style={{color:C.ochreDeep}}>{loading?"…":(r.saleGold==null?<span style={{fontSize:10, fontStyle:"italic", color:C.inkFaint}}>—</span>:fmtG(r.saleGold)+"g")}</span></span>
            <span style={{display:"inline-flex", alignItems:"center", gap:4, fontFamily:DISPLAY, fontSize:14}}><QSilver size={11}/> <span style={{color:C.ink2}}>{loading?"…":(r.saleSilver==null?"—":fmtG(r.saleSilver)+"g")}</span></span>
          </div>
        </div>
      ))}
    </div>

    <div style={{marginTop:"auto", display:"flex", gap:14, alignItems:"flex-start", paddingTop:10}}>
      <span style={{flexShrink:0}}><PriceStamp live={live} meta={meta}/></span>
      <Hand size={13} color={C.greenDk} tilt={-0.4} style={{flex:1}}>
        {live ? "the goblin market feeds these now. since i gather my own herbs, the gathered coin is what i truly keep." : "i set these by hand until the goblin market speaks."}
      </Hand>
    </div>
  </div>;
}
function OverviewRight({ go }){
  // a second leaf: this week's knowing + a couple reminders, in her voice
  return <div style={pad}>
    <Eyebrow>this week's knowing</Eyebrow>
    <Title size={21}>What the soil still owes</Title>
    <div style={{display:"flex", gap:20, marginBottom:14}}>
      <div><div style={{fontFamily:DISPLAY, fontSize:30, color:C.verdigris}}>{KP_HERB.weekOne}</div><div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>herb · first week</div></div>
      <div><div style={{fontFamily:DISPLAY, fontSize:30, color:C.ochreDeep}}>{KP_ALCH.weekOne}</div><div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>alchemy · first week</div></div>
    </div>
    <p style={{fontFamily:BODY, fontSize:13, lineHeight:1.7, color:C.inkSoft, margin:"0 0 14px"}}>
      The soil is generous at the start and stingy after. I claim every treasure and every first-gather while the pages are still mine alone, then settle into the dozen-a-week trickle.
    </p>
    <div onClick={()=>go("knowing")} style={{cursor:"pointer", fontFamily:DISPLAY, fontSize:13, color:C.sanguine, fontStyle:"italic", borderTop:"1px solid "+C.rule, paddingTop:10}}>
      the full reckoning, and where the treasures lie ›
    </div>
    <Hand size={14} color={C.greenDk} tilt={-0.6} style={{marginTop:16}}>
      remember: the eight treasures don't come twice. the dive with the ashes can wait — knowledge cannot.
    </Hand>
    <div style={{marginTop:"auto", position:"relative", paddingTop:20}}>
      <Tape w={40} rot={-18} style={{top:18, left:10}}/>
      <Pressed id={236780} size={70}/>
    </div>
  </div>;
}

/* ── SPECIMENS → a clickable herb-price gallery (drawings made functional) ── */
function SpecLeft({ price, loading, go }){
  // richest herb by live (or est) price, computed not hardcoded
  const richest=[...HERBS].map(h=>({id:h.id, p: price?(price(h.id)??h.est??0):(h.est??0)})).sort((a,b)=>b.p-a.p)[0];
  return <div style={pad}>
    <Eyebrow>the herb gallery</Eyebrow>
    <Title size={26}>What the soil gives up</Title>
    <p style={{fontFamily:BODY, fontSize:13.5, lineHeight:1.75, color:C.inkSoft, margin:"0 0 14px"}}>
      Every leaf here i pressed and drew myself, by lamplight. Beside each i keep its going rate, so a tired night never tempts me to sell the rare ones cheap. Tap any leaf to weigh it against the rest on the gathering page.
    </p>
    <div style={{fontFamily:DISPLAY, fontSize:11, letterSpacing:1, textTransform:"uppercase", color:C.inkFaint, marginBottom:8}}>tonight's richest leaf</div>
    <SpecMount id={richest.id} price={price} loading={loading} go={go} feature/>
    <Hand size={14.5} style={{marginTop:16}}>the rare one pays for the whole night. know it on sight.</Hand>
  </div>;
}
function SpecRight({ price, loading, go }){
  // richest first, and DROP the one featured on the left page (no repeat)
  const sorted=[...HERBS].map(h=>({id:h.id, p: price?(price(h.id)??h.est??0):(h.est??0)})).sort((a,b)=>b.p-a.p);
  const featured=sorted[0]?.id;
  const order=sorted.slice(1).map(x=>x.id); // skip the featured leaf
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
      <Eyebrow>the rest of the pressing</Eyebrow><Hand size={13} color={C.green} tilt={0}>richest first</Hand>
    </div>
    <div style={{overflowY:"auto", flex:1}}>{order.map(id=><SpecMount key={id} id={id} price={price} loading={loading} go={go}/>)}</div>
  </div>;
}
const HERB_HAND = {
  236761:"plentiful by the rivers. keeps its colour best of any.",
  236776:"never let it brown, or the flask-work spoils.",
  236774:"a workaday root. always wanted, never dear.",
  236778:"the scribes want it too — two markets for one stoop.",
  236770:"it drew blood again. the red sap stains the page.",
  236780:"one in a whole season. never, ever sell it cheap.",
};
function SpecMount({ id, mini, feature, price, loading, go }){
  const h=HERB(id);
  const pa = price ? (price(h.id) ?? null) : null;
  const pb = (price && h.gid) ? (price(h.gid) ?? null) : null;
  const both=[pa,pb].filter(v=>v!=null);
  const gold = both.length?Math.max(...both):(h.est??null);
  const silver = both.length>1?Math.min(...both):(both.length?both[0]:(h.est??null));
  const sz = feature?86:80;
  return <div onClick={()=>go&&go("worth")} style={{position:"relative", padding:"6px 4px 12px", marginBottom:feature?0:2, cursor:go?"pointer":"default", borderBottom:feature?"none":"1px solid "+C.ruleSoft}}>
    <Tape w={48} rot={-7} style={{top:-5, left:14}}/>{!feature&&<Tape w={48} rot={6} style={{top:-5, right:14}}/>}
    <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
      <div style={{flexShrink:0}}><Pressed id={id} size={sz}/></div>
      <div style={{flex:1, paddingTop:4}}>
        <h3 style={{fontFamily:DISPLAY, fontSize:17, fontWeight:400, margin:0, color:C.ink, fontStyle:"italic"}}>{h.name}</h3>
        <div style={{fontFamily:DISPLAY, fontSize:11.5, fontStyle:"italic", color:C.inkFaint, marginBottom:5}}>{h.latin} · № {h.no}</div>
        {/* gold first, then silver */}
        <div style={{display:"flex", gap:14, alignItems:"center"}}>
          <span style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:DISPLAY}}><QGold/> <span style={{color:C.ochreDeep, fontSize:15}}>{loading?"…":(gold==null?<span style={{fontSize:11, fontStyle:"italic", color:C.inkFaint}}>—</span>:fmtG(gold)+"g")}</span></span>
          <span style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:DISPLAY}}><QSilver/> <span style={{color:C.ink2, fontSize:15}}>{loading?"…":(silver==null?<span style={{fontSize:11, fontStyle:"italic", color:C.inkFaint}}>not listed</span>:fmtG(silver)+"g")}</span></span>
        </div>
        <Hand size={13} style={{marginTop:5}}>{HERB_HAND[id]}</Hand>
      </div>
    </div>
  </div>;
}

/* ── WORTH (Field Notes · live ranking · numbers stay plain) ── */
function fmtAgo(ts){
  if(!ts) return "";
  const m=Math.round((Date.now()-ts)/60000);
  if(m<1) return "just now"; if(m<60) return m+"m ago";
  const h=Math.round(m/60); return h<24?h+"h ago":Math.round(h/24)+"d ago";
}
function PriceStamp({ live, meta }){
  if(!live) return <span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint}}>by my reckoning</span>;
  return <span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.verdigris, textAlign:"right", lineHeight:1.3}}>
    ● live · {meta&&meta.realm?meta.realm:"realm"}{meta&&meta.updated?<span style={{color:C.inkFaint}}><br/>updated {fmtAgo(meta.updated)}</span>:null}
  </span>;
}
function Worth({ price, loading, live, meta }){
  const [side,setSide]=useState("herb");
  const ranked = side==="herb"?rankHerbs(price):rankCraft(price);
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
      <Eyebrow>{side==="herb"?"what to gather · by coin":"what to make · by margin"}</Eyebrow>
      <PriceStamp live={live} meta={meta}/>
    </div>
    <div style={{display:"flex", gap:6, marginBottom:12}}>
      {[["herb","the gathering"],["alch","the making"]].map(([k,l])=>(
        <button key={k} onClick={()=>setSide(k)} style={{background:side===k?C.ink:"transparent", color:side===k?C.paper:C.inkSoft, border:"1px solid "+(side===k?C.ink:C.rule), padding:"4px 11px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12}}>{l}</button>
      ))}
    </div>
    <div style={{overflowY:"auto"}}>
      {ranked.map(r=>(
        <div key={r.id} style={{display:"flex", gap:12, alignItems:"center", padding:"10px 0", borderBottom:"1px solid "+C.ruleSoft}}>
          <span style={{fontFamily:DISPLAY, fontSize:22, fontStyle:"italic", color:r.rank===1?C.sanguine:C.rule, minWidth:22, textAlign:"right"}}>{r.rank}</span>
          <div style={{flexShrink:0}}>{side==="herb"?<Pressed id={r.id} size={36}/>:<Vial kind={r.item.kind} color={C.ochre} size={30}/>}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:DISPLAY, fontSize:15.5, color:C.ink}}>{r.item.name}</div>
            {side==="herb"
              ? <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.inkFaint, display:"flex", gap:14, alignItems:"center"}}>
                  <span><QGold/> {r.saleGold==null?<span style={{fontStyle:"italic", fontSize:11}}>not listed</span>:<span style={{color:C.ochreDeep, fontSize:15}}>{fmtG(r.saleGold)}g</span>}</span>
                  <span><QSilver/> <span style={{color:C.ink2, fontSize:15}}>{r.saleSilver==null?"—":fmtG(r.saleSilver)+"g"}</span></span>
                </div>
              : <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.inkFaint, display:"flex", gap:14, alignItems:"center"}}>
                  <span><QGold/> {r.saleGold==null?<span style={{fontStyle:"italic", fontSize:11}}>not listed</span>:<span style={{color:C.ochreDeep, fontSize:15}}>{fmtG(r.saleGold)}g</span>}</span>
                  <span><QSilver/> <span style={{color:C.ink2, fontSize:15}}>{r.saleSilver==null?"—":fmtG(r.saleSilver)+"g"}</span></span>
                </div>}
          </div>
        </div>
      ))}
    </div>
    <Hand size={12.5} color={C.greenDk} tilt={-0.4} style={{marginTop:10}}>
      {side==="herb" ? "set by sale, the busiest first when two pay the same." : "set by what's left after the herbs are paid for — the true coin, not the loud one."}
    </Hand>
  </div>;
}

/* ── KNOWING (Knowledge + waypoints · reading voice, copyable tools) ── */
function Knowing({ }){
  const [prof,setProf]=useState("herb");
  const [done,setDone]=useState({});
  const [openWays,setOpenWays]=useState(null);
  const [copied,setCopied]=useState(null);
  const copy=(t,id)=>{try{navigator.clipboard&&navigator.clipboard.writeText(t);}catch(e){} setCopied(id); setTimeout(()=>setCopied(null),1300);};
  const d=prof==="herb"?KP_HERB:KP_ALCH;
  const accent=prof==="herb"?C.verdigris:C.ochreDeep;
  const k=(s,n)=>prof+"-"+s+"-"+n;
  return <div style={pad}>
    <div style={{display:"flex", gap:6, marginBottom:10}}>
      {[["herb","herbalism"],["alch","alchemy"]].map(([key,l])=>(
        <button key={key} onClick={()=>setProf(key)} style={{background:prof===key?C.ink:"transparent", color:prof===key?C.paper:C.inkSoft, border:"1px solid "+(prof===key?C.ink:C.rule), padding:"4px 11px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12}}>{l}</button>
      ))}
    </div>
    <Eyebrow>what i've come to know</Eyebrow>
    <div style={{display:"flex", gap:18, margin:"6px 0 12px"}}>
      <div><span style={{fontFamily:DISPLAY, fontSize:26, color:accent}}>{d.weekOne}</span> <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>first week</span></div>
      <div><span style={{fontFamily:DISPLAY, fontSize:26, color:C.inkSoft}}>{d.weekly}</span> <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>each after</span></div>
    </div>
    <div style={{overflowY:"auto"}}>
      {[["gathered but once",d.oneTime,"one"],["each reset",d.weeklySources,"wk"],["once a month",d.monthly,"mo"]].map(([title,items,sk])=>(
        <div key={sk} style={{marginBottom:14}}>
          <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.ink, borderBottom:"1px solid "+C.rule, paddingBottom:3, marginBottom:4}}>{title}</div>
          {items.map((it,n)=>{const on=done[k(sk,n)]; const wk=sk+"-"+n; const tl=it.ways?WAYPOINTS[it.ways]:null;
            return <div key={n} style={{borderBottom:"1px solid "+C.ruleSoft}}>
              <div style={{display:"flex", gap:9, padding:"7px 0", alignItems:"center"}}>
                <span onClick={()=>setDone(p=>({...p,[k(sk,n)]:!on}))} style={{cursor:"pointer", flexShrink:0}}><Vial kind="vial" color={on?accent:C.inkFaint} size={20}/></span>
                <div style={{flex:1, cursor:"pointer"}} onClick={()=>setDone(p=>({...p,[k(sk,n)]:!on}))}>
                  <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
                    <span style={{fontFamily:DISPLAY, fontSize:14, color:C.ink, textDecoration:on?"line-through":"none", opacity:on?.5:1}}>{it.name}</span>
                    <span style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:accent}}>+{it.kp}</span>
                  </div>
                  <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, opacity:on?.5:1}}>{it.detail}</div>
                </div>
                {it.way&&<button onClick={()=>copy(it.way,wk)} style={wayChip(copied===wk,accent)}>{copied===wk?"copied":"way"}</button>}
                {tl&&<button onClick={()=>setOpenWays(openWays===wk?null:wk)} style={wayChip(openWays===wk,accent)}>8 ways {openWays===wk?"−":"+"}</button>}
              </div>
              {tl&&openWays===wk&&<div style={{padding:"2px 2px 10px 30px"}}>
                <button onClick={()=>copy(tl.map(x=>x.w).join("\n"),"all-"+wk)} style={{...wayChip(copied==="all-"+wk,accent), marginBottom:6}}>{copied==="all-"+wk?"copied all":"copy all 8"}</button>
                {tl.map((t,ti)=>(<div key={ti} onClick={()=>copy(t.w,wk+"-"+ti)} style={{display:"flex", gap:8, padding:"5px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
                  <code style={{fontFamily:"monospace", fontSize:10, color:C.ink, background:C.paperDeep, padding:"1px 5px", borderRadius:2, flexShrink:0}}>{t.w.replace(/^\/way /,"")}</code>
                  <span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkSoft, flex:1}}>{t.note}</span>
                </div>))}
              </div>}
            </div>;
          })}
        </div>
      ))}
    </div>
    <Hand size={13} color={accent} tilt={-0.4} style={{marginTop:8}}>tap a "way" to copy its mark — the eight treasures don't come twice.</Hand>
  </div>;
}
function wayChip(on,accent){
  return {flexShrink:0, background:on?accent:C.paperDeep, color:on?C.paper:C.inkSoft, border:"1px solid "+(on?accent:C.rule), padding:"3px 8px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:10};
}

/* ── FORMULARY (tool · plainer · full encyclopedia + prices) ── */
function FormularyPage({ price, loading }){
  const [cat,setCat]=useState("All");
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(null);
  const ql=q.trim().toLowerCase();
  const shown=BOOK.filter(r=>(cat==="All"||r.cat===cat)&&(!ql||r.name.toLowerCase().includes(ql)||r.effect.toLowerCase().includes(ql)));
  return <div style={pad}>
    <Eyebrow>the formulary · every receipt</Eyebrow>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="search by name or effect…" style={{width:"100%", boxSizing:"border-box", background:C.card, border:"1px solid "+C.rule, color:C.ink, fontFamily:BODY, fontSize:13.5, padding:"8px 11px", margin:"8px 0 10px"}}/>
    <div style={{display:"flex", gap:4, flexWrap:"wrap", marginBottom:12}}>
      {BOOK_CATS.map(t=><button key={t} onClick={()=>setCat(t)} style={{background:cat===t?C.ink:"transparent", color:cat===t?C.paper:C.inkSoft, border:"1px solid "+(cat===t?C.ink:C.rule), padding:"3px 9px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:10.5}}>{t}</button>)}
    </div>
    <div style={{overflowY:"auto"}}>
      {shown.map((r,i)=>{const isOpen=open===r.name; const hasM=r.mats&&r.mats.length>0;
        return <div key={i} style={{borderBottom:"1px solid "+C.ruleSoft}}>
          <div onClick={()=>setOpen(isOpen?null:r.name)} style={{display:"flex", gap:12, padding:"11px 0", cursor:"pointer", alignItems:"flex-start"}}>
            <div style={{flexShrink:0}}><Vial kind={r.kind} color={r.bound?C.plum:C.ochre} size={28}/></div>
            <div style={{flex:1}}>
              <div style={{display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap", alignItems:"center"}}>
                <h3 style={{fontFamily:DISPLAY, fontSize:16, fontWeight:400, margin:0, color:C.ink}}>{r.name}</h3>
                <div style={{display:"flex", gap:5, alignItems:"center"}}>{(()=>{const pr=PRODUCTS.find(p=>p.name===r.name); return pr?<VBadge verified={pr.v===true}/>:null;})()}{r.bound&&<Tag small color={C.plum}>bound</Tag>}{r.mc&&<Tag small color={C.verdigris}>multicrafts</Tag>}</div>
              </div>
              <div style={{fontFamily:BODY, fontSize:12.5, color:C.inkSoft, marginTop:2, lineHeight:1.5}}>{r.effect}</div>
              {(()=>{const pr=PRODUCTS.find(p=>p.name===r.name); const mats=(pr&&pr.mats)||r.mats; if(!mats||!mats.length)return null;
                return <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:7}}>{mats.map((m,j)=>{const id=m.h??m.r; const mat=MAT(id); if(!mat)return null; const isHerb=!!m.h;
                  return <span key={j} style={{display:"inline-flex", alignItems:"center", gap:4, background:C.paperDeep, border:"1px solid "+C.ruleSoft, padding:"2px 7px 2px 4px", borderRadius:3}}>
                    {isHerb?<Pressed id={id} size={16}/>:<span style={{width:8,height:8,borderRadius:"50%",background:mat.color||C.ochre,display:"inline-block"}}/>}
                    <span style={{fontFamily:DISPLAY, fontSize:11, color:C.ink}}>{m.q}× {mat.short||mat.name.split(" ")[0]}</span>
                    <span style={{fontFamily:DISPLAY, fontSize:10, color:C.ochreDeep}}>· {loading?"…":fmtG((price(id)??mat.est??0)*m.q)}g</span>
                  </span>;})}</div>;})()}
              {isOpen&&<div style={{marginTop:9, paddingTop:9, borderTop:"1px dashed "+C.rule, display:"flex", flexDirection:"column", gap:6}}>
                <div style={{fontSize:12, color:C.ink}}><i style={{color:C.inkFaint}}>tree</i> &nbsp;{r.tree}</div>
                <div style={{fontSize:12, color:C.ink}}><i style={{color:C.inkFaint}}>unlock</i> &nbsp;{r.unlock}</div>
                {r.craftNote&&<div style={{fontSize:11.5, color:C.inkFaint, fontStyle:"italic"}}><i>note</i> &nbsp;{r.craftNote}</div>}
              </div>}
            </div>
            <span style={{color:C.inkFaint, fontSize:13}}>{isOpen?"−":"+"}</span>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

/* ── THE SCALE (tool · margin calculator) ── */
function ScalePage({ price, loading }){
  const sellable=PRODUCTS.filter(p=>p.tradeable);
  const [pid,setPid]=useState(sellable[0]?.id);
  const [n,setN]=useState(20);
  const prod=PRODUCTS.find(p=>p.id===pid) || sellable[0];
  const pa=price(prod.id)??null, pb=prod.gid?(price(prod.gid)??null):null;
  const sale = (pa!=null||pb!=null) ? Math.max(pa??0,pb??0) : (prod.est??0);
  const herbCost = matCost((prod.mats||[]).filter(m=>m.h), price);
  const reagentCost = matCost((prod.mats||[]).filter(m=>m.r), price); // vials + motes, always paid
  const gathered = sale - reagentCost;     // herbs free, but vials/motes still cost
  const bought = sale - herbCost - reagentCost;
  const verified = prod.v===true;
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
      <Eyebrow>the scale · weigh a craft</Eyebrow>
      <VBadge verified={verified}/>
    </div>
    <Title size={22}>What it leaves in hand</Title>
    <div style={{display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap", marginBottom:14}}>
      <div><div style={{fontFamily:DISPLAY, fontSize:10.5, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>the craft</div>
        <select value={pid} onChange={e=>setPid(Number(e.target.value))} style={{background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:15, padding:"3px 0"}}>{sellable.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div><div style={{fontFamily:DISPLAY, fontSize:10.5, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>how many</div>
        <input type="number" min="1" value={n} onChange={e=>setN(Math.max(1,parseInt(e.target.value)||1))} style={{width:70, background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:18, padding:"2px 0"}}/>
      </div>
    </div>
    {/* the recipe, spelled out */}
    <div style={{display:"flex", gap:7, flexWrap:"wrap", marginBottom:12}}>
      {(prod.mats||[]).map((m,j)=>{const id=m.h??m.r; const mat=MAT(id); if(!mat)return null; const isHerb=!!m.h;
        return <span key={j} style={{display:"inline-flex", alignItems:"center", gap:5, background:C.paperDeep, border:"1px solid "+C.ruleSoft, padding:"3px 8px", borderRadius:3}}>
          {isHerb?<Pressed id={id} size={15}/>:<span style={{width:8,height:8,borderRadius:"50%",background:mat.color||C.ochre,display:"inline-block"}}/>}
          <span style={{fontFamily:DISPLAY, fontSize:11.5, color:C.ink}}>{m.q}× {mat.short || mat.name.split(" ")[0]}</span>
          <span style={{fontFamily:DISPLAY, fontSize:10.5, color:C.ochreDeep}}>{loading?"…":fmtG((price(id)??mat.est??0)*m.q)}g</span>
        </span>;})}
    </div>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:8}}>
      {[["sells for",sale,C.sanguine],["vials/motes",reagentCost,C.inkSoft],["herbs",herbCost,C.inkSoft],["you keep",gathered,gathered>0?C.ochreDeep:C.sanguine]].map(([l,v,col],i)=>(
        <div key={i} style={{textAlign:"center", padding:"11px 3px", background:C.card, border:"1px solid "+C.ruleSoft}}>
          <div style={{fontFamily:DISPLAY, fontSize:17, color:col}}>{loading?"…":fmtG(v)}<span style={{fontSize:10, fontStyle:"italic"}}> g</span></div>
          <div style={{fontFamily:DISPLAY, fontSize:9, textTransform:"uppercase", letterSpacing:.3, color:C.inkFaint, marginTop:2}}>{l}</div>
        </div>
      ))}
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, marginBottom:14, textAlign:"center"}}>
      you gather the herbs free, but vials and motes are still bought, so "you keep" is the sell price minus those. buying every herb too, you'd keep {fmtG(bought)}g.
    </div>
    <div style={{textAlign:"center", padding:"14px", background:C.paperDeep, border:"1px solid "+C.rule}}>
      <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkSoft}}>{n} of these, gathered, leaves you</div>
      <div style={{fontFamily:DISPLAY, fontSize:30, color:gathered*n>0?C.ochreDeep:C.sanguine}}>{loading?"…":fmtG(gathered*n)}<span style={{fontSize:15, fontStyle:"italic"}}> g</span></div>
    </div>
    <Hand size={13} color={C.greenDk} tilt={-0.4} style={{marginTop:14}}>before multicraft's luck, every proc on top is found coin.</Hand>
  </div>;
}
// verified / estimated badge
function VBadge({ verified }){
  return <span style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:DISPLAY, fontSize:10, letterSpacing:.5, textTransform:"uppercase",
    color: verified?C.verdigris:C.inkFaint, border:"1px solid "+(verified?C.verdigris:C.rule), borderRadius:10, padding:"1px 8px", opacity:0.95}}>
    <span style={{width:6, height:6, borderRadius:"50%", background:verified?C.verdigris:"transparent", border:"1px solid "+(verified?C.verdigris:C.inkFaint)}}/>
    {verified?"verified recipe":"estimated recipe"}
  </span>;
}

/* ── MULTICRAFT BENCH (tool · plainer) ── */
function BenchPage({ price, loading }){
  const sellable=PRODUCTS.filter(p=>p.tradeable);
  const [pct,setPct]=useState(15);
  const [bonus,setBonus]=useState(0);
  const [pid,setPid]=useState(sellable[0]?.id);
  const [base,setBase]=useState(1);
  const prod=PRODUCTS.find(p=>p.id===pid) || sellable[0];
  const unit=price(prod.id)??prod.est??0;
  const procMult=1.5+Number(bonus);
  const p=Math.max(0,pct)/100;
  const eff=base*(1+p*(procMult-1));
  const extra=eff-base;
  return <div style={pad}>
    <Eyebrow>the bench · multicraft's luck</Eyebrow>
    <Title size={22}>The found coin</Title>
    <p style={{fontFamily:BODY, fontSize:12.5, color:C.inkSoft, lineHeight:1.6, margin:"0 0 12px"}}>
      Read your Multicraft straight off the professions panel (press <b>P</b>) — it shows as a percent already. Set it here to see the extra each craft drops for free.
    </p>
    <div style={{display:"flex", gap:14, flexWrap:"wrap", marginBottom:14, alignItems:"flex-end"}}>
      <Field label="multicraft %"><input type="number" min="0" value={pct} onChange={e=>setPct(Math.max(0,parseFloat(e.target.value)||0))} style={numIn}/></Field>
      <Field label="craft makes"><input type="number" min="1" value={base} onChange={e=>setBase(Math.max(1,parseInt(e.target.value)||1))} style={numIn}/></Field>
      <Field label="bonus / proc"><input type="number" min="0" step="0.1" value={bonus} onChange={e=>setBonus(Math.max(0,parseFloat(e.target.value)||0))} style={numIn}/></Field>
      <Field label="the craft"><select value={pid} onChange={e=>setPid(Number(e.target.value))} style={{...numIn, width:150}}>{sellable.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    </div>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
      {[["yield / craft",eff.toFixed(2),C.ink],["free items",("+"+extra.toFixed(2)),C.verdigris],["free gold / 100",fmtG(extra*unit*100)+"g",C.ochreDeep]].map(([l,v,col],i)=>(
        <div key={i} style={{textAlign:"center", padding:"12px 4px", background:C.card, border:"1px solid "+C.ruleSoft}}>
          <div style={{fontFamily:DISPLAY, fontSize:20, color:col}}>{loading&&i===2?"…":v}</div>
          <div style={{fontFamily:DISPLAY, fontSize:9.5, textTransform:"uppercase", letterSpacing:.5, color:C.inkFaint, marginTop:2}}>{l}</div>
        </div>
      ))}
    </div>
    <Hand size={12.5} color={C.greenDk} tilt={-0.4} style={{marginTop:14}}>multicraft only blesses what stacks — never gear, never the bound cauldron.</Hand>
  </div>;
}
function Field({ label, children }){
  return <div><div style={{fontFamily:DISPLAY, fontSize:10, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>{label}</div>{children}</div>;
}
const numIn={ width:70, background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:17, padding:"2px 0" };

/* ── loose hand-drawn terrain behind each zone's route ── */
function ZoneArt({ kind, color }){
  // deterministic scatter so it doesn't reflow on every render
  const rnd=(seed)=>{const x=Math.sin(seed*999.7)*43758.5; return x-Math.floor(x);};
  if(kind==="woods"){
    // rolling tree canopy + soft hills, an easy wooded vale
    return <g opacity="0.5">
      <path d="M0 64 Q25 56 50 62 T100 60 L100 90 L0 90 Z" fill={color} opacity="0.10"/>
      <path d="M0 72 Q30 66 60 71 T100 70 L100 90 L0 90 Z" fill={color} opacity="0.10"/>
      {Array.from({length:13}).map((_,i)=>{const x=6+i*7.2+rnd(i)*3, y=20+rnd(i+9)*46, s=3+rnd(i+3)*3;
        return <g key={i}><line x1={x} y1={y} x2={x} y2={y+s*1.4} stroke={color} strokeWidth="0.5" opacity="0.55"/>
          <ellipse cx={x} cy={y} rx={s} ry={s*1.2} fill={color} opacity="0.16"/></g>;})}
    </g>;
  }
  if(kind==="ruins"){
    // toppled troll columns & a stepped pyramid silhouette
    return <g opacity="0.5">
      <path d="M30 70 L42 30 L54 70 Z" fill={color} opacity="0.10"/>
      <path d="M38 70 L50 40 L62 70 Z" fill={color} opacity="0.10"/>
      {[[12,46],[20,60],[68,34],[80,56],[58,64],[88,44]].map(([x,y],i)=>(
        <g key={i}><rect x={x} y={y} width="3.2" height={10+rnd(i)*9} rx="0.6" fill={color} opacity="0.22" transform={`rotate(${(rnd(i+5)-0.5)*30} ${x+1.6} ${y})`}/></g>))}
      {Array.from({length:7}).map((_,i)=>{const x=10+i*12, y=78;
        return <rect key={i} x={x} y={y} width="6" height="3" fill={color} opacity="0.14"/>;})}
    </g>;
  }
  if(kind==="thicket"){
    // tall vertical mushroom stalks & roots — a steep, crowded climb
    return <g opacity="0.5">
      {Array.from({length:9}).map((_,i)=>{const x=8+i*10+rnd(i)*4, h=18+rnd(i+2)*34, cap=2.5+rnd(i)*2.5;
        return <g key={i}><line x1={x} y1={80} x2={x} y2={80-h} stroke={color} strokeWidth="1" opacity="0.4"/>
          <ellipse cx={x} cy={80-h} rx={cap} ry={cap*0.6} fill={color} opacity="0.2"/></g>;})}
      <path d="M0 80 Q20 70 35 78 T70 76 T100 80" fill="none" stroke={color} strokeWidth="0.6" opacity="0.4"/>
    </g>;
  }
  // void — broken islands, rifts, a fractured maze
  return <g opacity="0.55">
    {[[18,34,10],[44,26,13],[68,30,11],[80,50,9],[40,60,12],[60,66,8]].map(([x,y,s],i)=>(
      <path key={i} d={`M${x-s} ${y} L${x-s*0.3} ${y-s*0.5} L${x+s*0.6} ${y-s*0.3} L${x+s} ${y+s*0.4} L${x} ${y+s*0.7} L${x-s*0.7} ${y+s*0.3} Z`} fill={color} opacity="0.13"/>))}
    {Array.from({length:6}).map((_,i)=>{const x1=10+rnd(i)*80, y1=15+rnd(i+1)*60;
      return <line key={i} x1={x1} y1={y1} x2={x1+(rnd(i+4)-0.5)*30} y2={y1+(rnd(i+7)-0.5)*30} stroke={color} strokeWidth="0.4" opacity="0.45" strokeDasharray="1 1.5"/>;})}
  </g>;
}

/* ── FURNITURE & REWARDS (tool · housing decor, dyes, achievement prizes) ── */
function FurniturePage(){
  return <div style={pad}>
    <Eyebrow>furniture & rewards</Eyebrow>
    <Title size={22}>What the craft leaves behind</Title>
    <p style={{fontFamily:BODY, fontSize:12.5, lineHeight:1.65, color:C.inkSoft, margin:"0 0 14px"}}>
      Two different things people mix up: decor you <i>earn</i> from an achievement (account-wide, can't be crafted), and decor you <i>make</i> and sell. Here's both, with what's confirmed and what the game hasn't settled yet.
    </p>

    {/* the confirmed facts */}
    <div style={{background:C.card, border:"1px solid "+C.ruleSoft, padding:"10px 12px", marginBottom:16}}>
      <div style={{fontFamily:DISPLAY, fontSize:10.5, letterSpacing:1, textTransform:"uppercase", color:C.inkFaint, marginBottom:7}}>what's certain</div>
      {FURNITURE.facts.map((f,i)=>(
        <div key={i} style={{display:"flex", gap:8, marginBottom:6}}>
          <span style={{color:C.verdigris, flexShrink:0, fontSize:13}}>✦</span>
          <span style={{fontFamily:BODY, fontSize:12, lineHeight:1.5, color:C.inkSoft}}>{f}</span>
        </div>
      ))}
    </div>

    {/* (A) earned by achievement */}
    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
      <span style={{width:9, height:9, borderRadius:"50%", background:C.wax}}/>
      <span style={{fontFamily:DISPLAY, fontSize:14.5, color:C.ink}}>Earned, not crafted</span>
      <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>· complete the deed, keep it account-wide</span>
    </div>
    {FURNITURE.earned.map((it,i)=><RewardRow key={i} it={it} from={it.from}/>)}

    {/* (B) crafted decor */}
    <div style={{display:"flex", alignItems:"center", gap:8, margin:"16px 0 8px"}}>
      <span style={{width:9, height:9, borderRadius:"50%", background:C.ochreDeep}}/>
      <span style={{fontFamily:DISPLAY, fontSize:14.5, color:C.ink}}>Crafted to sell</span>
      <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>· tradable · needs Lumber</span>
    </div>
    {FURNITURE.crafted.map((it,i)=><RewardRow key={i} it={it} from={it.needs} skill={it.skill}/>)}

    <Hand size={13} color={C.greenDk} tilt={-0.3} style={{marginTop:14}}>the dyes are the quiet earner here — always wanted, never out of fashion.</Hand>
  </div>;
}
function RewardRow({ it, from, skill }){
  return <div style={{display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid "+C.ruleSoft, alignItems:"flex-start"}}>
    <div style={{flex:1}}>
      <div style={{display:"flex", gap:7, alignItems:"center", flexWrap:"wrap"}}>
        <span style={{fontFamily:DISPLAY, fontSize:14, color:C.ink}}>{it.name}</span>
        <CBadge confirmed={it.confirmed}/>
        {skill&&<span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint}}>skill {skill}</span>}
      </div>
      {from&&<div style={{fontFamily:DISPLAY, fontSize:11.5, fontStyle:"italic", color:C.ochreDeep, marginTop:1}}>{from}</div>}
      <div style={{fontFamily:BODY, fontSize:11.5, lineHeight:1.45, color:C.inkSoft, marginTop:2}}>{it.note}</div>
    </div>
  </div>;
}
// confirmed / unconfirmed badge
function CBadge({ confirmed }){
  return <span style={{display:"inline-flex", alignItems:"center", gap:4, fontFamily:DISPLAY, fontSize:9, letterSpacing:.4, textTransform:"uppercase",
    color: confirmed?C.verdigris:C.wax, border:"1px solid "+(confirmed?C.verdigris:C.wax), borderRadius:9, padding:"1px 7px", opacity:0.9}}>
    <span style={{width:5, height:5, borderRadius:"50%", background:confirmed?C.verdigris:"transparent", border:"1px solid "+(confirmed?C.verdigris:C.wax)}}/>
    {confirmed?"confirmed":"unconfirmed in-game"}
  </span>;
}

/* ── MAPS (tool · the four grounds + npc waypoints) ── */
function MapsPage(){
  const [a,setA]=useState(0);
  const [copied,setCopied]=useState(null);
  const z=ZONES[a];
  const copy=(t,i)=>{try{navigator.clipboard&&navigator.clipboard.writeText(t);}catch(e){} setCopied(i); setTimeout(()=>setCopied(null),1300);};
  const pathD=z.nodes.map((nd,i)=>(i===0?"M":"L")+" "+nd[0]+" "+nd[1]).join(" ");
  return <div style={pad}>
    <Eyebrow>the four grounds</Eyebrow>
    <div style={{display:"flex", gap:4, flexWrap:"wrap", margin:"8px 0 12px"}}>
      {ZONES.map((zo,i)=><button key={i} onClick={()=>setA(i)} style={{background:a===i?zo.color:"transparent", color:a===i?C.paper:C.inkSoft, border:"1px solid "+(a===i?zo.color:C.rule), padding:"4px 11px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12}}>{zo.name}</button>)}
    </div>
    <div style={{position:"relative", border:"1px solid "+C.rule, background:"radial-gradient(120% 100% at 50% 30%, "+C.paper+", "+C.paperDeep+")", padding:8, marginBottom:10}}>
      <svg viewBox="0 0 100 90" style={{width:"100%", display:"block"}}>
        {/* loose terrain illustration for this ground */}
        <ZoneArt kind={z.terrain} color={z.color}/>
        {/* rivers, where the zone has them */}
        {z.river&&z.river.length>0 && <path d={"M "+z.river.map(r=>r[0]+" "+r[1]).join(" L ")} fill="none" stroke={C.ink2} strokeWidth="1.4" strokeOpacity="0.3" strokeLinecap="round"/>}
        {/* the gathering loop */}
        <path d={pathD+" Z"} fill="none" stroke={z.color} strokeWidth="0.6" strokeOpacity="0.55" strokeDasharray="2 2.5"/>
        {z.nodes.map((nd,i)=><circle key={i} cx={nd[0]} cy={nd[1]} r="2.2" fill={z.color} opacity="0.9"/>)}
        {/* start marker */}
        <circle cx={z.nodes[0][0]} cy={z.nodes[0][1]} r="3.4" fill="none" stroke={C.sanguine} strokeWidth="1"/>
        <text x={z.nodes[0][0]} y={z.nodes[0][1]-4.5} fill={C.sanguine} fontSize="4" textAnchor="middle" fontStyle="italic" fontFamily="Georgia,serif">start</text>
      </svg>
    </div>
    <div style={{display:"flex", gap:8, marginBottom:6}}><Tag small>{z.mote}</Tag><Tag small color={z.color}>{z.difficulty}</Tag></div>
    <p style={{fontFamily:BODY, fontSize:12.5, color:C.inkSoft, lineHeight:1.6, margin:"0 0 14px", fontStyle:"italic"}}>{z.notes}</p>
    <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.ink, borderBottom:"1px solid "+C.rule, paddingBottom:3, marginBottom:4}}>folk & stations worth the mark</div>
    <div style={{overflowY:"auto"}}>{WAYPOINTS.npcs.map((it,i)=>(
      <div key={i} onClick={()=>copy(it.w,i)} style={{display:"flex", gap:9, padding:"7px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
        <div style={{flex:1}}><div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.ink}}>{it.label}</div><div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkSoft}}>{it.note}</div></div>
        <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:copied===i?C.verdigris:C.inkFaint, flexShrink:0}}>{copied===i?"copied":"copy"}</span>
      </div>
    ))}</div>
  </div>;
}

/* ── THE SPEC PLANNER (tool · allocate points, see the payoff, save the build) ── */
function SpecPlanner({ build, setBuild }){
  const [tree,setTree]=useState("herb");
  const T=SPEC_TREES[tree];
  const b=build[tree];
  const spent=T.branches.reduce((s,br)=>s+(b[br.key]||0),0);
  const left=T.cap-spent;
  const set=(brk,val,max)=>{
    const v=Math.max(0,Math.min(max,val));
    const others=T.branches.reduce((s,br)=>s+(br.key===brk?0:(b[br.key]||0)),0);
    const capped=Math.min(v, T.cap-others);
    setBuild(p=>({...p,[tree]:{...p[tree],[brk]:capped}}));
  };
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
      <Eyebrow>the planner · spend your knowing</Eyebrow>
      <button onClick={()=>setBuild(p=>({...p,[tree]:{}}))} style={{background:"transparent", border:"1px solid "+C.rule, color:C.inkSoft, fontFamily:DISPLAY, fontStyle:"italic", fontSize:11, padding:"2px 8px", cursor:"pointer"}}>reset</button>
    </div>
    <div style={{display:"flex", gap:6, marginBottom:10}}>
      {["herb","alch"].map(k=>(
        <button key={k} onClick={()=>setTree(k)} style={{background:tree===k?SPEC_TREES[k].accent:"transparent", color:tree===k?C.paper:C.inkSoft, border:"1px solid "+(tree===k?SPEC_TREES[k].accent:C.rule), padding:"4px 12px", cursor:"pointer", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5}}>{SPEC_TREES[k].label}</button>
      ))}
    </div>

    {/* points budget */}
    <div style={{display:"flex", alignItems:"baseline", gap:8, marginBottom:6}}>
      <span style={{fontFamily:DISPLAY, fontSize:28, color:left<0?C.sanguine:T.accent}}>{spent}</span>
      <span style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkFaint}}>of {T.cap} knowledge spent · {left} left</span>
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint, marginBottom:14}}>
      filled diamonds are the big payoffs. each branch shows its trunk and the sub-specs that split off it, with what unlocks at every point level.
    </div>

    {/* ── the trees ── */}
    <div style={{overflowY:"auto"}}>
      {T.branches.map(br=>{
        const pts=b[br.key]||0;
        const trunk=(br.trunk||[]).slice().sort((a,c)=>a.at-c.at);
        const pct=Math.min(100,(pts/br.max)*100);
        return <div key={br.key} style={{padding:"4px 0 18px", borderBottom:"1px solid "+C.rule, marginBottom:10}}>
          {/* branch header + stepper */}
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
            <span style={{width:12, height:12, borderRadius:3, transform:"rotate(45deg)", background:br.color, flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:DISPLAY, fontSize:16.5, color:C.ink}}>{br.name}</div>
              <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>{br.gist}</div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
              <button onClick={()=>set(br.key,pts-5,br.max)} style={stepBtn}>–</button>
              <span style={{fontFamily:DISPLAY, fontSize:16, color:C.ink, minWidth:48, textAlign:"center"}}>{pts}<span style={{fontSize:11, color:C.inkFaint}}>/{br.max}</span></span>
              <button onClick={()=>set(br.key,pts+5,br.max)} style={stepBtn}>+</button>
            </div>
          </div>

          {/* TRUNK */}
          <div style={{position:"relative", paddingLeft:30}}>
            <div style={{position:"absolute", left:13, top:12, bottom:12, width:2, background:C.ruleSoft}}/>
            <div style={{position:"absolute", left:13, top:12, width:2, background:br.color, height:`calc(${pct}% - 24px)`, minHeight:0, transition:"height .3s"}}/>
            {trunk.map((n,i)=>{const hit=pts>=n.at;
              return <div key={i} style={{position:"relative", display:"flex", gap:11, alignItems:"flex-start", padding:"6px 0"}}>
                <span style={{position:"absolute", left:-23, top:7, width:n.key?17:13, height:n.key?17:13,
                  borderRadius:n.key?3:"50%", transform:n.key?"rotate(45deg)":"none",
                  border:"2px solid "+(hit?br.color:C.rule), background:hit?br.color:C.paper,
                  boxShadow:hit&&n.key?"0 0 8px "+br.color:"none", flexShrink:0, transition:"all .2s"}}/>
                <span style={{fontFamily:DISPLAY, fontSize:12, fontWeight:700, color:hit?br.color:C.inkFaint, minWidth:22}}>{n.at}</span>
                <div style={{flex:1, opacity:hit?1:0.6}}>
                  <div style={{fontFamily:DISPLAY, fontSize:13.5, color:C.ink, fontWeight:n.key?700:400}}>{n.t}</div>
                  <div style={{fontFamily:DISPLAY, fontSize:11.5, fontStyle:"italic", color:C.inkSoft, lineHeight:1.4}}>{n.d}</div>
                </div>
              </div>;
            })}
          </div>

          {/* SUB-SPECS: each its own connected line, nodes by level */}
          {(br.subs||[]).map((sb,si)=>(
            <div key={si} style={{marginTop:10, marginLeft:30, position:"relative", paddingLeft:20}}>
              {/* the elbow connector into this sub-spec */}
              <div style={{position:"absolute", left:0, top:0, bottom:14, width:2, borderLeft:"2px dashed "+(sb.color||br.color), opacity:0.5}}/>
              <div style={{display:"flex", alignItems:"center", gap:7, marginBottom:4}}>
                <span style={{width:8, height:8, borderRadius:2, transform:"rotate(45deg)", background:sb.color||br.color, flexShrink:0}}/>
                <span style={{fontFamily:DISPLAY, fontSize:11.5, letterSpacing:1, textTransform:"uppercase", color:sb.color||br.color}}>{sb.name}</span>
              </div>
              {sb.nodes.map((n,j)=>{const hit=pts>=n.at;
                return <div key={j} style={{display:"flex", gap:9, alignItems:"flex-start", padding:"3px 0", opacity:hit?1:0.58}}>
                  <span style={{width:9, height:9, borderRadius:"50%", border:"1.5px solid "+(hit?(sb.color||br.color):C.rule), background:hit?(sb.color||br.color):"transparent", flexShrink:0, marginTop:4}}/>
                  <span style={{fontFamily:DISPLAY, fontSize:11.5, fontWeight:700, color:hit?(sb.color||br.color):C.inkFaint, minWidth:20}}>{n.at}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.ink}}>{n.t}</div>
                    <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkSoft, lineHeight:1.35}}>{n.d}</div>
                  </div>
                </div>;
              })}
            </div>
          ))}

          {pts>0 && <div style={{fontFamily:HAND, fontSize:12.5, color:C.greenDk, transform:"rotate(-0.3deg)", marginTop:12, marginLeft:30}}>{br.note}</div>}
        </div>;
      })}
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint, marginTop:8}}>
      point thresholds and what each node unlocks are taken from the Midnight profession guides. exact per-point stat values aren't published, so nodes are described by what they do. your build is kept while the journal is open.
    </div>
  </div>;
}
const stepBtn={ width:28, height:28, borderRadius:"50%", border:"1px solid "+C.rule, background:"rgba(255,255,255,0.3)", color:C.ink, fontFamily:DISPLAY, fontSize:17, cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" };

/* ── the ribboned sections of the book ── */
const SECTIONS = [
  { key:"overview",  ribbon:"#9c4a3c", title:"Tonight's Plan",     flavor:"the night's plan",        sub:"top sellers right now, ranked", voice:true },
  { key:"specimens", ribbon:"#6b7d4e", title:"Herb Gallery",       flavor:"the herb gallery",        sub:"every herb & what it sells for", voice:true },
  { key:"worth",     ribbon:"#c19a45", title:"What's Worth It",     flavor:"what's worth it",         sub:"full ranking · herbs & crafts by margin", voice:true },
  { key:"knowing",   ribbon:"#46627a", title:"Field Notes",         flavor:"what i've come to know",  sub:"tips, lore & gold-making wisdom", voice:true },
  { key:"planner",   ribbon:"#b06a86", title:"Spec Planner",        flavor:"the spec planner",        sub:"plan your talent trees point by point", voice:false },
  { key:"formulary", ribbon:"#7d6a9c", title:"Formulary",           flavor:"the formulary",           sub:"every recipe, mats & where to learn it", voice:false },
  { key:"scale",     ribbon:"#9a7833", title:"Scale & Bench",       flavor:"the scale & bench",       sub:"profit calculator & multicraft odds", voice:false },
  { key:"furniture", ribbon:"#a86a3c", title:"Furniture & Rewards",  flavor:"what the craft leaves behind", sub:"housing decor, dyes & achievement prizes", voice:false },
  { key:"maps",      ribbon:"#5a7d5e", title:"Farming Grounds",     flavor:"the four grounds",        sub:"routes & treasure waypoints", voice:false },
];

/* ── EXPANSION REGISTRY — the bookshelf ──────────────────────────
   Each expansion is a journal Gilshi keeps. Today Midnight is fully
   written; the rest are spines on the shelf, ready to be filled.
   Adding an expansion later = one entry here with its own data set. */
const EXPANSIONS = [
  { key:"midnight",  title:"Midnight",            short:"Midnight",  year:"12.0", spine:"#4a3324", spine2:"#2e2014", accent:C.sanguine, ready:true,
    cloth:"#46321f", gilt2:"#caa85e", tall:262, ornament:"diamond", wear:0.5, bands:3,
    subtitle:"Silvermoon · the four grounds", herbCount:6, craftCount:21,
    blurb:"Alchemy & Herbalism across Eversong, Zul'Aman, Harandar and the Voidstorm." },
  { key:"tww",       title:"The War Within",      short:"War Within",year:"11.0", spine:"#37434f", spine2:"#222b34", accent:C.ink2,  ready:false,
    cloth:"#33414c", gilt2:"#9fb0a0", tall:244, ornament:"knot", wear:0.7, bands:4,
    subtitle:"Khaz Algar · the deep below", blurb:"Coming soon. The Isle-Algar herbs and Khaz alchemy." },
  { key:"df",        title:"Dragonflight",        short:"Dragonflight",year:"10.0",spine:"#5a3f33", spine2:"#39271e", accent:C.wax,   ready:false,
    cloth:"#553a2e", gilt2:"#c79a5a", tall:270, ornament:"scroll", wear:0.6, bands:3,
    subtitle:"the Dragon Isles", blurb:"Coming soon. Decay & renewal across the Isles." },
  { key:"sl",        title:"Shadowlands",         short:"Shadowlands",year:"9.0",  spine:"#39384f", spine2:"#252436", accent:C.plum,  ready:false,
    cloth:"#363350", gilt2:"#b0a0c0", tall:236, ornament:"diamond", wear:0.8, bands:4,
    subtitle:"the realms of Death", blurb:"Coming soon. Death-blooms of the four covenants." },
  { key:"bfa",       title:"Battle for Azeroth",  short:"BfA",       year:"8.0", spine:"#46503c", spine2:"#2e3526", accent:C.verdigris, ready:false,
    cloth:"#434d39", gilt2:"#a8b07a", tall:256, ornament:"knot", wear:0.65, bands:3,
    subtitle:"Kul Tiras & Zandalar", blurb:"Coming soon. Akunda's bite and sea-stalk." },
];
const EXP = key => EXPANSIONS.find(e=>e.key===key) || EXPANSIONS[0];

/* index page (front of book) */
function IndexPage({ go, exp }){
  const e = exp || EXP("midnight");
  return <div style={pad}>
    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:2}}>
      <AlchemateMark size={20} color={C.ochreDeep}/>
      <span style={{fontFamily:DISPLAY, fontSize:12, letterSpacing:"0.18em", color:C.inkFaint, textTransform:"uppercase"}}>Alchemate</span>
    </div>
    <Hand size={14} color={C.green} tilt={-1} style={{marginBottom:4}}>kept by Gilshi — of Pandaria, Moon Guard</Hand>
    <h1 style={{fontFamily:DISPLAY, fontSize:"clamp(26px,5vw,40px)", fontWeight:400, margin:"2px 0 2px", color:C.ink, lineHeight:1.02}}>The {e.title} Journal</h1>
    <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkFaint, marginBottom:18}}>an alchemist's gold-making companion · {e.subtitle}</div>
    {SECTIONS.map((s,i)=>(
      <div key={s.key} onClick={()=>go(s.key)} style={{display:"flex", gap:14, alignItems:"baseline", padding:"9px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
        <span style={{width:10, height:10, borderRadius:2, background:s.ribbon, flexShrink:0, alignSelf:"center"}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:DISPLAY, fontSize:16.5, color:C.ink}}>{s.title}</div>
          <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>{s.sub}</div>
        </div>
        <span style={{fontFamily:DISPLAY, fontSize:16, color:C.inkFaint}}>›</span>
      </div>
    ))}
    <div style={{position:"absolute", bottom:22, right:26, opacity:0.9}}><Tape w={36} rot={28} style={{top:8, right:24}}/><Pressed id={236761} size={66}/></div>
  </div>;
}

/* which component pair renders for a section (left leaf, right leaf) */
function spreadFor(key, ctx){
  const { price, loading, live, go, build, setBuild, priceMeta } = ctx;
  switch(key){
    case "overview":  return [<Overview key="ol" price={price} loading={loading} live={live} go={go} meta={priceMeta}/>, <OverviewRight key="or" go={go}/>];
    case "specimens": return [<SpecLeft key="sl" price={price} loading={loading} go={go}/>, <SpecRight key="sr" price={price} loading={loading} go={go}/>];
    case "worth":     return [<Worth key="wl" price={price} loading={loading} live={live} meta={priceMeta}/>, <WorthHelp key="wr"/>];
    case "knowing":   return [<Knowing key="kl"/>, <KnowingHelp key="kr"/>];
    case "formulary": return [<FormularyPage key="fl" price={price} loading={loading}/>, null];
    case "scale":     return [<ScalePage key="cl" price={price} loading={loading}/>, <BenchPage key="cr" price={price} loading={loading}/>];
    case "furniture": return [<FurniturePage key="fu"/>, null];
    case "planner":   return [<SpecPlanner key="sp" build={build} setBuild={setBuild}/>, null];
    case "maps":      return [<MapsPage key="ml"/>, null];
    default:          return [<Overview key="d" price={price} loading={loading} live={live} go={go}/>, null];
  }
}
// small facing-page helpers for reading sections (kept light)
function WorthHelp(){
  return <div style={pad}>
    <Eyebrow>a steadier coin</Eyebrow><Title size={21}>The dye-work</Title>
    <p style={{fontFamily:BODY, fontSize:13, lineHeight:1.75, color:C.inkSoft}}>Ten of any herb, the cheapest i can find, ground to a single pigment — then to dye at the neighbourhood table. No skill in it, none gained, and it never goes to waste. The decorators always come back.</p>
    <div style={{display:"flex", gap:14, flexWrap:"wrap", marginTop:12}}>{[["Blue",C.ink2],["Red",C.sanguine],["Green",C.verdigris],["Amethyst",C.plum]].map(([n,c],i)=>(<span key={i} style={{display:"inline-flex", alignItems:"center", gap:6, fontFamily:DISPLAY, fontSize:13, color:C.inkSoft}}><span style={{width:12, height:12, borderRadius:"50%", background:c, border:"1px solid "+C.ink}}/>{n}</span>))}</div>
    <Hand size={14} style={{marginTop:18}}>Argentleaf makes the truest blue. i keep the browned ones just for this.</Hand>
  </div>;
}
function KnowingHelp(){
  const facts=[
    ["the pool holds","1,000","at most"],
    ["it fills","1 / 6 min","10 an hour"],
    ["dry to full","~100 hrs","there is no hurrying it"],
    ["Ingenuity refunds","~50%","up to 70% at most"],
  ];
  return <div style={pad}>
    <Eyebrow>the patient pool</Eyebrow><Title size={21}>On concentration</Title>
    <p style={{fontFamily:BODY, fontSize:13, lineHeight:1.7, color:C.inkSoft, margin:"0 0 12px"}}>The reckoning is fixed, not a feeling. I keep a second craft and a second pool, and spend only where the worth is real.</p>
    <div style={{border:"1px solid "+C.rule, background:"rgba(255,255,255,0.18)"}}>
      {facts.map((f,i)=>(
        <div key={i} style={{display:"flex", alignItems:"baseline", gap:8, padding:"8px 12px", borderBottom: i<facts.length-1?"1px solid "+C.ruleSoft:"none"}}>
          <span style={{flex:1, fontFamily:BODY, fontSize:12.5, color:C.inkSoft}}>{f[0]}</span>
          <span style={{fontFamily:DISPLAY, fontSize:16, color:C.sanguine}}>{f[1]}</span>
          <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, minWidth:96, textAlign:"right"}}>{f[2]}</span>
        </div>
      ))}
    </div>
    <Hand size={13.5} color={C.green} style={{marginTop:14}}>so: spend it on what stacks and sells, never on trinkets. the pool you waste is a hundred hours you don't get back.</Hand>
  </div>;
}

/* ════════════ the bookshelf (Alchemate landing) ════════════ */
function Bookshelf({ onOpen }){
  const [hover,setHover]=useState("midnight");
  const cur=EXP(hover);
  return <div style={{position:"relative", zIndex:5, width:"min(96vw,1080px)", maxWidth:"100%", padding:"0 16px"}}>
    {/* masthead */}
    <div style={{textAlign:"center", marginBottom:"clamp(18px,4vh,40px)"}}>
      <div style={{display:"inline-flex", alignItems:"center", gap:12, marginBottom:6}}>
        <AlchemateMark size={38}/>
        <h1 style={{fontFamily:DISPLAY, fontWeight:400, fontSize:"clamp(34px,7vw,60px)", letterSpacing:"0.06em", margin:0, color:"#f0e2c2", textShadow:"0 2px 18px rgba(0,0,0,0.6)"}}>ALCHEMATE</h1>
      </div>
      <div style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:"clamp(12px,2vw,15px)", color:"#c9b693", letterSpacing:"0.04em"}}>
        the alchemist's gold-making companion · journals kept by Gilshi of Moon Guard
      </div>
    </div>

    {/* the shelf */}
    <div style={{position:"relative", display:"flex", justifyContent:"center", alignItems:"flex-end", gap:"clamp(8px,1.6vw,18px)",
      padding:"0 clamp(10px,4vw,46px) 0", minHeight:"clamp(210px,34vh,320px)"}}>
      {EXPANSIONS.map((e,i)=>{
        const on=hover===e.key;
        const lean=[0.6,-0.8,0.4,-1.1,0.7][i]||0; // gentle natural tilt per book
        return <button key={e.key} onMouseEnter={()=>setHover(e.key)} onFocus={()=>setHover(e.key)}
          onClick={()=>e.ready&&onOpen(e.key)} disabled={!e.ready}
          aria-label={e.title+(e.ready?"":" (coming soon)")}
          style={{cursor:e.ready?"pointer":"not-allowed", border:"none", background:"transparent", padding:0,
            transformOrigin:"bottom center", transition:"transform .35s cubic-bezier(.4,.1,.2,1)",
            transform: on?"translateY(-20px) rotate(0deg)":`translateY(0) rotate(${lean}deg)`, outline:"none"}}>
          <Spine e={e} on={on}/>
        </button>;
      })}
      {/* the wooden shelf board */}
      <div style={{position:"absolute", left:"clamp(0px,2vw,28px)", right:"clamp(0px,2vw,28px)", bottom:-2, height:18, borderRadius:3,
        background:"linear-gradient(180deg,#6a4d33,#3a2918)", boxShadow:"0 14px 30px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,220,170,0.18)"}}/>
      <div style={{position:"absolute", left:"clamp(0px,2vw,28px)", right:"clamp(0px,2vw,28px)", bottom:-12, height:12, borderRadius:"0 0 4px 4px",
        background:"linear-gradient(180deg,#2c1f13,#1a120a)"}}/>
    </div>

    {/* the chosen book's plate */}
    <div style={{textAlign:"center", marginTop:"clamp(22px,5vh,46px)", minHeight:64}}>
      <div style={{fontFamily:DISPLAY, fontSize:"clamp(20px,3.4vw,28px)", color:"#f0e2c2"}}>{cur.title} <span style={{color:"#9c8a6a", fontSize:"0.6em", fontStyle:"italic"}}>· patch {cur.year}</span></div>
      <div style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:13.5, color:"#c1ad88", margin:"3px 0 12px"}}>{cur.subtitle}</div>
      <div style={{fontFamily:BODY, fontSize:13, color:"#b3a384", maxWidth:440, margin:"0 auto 16px", lineHeight:1.6, opacity:0.92}}>{cur.blurb}</div>
      {cur.ready
        ? <button onClick={()=>onOpen(cur.key)} className="openbtn" style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:15, color:"#1c140b",
            background:"linear-gradient(180deg,#e7cd8e,#caa85e)", border:"1px solid #8a6a30", borderRadius:24, padding:"9px 26px", cursor:"pointer",
            boxShadow:"0 6px 18px rgba(0,0,0,0.4)"}}>open the journal ✦</button>
        : <span style={{fontFamily:DISPLAY, fontStyle:"italic", fontSize:13, color:"#8a7a5c", border:"1px solid #5a4a32", borderRadius:24, padding:"8px 22px"}}>not yet written</span>}
    </div>
  </div>;
}

/* a single 3D-ish book spine on the shelf */
function Spine({ e, on }){
  const W=58, H=e.tall||250;
  const ready=e.ready;
  const gilt=e.gilt2||"#caa85e";
  const cloth=e.cloth||e.spine;
  const dk=e.spine2||"#2a1d12";
  // raised band y-positions across the spine
  const bandN=e.bands||3;
  const bandYs=[]; for(let i=1;i<=bandN;i++){ bandYs.push(H*(0.16+ (0.62*i/(bandN+1)))); }
  const uid=e.key;
  const orn=(cx,cy)=>{
    if(e.ornament==="knot") return <path d={`M${cx-6} ${cy} q6 -7 12 0 q-6 7 -12 0 M${cx} ${cy-6} q7 6 0 12 q-7 -6 0 -12`} fill="none" stroke={gilt} strokeWidth="0.9" opacity={ready?0.8:0.4}/>;
    if(e.ornament==="scroll") return <path d={`M${cx-7} ${cy+3} q3 -8 7 -3 q4 5 7 -3 M${cx-7} ${cy-3} q3 8 7 3 q4 -5 7 3`} fill="none" stroke={gilt} strokeWidth="0.9" opacity={ready?0.8:0.4}/>;
    return <g opacity={ready?0.8:0.4} fill="none" stroke={gilt} strokeWidth="0.9"><path d={`M${cx} ${cy-7} L${cx+6} ${cy} L${cx} ${cy+7} L${cx-6} ${cy} Z`}/><circle cx={cx} cy={cy} r="1.6" fill={gilt} stroke="none"/></g>;
  };
  return <div style={{position:"relative", width:W, height:H, filter: on?"drop-shadow(0 22px 30px rgba(0,0,0,0.6))":"drop-shadow(0 12px 20px rgba(0,0,0,0.5))", transition:"filter .35s"}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        {/* cloth weave */}
        <filter id={`weave-${uid}`}><feTurbulence type="turbulence" baseFrequency="0.9 0.4" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0"/></filter>
        {/* broad foxing/aging blotches */}
        <filter id={`fox-${uid}`}><feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="3" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 0.42 0 0 0 0 0.32 0 0 0 0 0.16 0 0 0 0.5 0"/></filter>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dk}/><stop offset="0.12" stopColor={cloth}/><stop offset="0.5" stopColor={cloth}/><stop offset="0.84" stopColor={cloth}/><stop offset="1" stopColor={dk}/>
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.4" stopColor="#fff" stopOpacity="0"/><stop offset="0.5" stopColor="#fff" stopOpacity="0.10"/><stop offset="0.6" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* body */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" fill={`url(#sp-${uid})`} stroke="rgba(0,0,0,0.5)" strokeWidth="1"/>
      {/* cloth weave texture */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" filter={`url(#weave-${uid})`} opacity="0.5"/>
      {/* foxing/age blotches */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" filter={`url(#fox-${uid})`} opacity={0.25+0.35*(e.wear||0.5)}/>
      {/* center sheen */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="2.5" fill={`url(#sheen-${uid})`}/>

      {/* gilt rule border (double line, antique) */}
      <rect x="6" y="7" width={W-12} height={H-14} fill="none" stroke={gilt} strokeWidth="1" opacity={ready?0.7:0.34}/>
      <rect x="8.5" y="9.5" width={W-17} height={H-19} fill="none" stroke={gilt} strokeWidth="0.5" opacity={ready?0.5:0.25}/>

      {/* raised bands across spine, each with highlight + shadow */}
      {bandYs.map((by,i)=>(
        <g key={i}>
          <rect x="2" y={by-3} width={W-4} height="6" fill={dk} opacity="0.55"/>
          <rect x="2" y={by-3} width={W-4} height="1.4" fill="#fff" opacity="0.10"/>
          <rect x="2" y={by+1.6} width={W-4} height="1.4" fill="#000" opacity="0.30"/>
          <line x1="7" y1={by} x2={W-7} y2={by} stroke={gilt} strokeWidth="0.5" opacity={ready?0.55:0.28}/>
        </g>
      ))}

      {/* title panel (between first two bands) */}
      <rect x="6.5" y={H*0.20} width={W-13} height={H*0.30} fill="none" stroke={gilt} strokeWidth="0.8" opacity={ready?0.65:0.3}/>
      {/* corner ticks on the panel */}
      {[[8.5,H*0.20+2],[W-8.5,H*0.20+2],[8.5,H*0.50-2],[W-8.5,H*0.50-2]].map(([x,y],i)=>(
        <path key={i} d={`M${x-2} ${y} L${x} ${y} L${x} ${y+(i<2?2:-2)}`} fill="none" stroke={gilt} strokeWidth="0.7" opacity={ready?0.6:0.3}/>
      ))}

      {/* ornaments in the lower panels */}
      {orn(W/2, H*0.62)}
      {orn(W/2, H*0.78)}

      {/* the alembic emblem near the foot */}
      <g transform={`translate(${W/2-9}, ${H-30}) scale(0.56)`} opacity={ready?0.9:0.4}>
        <path d="M13 4 h6 M16 4 v7 l6 12 a4 4 0 0 1 -3.6 5.6 h-8.8 A4 4 0 0 1 6 23 l6 -12 V4" fill="none" stroke={gilt} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      </g>

      {/* ── wear: scuffed corners, frayed head-cap, chipped foot ── */}
      <path d={`M2 10 Q1 4 9 2`} fill="none" stroke="#000" strokeWidth="2.5" opacity={0.3+0.4*(e.wear||0.5)} strokeLinecap="round"/>
      <path d={`M${W-2} ${H-9} Q${W-1} ${H-3} ${W-9} ${H-2}`} fill="none" stroke="#000" strokeWidth="2.5" opacity={0.3+0.4*(e.wear||0.5)} strokeLinecap="round"/>
      {/* rubbed lighter patches where gilt has worn */}
      <ellipse cx={W*0.3} cy={H*0.34} rx="7" ry="14" fill={cloth} opacity={0.4*(e.wear||0.5)}/>
      <ellipse cx={W*0.7} cy={H*0.7} rx="6" ry="11" fill={dk} opacity={0.3*(e.wear||0.5)}/>
      {/* a couple of nicks along the fore edge */}
      <path d={`M${W-2} ${H*0.4} l-3 1 l3 1 Z`} fill={dk} opacity="0.6"/>
      <path d={`M2 ${H*0.55} l3 1 l-3 1 Z`} fill={dk} opacity="0.6"/>
      {/* frayed head-cap threads */}
      <g stroke={gilt} strokeWidth="0.5" opacity={ready?0.5:0.25}>
        <line x1={W*0.4} y1="2" x2={W*0.4} y2="5"/><line x1={W*0.55} y1="2" x2={W*0.55} y2="4.5"/><line x1={W*0.62} y1="2" x2={W*0.62} y2="5.5"/>
      </g>
    </svg>

    {/* vertical title, overlaid in the panel */}
    <div style={{position:"absolute", top:H*0.205, left:0, right:0, height:H*0.29, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none"}}>
      <span style={{writingMode:"vertical-rl", transform:"rotate(180deg)", fontFamily:DISPLAY, fontSize: e.short.length>9?10.5:12.5, letterSpacing:"0.1em",
        color: ready?gilt:"#8f8068", textShadow:"0 1px 1px rgba(0,0,0,0.7)", whiteSpace:"nowrap", fontWeight:600}}>
        {e.short.toUpperCase()}
      </span>
    </div>

    {!ready && <div style={{position:"absolute", inset:0, borderRadius:"2.5px", background:"rgba(20,14,8,0.34)"}}/>}
  </div>;
}

/* the Alchemate mark: an alembic/flask glyph */
function AlchemateMark({ size=28, color="#caa85e" }){
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Alchemate">
    <defs><linearGradient id="amk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={color}/><stop offset="1" stopColor="#9a7833"/></linearGradient></defs>
    <path d="M13 4 h6 M16 4 v7 l6 12 a4 4 0 0 1 -3.6 5.6 h-8.8 A4 4 0 0 1 6 23 l6 -12 V4" fill="none" stroke="url(#amk)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M9.4 19 h13.2" stroke="url(#amk)" strokeWidth="1.2" opacity="0.7"/>
    <circle cx="13.6" cy="23" r="1.1" fill={color}/><circle cx="17.6" cy="25" r="1.4" fill={color} opacity="0.8"/><circle cx="19" cy="21.5" r="0.9" fill={color} opacity="0.7"/>
  </svg>;
}

/* ════════════ the book ════════════ */
export default function App(){
  const [onShelf, setOnShelf] = useState(true);          // start at the bookshelf
  const [expansion, setExpansion] = useState("midnight"); // which journal is open
  const [section, setSection] = useState("index");
  const [scene, setScene] = useState("table");
  const [opening, setOpening] = useState(false);          // shelf→book transition
  const [turning, setTurning] = useState(false);
  const [mobile, setMobile] = useState(typeof window!=="undefined" && window.innerWidth<820);
  const [priceData, setPriceData] = useState(null); // { prices, realm, region, updated }
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState({ herb:{}, alch:{} });
  const [navOpen, setNavOpen] = useState(false);

  useEffect(()=>{
    const on=()=>setMobile(window.innerWidth<820); window.addEventListener("resize",on);
    return ()=>window.removeEventListener("resize",on);
  },[]);

  // price fetch — runs only if CONFIG.ue.enabled (live); otherwise estimates stand
  useEffect(()=>{
    if(CONFIG.ue.enabled){
      setLoading(true);
      fetchPrices(CONFIG.ue.realm).then(p=>{ setPriceData(p); setLoading(false); });
    }
  },[]);
  const prices = priceData && priceData.prices;
  const price = useCallback((id)=> (prices && prices[id]!=null) ? prices[id] : null, [prices]);
  const live = CONFIG.ue.enabled && !!prices;
  const priceMeta = { realm: (priceData&&priceData.realm)||CONFIG.ue.realm, updated: priceData&&priceData.updated, live };

  const turnTo = (key)=>{ if(key===section){return;} setTurning(true); setTimeout(()=>{ setSection(key); setTurning(false); }, 500); };
  const openJournal = (key)=>{ setExpansion(key); setSection("index"); setOpening(true); setOnShelf(false); setTimeout(()=>setOpening(false), 700); };
  const backToShelf = ()=>{ setOnShelf(true); };
  const ctx = { price, loading, live, go:turnTo, build, setBuild, priceMeta };
  const isIndex = section==="index";
  const curIdx = SECTIONS.findIndex(s=>s.key===section);
  const curSec = SECTIONS[curIdx] || null;
  const prevKey = curIdx>0 ? SECTIONS[curIdx-1].key : null;
  const nextKey = curIdx>=0 && curIdx<SECTIONS.length-1 ? SECTIONS[curIdx+1].key : null;
  const tableScene = scene==="table" && !mobile;
  const [leftLeaf, rightLeaf] = isIndex ? [<IndexPage key="ix" go={turnTo} exp={EXP(expansion)}/>, null] : spreadFor(section, ctx);
  // on desktop, if a section has no right leaf, center the single leaf
  const single = isIndex || rightLeaf==null;

  // ── the bookshelf is the entry point ──
  if(onShelf){
    return (
      <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative",
        background:"radial-gradient(90% 80% at 50% 30%, #2c2013 0%, #1c1409 55%, #0f0a05 100%)"}}>
        <ShelfBg/>
        <Bookshelf onOpen={openJournal}/>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative",
      background: tableScene ? "radial-gradient(80% 70% at 50% 38%, #3a2c1c 0%, #271b11 60%, #160e07 100%)" : "radial-gradient(70% 60% at 50% 30%, #36281a, #170f08)"}}>
      <SceneBg tableScene={tableScene}/>

      <div className={opening?"bookopen":"bookidle"} style={{position:"relative", zIndex:5, transition:"transform 0.7s cubic-bezier(.5,.05,.2,1)",
        transform: tableScene ? "perspective(1700px) rotateX(13deg) scale(0.9)" : "perspective(2200px) rotateX(3deg) scale(1)",
        transformOrigin:"center 60%", width: mobile?"100vw":"min(94vw, 1040px)", height: mobile?"100vh":"min(90vh, 740px)", maxWidth:"100%"}}>

        {/* cover — tooled leather with grain */}
        <div style={{position:"absolute", inset: mobile?0:-16, background:"linear-gradient(155deg, "+C.cover+", "+C.coverDk+")", borderRadius: mobile?0:8, boxShadow:"0 40px 90px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.45)", overflow:"hidden"}}>
          {/* leather grain */}
          <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.5, mixBlendMode:"overlay"}} aria-hidden="true">
            <filter id="leather"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.85" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/></filter>
            <rect width="100%" height="100%" filter="url(#leather)"/>
          </svg>
          {/* broad mottling */}
          <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.4}} aria-hidden="true">
            <filter id="leather2"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0.15 0 0 0 0 0.10 0 0 0 0 0.06 0 0 0 0.5 0"/></filter>
            <rect width="100%" height="100%" filter="url(#leather2)"/>
          </svg>
          {/* gilt tooled border + spine emboss (desktop) */}
          {!mobile && <div style={{position:"absolute", inset:10, border:"1px solid rgba(202,168,94,0.35)", borderRadius:5, pointerEvents:"none"}}/>}
          {!mobile && !single && <div style={{position:"absolute", left:"50%", top:0, bottom:0, width:20, transform:"translateX(-50%)", background:"linear-gradient(90deg, rgba(0,0,0,0.4), rgba(255,220,170,0.06) 50%, rgba(0,0,0,0.4))", pointerEvents:"none"}}/>}
        </div>

        {/* ribbons (quick visual access; the labeled menu is the main nav) */}
        <div style={{position:"absolute", top: mobile?44:-16, left:0, right:0, display:"flex", justifyContent:"center", gap:mobile?9:14, zIndex:9}}>
          {SECTIONS.map(sec=>(
            <button key={sec.key} onClick={()=>turnTo(sec.key)} title={sec.title} aria-label={sec.title} className="ribbon"
              style={{width:mobile?11:13, height: section===sec.key?(mobile?40:72):(mobile?28:54), background:sec.ribbon, border:"none", cursor:"pointer", padding:0, boxShadow:"0 3px 5px rgba(0,0,0,0.3)", transition:"height 0.3s", clipPath:"polygon(0 0,100% 0,100% 86%,50% 100%,0 86%)"}}/>
          ))}
        </div>

        {/* spread */}
        <div style={{position:"absolute", inset: mobile?0:6, top: mobile?62:10, display:"flex", borderRadius: mobile?0:3, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
          {/* visible page-stack thickness along the outer edges (desktop book feel) */}
          {!mobile && <div style={{position:"absolute", left:-4, top:6, bottom:6, width:5, borderRadius:"2px 0 0 2px", background:"repeating-linear-gradient(90deg, #e8dcc0, #d8c9a4 1.5px, #cbb894 3px)", boxShadow:"-2px 0 6px rgba(0,0,0,0.3)", zIndex:1}}/>}
          {!mobile && <div style={{position:"absolute", right:-4, top:6, bottom:6, width:5, borderRadius:"0 2px 2px 0", background:"repeating-linear-gradient(90deg, #cbb894, #d8c9a4 1.5px, #e8dcc0 3px)", boxShadow:"2px 0 6px rgba(0,0,0,0.3)", zIndex:1}}/>}
          {!mobile && !single && (
            <div style={{...leafBase, borderRight:"1px solid "+C.rule, background:"radial-gradient(130% 100% at 85% 50%, "+C.paperHi+", "+C.paperLo+" 92%, "+C.paperDeep+")"}}>
              <GhostWriting/>
              <PaperGrain side="left"/>
              <div style={{position:"relative", zIndex:3, height:"100%", display:"flex", flexDirection:"column", overflow:"hidden"}}>{leftLeaf}</div>
              <Gutter side="right"/>
            </div>
          )}
          <div style={{position:"relative", flex:1}}>
            <div className={turning?"turning":""} style={{...leafBase, background:"radial-gradient(130% 100% at 15% 50%, "+C.paperHi+", "+C.paperLo+" 92%, "+C.paperDeep+")", transformOrigin:"left center", transformStyle:"preserve-3d", transition:"transform 0.5s cubic-bezier(.4,.05,.3,1)", transform: turning?"rotateY(-19deg)":"rotateY(0)", zIndex:2}}>
              <GhostWriting/>
              <PaperGrain side="right"/>
              <div style={{position:"relative", zIndex:3, height:"100%", display:"flex", flexDirection:"column", overflow:"hidden"}}>
                {mobile && !isIndex ? <div style={{overflowY:"auto", height:"100%"}}>{leftLeaf}{rightLeaf}</div> : (single ? leftLeaf : rightLeaf)}
              </div>
              <Gutter side="left"/>
              {turning && <div style={{position:"absolute", inset:0, background:"linear-gradient(90deg, rgba(0,0,0,0.16), transparent 45%)", pointerEvents:"none"}}/>}
            </div>
          </div>
          {/* center spine: the dark valley where two pages meet in an open book */}
          {!mobile && !single && <div style={{position:"absolute", left:"50%", top:0, bottom:0, width:34, transform:"translateX(-50%)", pointerEvents:"none", zIndex:4,
            background:"linear-gradient(90deg, rgba(58,42,28,0) 0%, rgba(58,42,28,0.16) 38%, rgba(40,28,16,0.34) 50%, rgba(58,42,28,0.16) 62%, rgba(58,42,28,0) 100%)"}}/>}
        </div>

        {/* a soft page-curl highlight near the spine on each page, sells the curve */}
        {!mobile && !single && <div style={{position:"absolute", left:"50%", top:16, bottom:16, width:60, transform:"translateX(-50%)", pointerEvents:"none", zIndex:5,
          background:"linear-gradient(90deg, transparent, rgba(255,250,235,0.18) 44%, transparent 50%, rgba(255,250,235,0.18) 56%, transparent)"}}/>}

        {tableScene && <div style={{position:"absolute", inset:0, pointerEvents:"none", borderRadius:3, background:"radial-gradient(80% 70% at 50% 30%, rgba(248,242,224,0.14), transparent 72%)", zIndex:8, mixBlendMode:"soft-light"}}/>}
      </div>

      {/* ── always-visible top bar: where you are + quick jump ── */}
      <div style={{position:"fixed", top:0, left:0, right:0, zIndex:25, display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
        background:"linear-gradient(180deg, rgba(26,18,11,0.92), rgba(26,18,11,0.0))", pointerEvents:"none"}}>
        <button onClick={()=>setNavOpen(o=>!o)} aria-label="jump to a page" style={{pointerEvents:"auto", display:"flex", alignItems:"center", gap:7, background:"rgba(40,30,18,0.85)", color:"#e8d9b8", border:"1px solid #6a5436", borderRadius:8, fontFamily:DISPLAY, fontStyle:"italic", fontSize:13, padding:"7px 13px", cursor:"pointer", backdropFilter:"blur(4px)"}}>
          <span style={{fontSize:15, lineHeight:1}}>☰</span> jump
        </button>
        <div style={{pointerEvents:"none", display:"flex", alignItems:"center", gap:8, color:"#d8c9a8"}}>
          <span style={{width:10, height:10, borderRadius:2, background: curSec?curSec.ribbon:"#9c8a6e", display:"inline-block"}}/>
          <span style={{fontFamily:DISPLAY, fontSize:14}}>{isIndex ? "the index" : (curSec?curSec.title:"")}</span>
          {curIdx>=0 && <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:"#9a8a6e"}}>· {curIdx+1} of {SECTIONS.length}</span>}
        </div>
      </div>

      {/* ── the quick-jump menu (labeled, tap to go straight there) ── */}
      {navOpen && <>
        <div onClick={()=>setNavOpen(false)} style={{position:"fixed", inset:0, zIndex:29, background:"rgba(16,10,5,0.55)", backdropFilter:"blur(2px)"}}/>
        <div style={{position:"fixed", top:54, left:14, zIndex:30, width:"min(86vw, 320px)", background:"#efe3c6", border:"1px solid "+C.cover, borderRadius:10, boxShadow:"0 20px 50px rgba(0,0,0,0.5)", overflow:"hidden"}}>
          <div style={{padding:"11px 14px 7px", fontFamily:DISPLAY, fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.inkFaint, borderBottom:"1px solid "+C.ruleSoft}}>jump to any page</div>
          <div onClick={()=>{turnTo("index"); setNavOpen(false);}} style={navRow(isIndex)}>
            <span style={{width:11, height:11, borderRadius:2, background:"#9c8a6e", flexShrink:0}}/>
            <span style={{flex:1, fontFamily:DISPLAY, fontSize:15, color:C.ink}}>the index</span>
            {isIndex && <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.sanguine}}>here</span>}
          </div>
          {SECTIONS.map(sec=>{const on=sec.key===section;
            return <div key={sec.key} onClick={()=>{turnTo(sec.key); setNavOpen(false);}} style={navRow(on)}>
              <span style={{width:11, height:11, borderRadius:2, background:sec.ribbon, flexShrink:0, marginTop:3}}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:DISPLAY, fontSize:15, color:C.ink}}>{sec.title}</div>
                <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint}}>{sec.sub}</div>
              </div>
              {!sec.voice && <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:C.inkFaint, marginTop:3}}>tool</span>}
              {on && <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.sanguine, marginTop:3}}>here</span>}
            </div>;
          })}
        </div>
      </>}

      {/* ── prev / next stepping (keeps the page-turn feel) ── */}
      {!isIndex && prevKey && <button onClick={()=>turnTo(prevKey)} aria-label="previous page" className="stepnav" style={stepNav("left", mobile)}>‹</button>}
      {!isIndex && nextKey && <button onClick={()=>turnTo(nextKey)} aria-label="next page" className="stepnav" style={stepNav("right", mobile)}>›</button>}

      {/* ── shelf return (top-left, the Alchemate home) ── */}
      <button onClick={backToShelf} className="scenebtn" aria-label="back to the bookshelf"
        style={{position:"fixed", top:14, left:14, zIndex:21, display:"flex", alignItems:"center", gap:7, background:"rgba(30,22,14,0.82)", color:"#e7cd8e", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"7px 13px 7px 10px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>
        <AlchemateMark size={15}/> the shelf
      </button>

      {/* ── scene toggle + index return ── */}
      <button onClick={()=>setScene(scene==="table"?"held":"table")} className="scenebtn"
        style={{position:"fixed", bottom:18, right:18, zIndex:20, background:"rgba(30,22,14,0.8)", color:"#d8c9a8", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"8px 14px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>
        {scene==="table" ? "take it up ✦" : "set it down ✦"}
      </button>
      {!isIndex && <button onClick={()=>turnTo("index")} className="scenebtn" style={{position:"fixed", bottom:18, left:18, zIndex:20, background:"rgba(30,22,14,0.8)", color:"#d8c9a8", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"8px 14px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>✦ index</button>}

      <style>{"@media (prefers-reduced-motion: reduce){ *{transition:none !important; animation:none !important;} } .ribbon:hover{ filter:brightness(1.12); } .ribbon:focus-visible,.scenebtn:focus-visible,.stepnav:focus-visible,.openbtn:focus-visible{ outline:2px solid "+C.candle+"; outline-offset:2px; } .stepnav:hover{ background:rgba(40,30,18,0.92) !important; } select,input,button{ outline-color:"+C.sanguine+"; } h1,h2,h3{ text-shadow:0 0 0.4px rgba(42,32,23,0.25); } p,span,div{ -webkit-font-smoothing:auto; } @keyframes bookOpen{ 0%{ transform:perspective(2200px) rotateX(3deg) rotateY(-26deg) scale(0.82); opacity:0.3;} 60%{ opacity:1;} 100%{ transform:perspective(2200px) rotateX(3deg) rotateY(0) scale(1);} } .bookopen{ animation:bookOpen 0.7s cubic-bezier(.4,.1,.2,1);} @keyframes idleFloat{ 0%,100%{ filter:drop-shadow(0 30px 50px rgba(0,0,0,0.5));} 50%{ filter:drop-shadow(0 38px 60px rgba(0,0,0,0.55));} } .openbtn:hover{ filter:brightness(1.06); transform:translateY(-1px);} .openbtn{ transition:all .2s;}"}</style>
    </div>
  );
}
function navRow(on){
  return { display:"flex", alignItems:"center", gap:11, padding:"11px 14px", cursor:"pointer", borderBottom:"1px solid "+C.ruleSoft, background:on?"rgba(156,74,60,0.10)":"transparent" };
}
function stepNav(side, mobile){
  return { position:"fixed", [side]:mobile?6:18, top:"50%", transform:"translateY(-50%)", zIndex:18,
    width:mobile?34:42, height:mobile?52:64, borderRadius:10, border:"1px solid #5a4330",
    background:"rgba(30,22,14,0.6)", color:"#d8c9a8", fontFamily:DISPLAY, fontSize:24, cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(3px)" };
}

// ── botanical desk objects, drawn in the same ink-on-paper hand as the pressed specimens ──
function Sprig({ size=70, color="#6f7a4a", tilt=0, opacity=0.8 }){
  return <svg viewBox="0 0 60 90" width={size} height={size*1.5} style={{display:"block", transform:`rotate(${tilt}deg)`, opacity}} aria-hidden="true">
    <path d="M30 88 C30 70 30 50 31 30 C31 18 29 10 27 4" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    {[68,58,48,38,28,20].map((y,i)=>{const left=i%2===0; const x=31; const dx=left?-14:14;
      return <path key={i} d={`M${x} ${y} C${x+dx*0.5} ${y-2} ${x+dx} ${y-6} ${x+dx} ${y-12} C${x+dx*0.6} ${y-10} ${x+dx*0.3} ${y-6} ${x} ${y}`} fill={color} opacity="0.55" stroke={color} strokeWidth="0.8"/>;})}
  </svg>;
}
function PottedHerb({ size=78, opacity=0.85 }){
  return <svg viewBox="0 0 80 100" width={size} height={size*1.25} style={{display:"block"}} aria-hidden="true">
    {/* leaves */}
    <g fill="#67733f" opacity="0.7" stroke="#4f5a30" strokeWidth="0.8">
      <path d="M40 52 C30 40 26 26 30 12 C36 24 42 36 42 52"/>
      <path d="M40 54 C50 40 56 28 53 14 C46 26 42 38 42 54"/>
      <path d="M40 55 C28 48 18 42 14 30 C26 36 36 42 42 55"/>
      <path d="M40 55 C52 48 62 42 66 30 C54 36 46 42 42 55"/>
      <path d="M40 56 C40 42 40 30 40 16 C40 32 41 44 42 56" opacity="0.85"/>
    </g>
    {/* terracotta pot */}
    <path d="M24 58 L56 58 L52 86 L28 86 Z" fill="#9c6b44" stroke="#73492b" strokeWidth="1.2"/>
    <rect x="22" y="54" width="36" height="7" rx="1.5" fill="#ab774d" stroke="#73492b" strokeWidth="1.2"/>
    <path d="M28 86 L52 86" stroke="#5e3a22" strokeWidth="1" opacity="0.5"/>
  </svg>;
}
function Vine({ height=200, color="#6f7a4a", opacity=0.6, flip=false }){
  return <svg viewBox="0 0 50 220" width={height*0.23} height={height} style={{display:"block", transform:flip?"scaleX(-1)":"none", opacity}} aria-hidden="true">
    <path d="M25 0 C14 30 34 56 22 86 C12 112 32 138 22 168 C16 190 26 206 24 220" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {[18,44,74,100,130,158,188].map((y,i)=>{const left=i%2===0;
      return <g key={i}><path d={`M${left?24:22} ${y} C${left?10:36} ${y-3} ${left?4:42} ${y-12} ${left?8:38} ${y-20} C${left?16:30} ${y-14} ${left?22:24} ${y-6} ${left?24:22} ${y}`} fill={color} opacity="0.5" stroke={color} strokeWidth="0.7"/></g>;})}
  </svg>;
}
function Leaf({ size=34, color="#747d4c", tilt=0, opacity=0.55 }){
  return <svg viewBox="0 0 40 24" width={size} height={size*0.6} style={{display:"block", transform:`rotate(${tilt}deg)`, opacity}} aria-hidden="true">
    <path d="M2 12 C12 2 28 2 38 12 C28 22 12 22 2 12 Z" fill={color} stroke="#525c33" strokeWidth="0.8"/>
    <path d="M4 12 L36 12" stroke="#525c33" strokeWidth="0.7" opacity="0.6"/>
  </svg>;
}
/* a large floor fern in a glazed urn — a statement plant for the study corners */
function TallFern({ height=320, color="#5e6c3a", opacity=0.85, flip=false }){
  // arcing fronds radiating from the pot
  const fronds=[-62,-44,-26,-8,8,26,44,62];
  return <svg viewBox="0 0 160 260" width={height*0.62} height={height} style={{display:"block", transform:flip?"scaleX(-1)":"none", opacity}} aria-hidden="true">
    {fronds.map((a,i)=>{
      const rad=a*Math.PI/180, len=92+ (i%3)*16;
      const tipx=80+Math.sin(rad)*len, tipy=150-Math.cos(rad)*len;
      const cx=80+Math.sin(rad)*len*0.5 - Math.cos(rad)*16, cy=150-Math.cos(rad)*len*0.5 - Math.sin(rad)*16;
      return <g key={i}>
        <path d={`M80 152 Q${cx} ${cy} ${tipx} ${tipy}`} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
        {/* leaflets along the frond */}
        {Array.from({length:7}).map((_,j)=>{const t=(j+1)/8;
          const px=80+(tipx-80)*t + (cx-80)*0.3*(1-Math.abs(0.5-t)*2);
          const py=152+(tipy-152)*t + (cy-152)*0.3*(1-Math.abs(0.5-t)*2);
          return <ellipse key={j} cx={px} cy={py} rx="6" ry="2.6" fill={color} opacity="0.7" transform={`rotate(${a+ (a>0?40:-40)} ${px} ${py})`}/>;})}
      </g>;
    })}
    {/* glazed urn */}
    <path d="M54 150 q-8 4 -6 16 l6 60 q2 14 26 14 t26 -14 l6 -60 q2 -12 -6 -16 Z" fill="#4a6360" stroke="#2c3c3a" strokeWidth="2"/>
    <ellipse cx="80" cy="152" rx="28" ry="8" fill="#3a4f4d" stroke="#2c3c3a" strokeWidth="2"/>
    <path d="M62 175 q18 6 36 0" fill="none" stroke="#2c3c3a" strokeWidth="1" opacity="0.5"/>
  </svg>;
}
/* a bundle of herbs hung to dry, head-down from a beam */
function HangingBundle({ size=120, color="#7a6a3a", opacity=0.8 }){
  return <svg viewBox="0 0 70 150" width={size*0.47} height={size} style={{display:"block", opacity}} aria-hidden="true">
    {/* twine + peg */}
    <line x1="35" y1="0" x2="35" y2="34" stroke="#5a4a30" strokeWidth="1.5"/>
    <rect x="30" y="30" width="10" height="8" rx="2" fill="#6a5536"/>
    {/* stems fanning down */}
    {[-22,-13,-4,5,14,23].map((a,i)=>{
      const rad=a*Math.PI/180, x2=35+Math.sin(rad)*90, y2=38+Math.cos(rad)*100;
      return <g key={i}>
        <path d={`M35 38 Q${35+Math.sin(rad)*30} ${90} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="1.6"/>
        {/* dried flower head at the tip */}
        <circle cx={x2} cy={y2} r="4" fill={i%2?"#9c8a4a":"#8a5a4a"} opacity="0.75"/>
        {Array.from({length:5}).map((_,j)=><ellipse key={j} cx={x2} cy={y2} rx="5.5" ry="1.8" fill={color} opacity="0.5" transform={`rotate(${j*36} ${x2} ${y2})`}/>)}
      </g>;
    })}
  </svg>;
}

function SceneBg({ tableScene }){
  if(!tableScene) return <div style={{position:"absolute", inset:0, background:"radial-gradient(circle at 50% 40%, transparent, rgba(0,0,0,0.5))"}} aria-hidden="true"/>;
  return <div style={{position:"absolute", inset:0, overflow:"hidden"}} aria-hidden="true">
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}}><defs><filter id="wd"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.06" numOctaves="3"/><feColorMatrix type="matrix" values="0 0 0 0 0.28 0 0 0 0 0.20 0 0 0 0 0.12 0 0 0 0.5 0"/></filter></defs><rect width="100%" height="100%" filter="url(#wd)" opacity="0.5"/></svg>
    {/* an even daylight wash across the table, soft and ambient */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(90% 80% at 50% 30%, rgba(228,214,180,0.16), transparent 70%)"}}/>

    {/* ── a working herbalist's bench: pots, vines, loose leaves around the edges ── */}
    {/* left side: candle + a potted herb beside it */}
    <div style={{position:"absolute", left:"7%", top:"22%", opacity:0.85}}>
      <div style={{width:13, height:42, background:"linear-gradient("+C.paperHi+",#d8c8a3)", borderRadius:3, margin:"0 auto", boxShadow:"0 6px 12px rgba(0,0,0,0.3)"}}/>
      <div style={{position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)", width:11, height:18, background:"radial-gradient(circle at 50% 70%, "+C.candle+", #c4762a 60%, transparent 72%)", borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%", filter:"blur(1px)", opacity:0.8}}/>
    </div>
    <div style={{position:"absolute", left:"4%", bottom:"12%"}}><PottedHerb size={92}/></div>
    {/* a vine trailing down the far left edge */}
    <div style={{position:"absolute", left:"-1%", top:"6%"}}><Vine height={230} opacity={0.5}/></div>

    {/* right side: pressed specimens, a sprig laid across the corner, a small pot */}
    <div style={{position:"absolute", right:"8%", bottom:"16%", transform:"rotate(18deg)", opacity:0.8}}><Pressed id={236776} size={58}/></div>
    <div style={{position:"absolute", right:"17%", bottom:"9%", transform:"rotate(-12deg)", opacity:0.62}}><Pressed id={236780} size={46}/></div>
    <div style={{position:"absolute", right:"3%", top:"14%"}}><Sprig size={84} tilt={26} opacity={0.7}/></div>
    <div style={{position:"absolute", right:"-1%", top:"40%"}}><Vine height={200} flip opacity={0.45}/></div>

    {/* a few loose leaves scattered across the surface */}
    <div style={{position:"absolute", left:"30%", bottom:"7%"}}><Leaf size={38} tilt={-18}/></div>
    <div style={{position:"absolute", left:"42%", top:"10%"}}><Leaf size={28} tilt={32} opacity={0.4}/></div>
    <div style={{position:"absolute", right:"30%", top:"16%"}}><Leaf size={32} tilt={-40} opacity={0.45}/></div>
    <div style={{position:"absolute", left:"20%", top:"40%"}}><Leaf size={24} tilt={12} opacity={0.35}/></div>

    <div style={{position:"absolute", inset:0, background:"radial-gradient(70% 60% at 50% 42%, transparent, rgba(0,0,0,0.55))"}}/>
  </div>;
}
/* warm reading-room ambiance behind the bookshelf */
function ShelfBg(){
  const vh = (typeof window!=="undefined" && window.innerHeight) ? window.innerHeight : 800;
  return <div style={{position:"absolute", inset:0, overflow:"hidden"}} aria-hidden="true">
    {/* deep back wall: warm plaster, vignetted */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(120% 90% at 50% 8%, #3a2c1b 0%, #271c10 45%, #150e07 100%)"}}/>
    {/* faint vertical wood paneling on the back wall */}
    <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.5}}>
      <defs>
        <filter id="plaster"><feTurbulence type="fractalNoise" baseFrequency="0.015 0.04" numOctaves="3" seed="6"/><feColorMatrix type="matrix" values="0 0 0 0 0.18 0 0 0 0 0.12 0 0 0 0 0.07 0 0 0 0.5 0"/></filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#plaster)" opacity="0.5"/>
      {/* panel seams */}
      {Array.from({length:7}).map((_,i)=>(<line key={i} x1={`${8+i*14}%`} y1="0" x2={`${8+i*14}%`} y2="100%" stroke="#000" strokeWidth="1.5" opacity="0.16"/>))}
    </svg>

    {/* ── tall arched window, upper right, with cool night light ── */}
    <svg style={{position:"absolute", right:"6%", top:"6%", width:"clamp(120px,18vw,230px)", height:"clamp(180px,30vh,360px)", opacity:0.9}} viewBox="0 0 120 200" preserveAspectRatio="xMidYMin meet">
      <defs>
        <linearGradient id="nightpane" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a3a52"/><stop offset="0.6" stopColor="#1c2a40"/><stop offset="1" stopColor="#141d2e"/></linearGradient>
        <radialGradient id="moon" cx="0.7" cy="0.25" r="0.3"><stop offset="0" stopColor="#cdd9ea" stopOpacity="0.9"/><stop offset="1" stopColor="#cdd9ea" stopOpacity="0"/></radialGradient>
      </defs>
      {/* stone surround */}
      <path d="M6 196 V60 a54 54 0 0 1 108 0 V196 Z" fill="#1a130b" stroke="#3a2c1c" strokeWidth="5"/>
      {/* panes */}
      <path d="M14 192 V60 a46 46 0 0 1 92 0 V192 Z" fill="url(#nightpane)"/>
      <circle cx="78" cy="66" r="30" fill="url(#moon)"/>
      <circle cx="80" cy="60" r="11" fill="#dde6f2" opacity="0.85"/>
      {/* muntins */}
      <g stroke="#0f0a06" strokeWidth="3" opacity="0.85">
        <line x1="60" y1="14" x2="60" y2="192"/><line x1="14" y1="86" x2="106" y2="86"/><line x1="20" y1="140" x2="100" y2="140"/>
        <path d="M14 60 a46 46 0 0 1 92 0" fill="none"/>
      </g>
    </svg>
    {/* cool light spilling from the window onto the scene */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(40% 50% at 80% 18%, rgba(160,185,220,0.12), transparent 60%)"}}/>

    {/* ── a tall cabinet of bottles behind, left side, slightly out of focus ── */}
    <div style={{position:"absolute", left:"3%", top:"14%", width:"clamp(90px,13vw,170px)", height:"clamp(170px,40vh,380px)", filter:"blur(1.2px)", opacity:0.7}}>
      <div style={{position:"absolute", inset:0, background:"linear-gradient(180deg,#3a2a1a,#241910)", borderRadius:4, border:"2px solid #1a120a"}}/>
      {/* three shelves of little bottles */}
      {[18,46,74].map((ty,si)=>(
        <div key={si} style={{position:"absolute", left:"8%", right:"8%", top:ty+"%", height:"3%", background:"#1a120a"}}/>
      ))}
      {[[14,8],[30,7],[48,9],[66,7],[80,8], [12,36],[34,35],[56,37],[76,36], [20,64],[44,63],[70,65]].map(([lx,ty],i)=>{
        const cols=["#6b7d4e","#9c4a3c","#46627a","#7d6a9c","#c19a45"]; const c=cols[i%cols.length];
        return <div key={i} style={{position:"absolute", left:lx+"%", top:ty+"%", width:7, height:`${10+ (i%4)*3}%`, background:`linear-gradient(180deg, ${c}, rgba(0,0,0,0.4))`, borderRadius:"2px 2px 1px 1px", opacity:0.85}}/>;
      })}
    </div>

    {/* ── a hanging lamp above, the warm key light ── */}
    <svg style={{position:"absolute", left:"50%", top:"-2%", transform:"translateX(-50%)", width:"clamp(60px,8vw,110px)", height:"clamp(70px,12vh,150px)", opacity:0.92}} viewBox="0 0 80 110">
      <line x1="40" y1="0" x2="40" y2="34" stroke="#2a1d12" strokeWidth="2.5"/>
      <path d="M22 34 H58 L50 58 a16 10 0 0 1 -28 0 Z" fill="#3a2a1a" stroke="#1a120a" strokeWidth="2"/>
      <ellipse cx="40" cy="58" rx="14" ry="6" fill="#f3c87a" opacity="0.9"/>
      <circle cx="40" cy="60" r="5" fill="#fff0cc"/>
    </svg>
    {/* the lamp's warm pool of light over the shelf */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(46% 42% at 50% 30%, rgba(243,200,122,0.26), rgba(243,200,122,0.05) 55%, transparent 72%)"}}/>

    {/* ── alembic + retort silhouettes on a near surface, lower left ── */}
    <svg style={{position:"absolute", left:"8%", bottom:"2%", width:"clamp(70px,11vw,150px)", height:"clamp(80px,16vh,180px)", opacity:0.8}} viewBox="0 0 100 110">
      <defs><linearGradient id="glassg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a6a55" stopOpacity="0.5"/><stop offset="1" stopColor="#2a2218" stopOpacity="0.8"/></linearGradient></defs>
      {/* round-bottom flask */}
      <path d="M30 18 h10 v20 a22 22 0 1 1 -10 0 V18 Z" fill="url(#glassg)" stroke="#1a140c" strokeWidth="1.5"/>
      <ellipse cx="35" cy="74" rx="14" ry="10" fill="#6b7d4e" opacity="0.4"/>
      {/* tall retort with curved neck */}
      <path d="M64 96 a18 18 0 1 1 18 -2 q10 -6 16 -2" fill="url(#glassg)" stroke="#1a140c" strokeWidth="1.5"/>
      <ellipse cx="70" cy="92" rx="13" ry="9" fill="#9c4a3c" opacity="0.4"/>
    </svg>
    {/* candle, lower right, with its own small glow */}
    <div style={{position:"absolute", right:"12%", bottom:"6%", opacity:0.85}}>
      <div style={{width:9, height:"clamp(30px,6vh,56px)", background:"linear-gradient(#e7d9bb,#bda77f)", borderRadius:2, margin:"0 auto", boxShadow:"0 6px 12px rgba(0,0,0,0.4)"}}/>
      <div style={{position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", width:9, height:15, background:"radial-gradient(circle at 50% 70%, #ffe7a0, #f3a83a 55%, transparent 72%)", borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%", filter:"blur(0.6px)"}}/>
    </div>
    <div style={{position:"absolute", right:"8%", bottom:"4%", width:120, height:120, background:"radial-gradient(circle, rgba(243,168,58,0.18), transparent 65%)"}}/>

    {/* drifting dust motes in the lamp light */}
    {Array.from({length:14}).map((_,i)=>{const x=20+((i*53)%60), y=14+((i*37)%62); const s=1.5+((i*7)%4);
      return <div key={i} style={{position:"absolute", left:x+"%", top:y+"%", width:s, height:s, borderRadius:"50%", background:"rgba(243,210,150,0.55)", filter:"blur(0.6px)"}}/>;})}

    {/* ── large plants & specimens filling the room ── */}
    {/* big floor fern, lower-left corner, in front of the bottle cabinet */}
    <div style={{position:"absolute", left:"-2%", bottom:"-4%", opacity:0.9}}><TallFern height={Math.min(380,vh*0.52)}/></div>
    {/* a second tall plant on the right, behind the candle */}
    <div style={{position:"absolute", right:"-3%", bottom:"-3%", opacity:0.82}}><TallFern height={Math.min(340,vh*0.46)} color="#566a3c" flip/></div>
    {/* trailing vines down both upper edges */}
    <div style={{position:"absolute", left:"1%", top:"-2%"}}><Vine height={Math.min(300,vh*0.4)} opacity={0.5}/></div>
    <div style={{position:"absolute", right:"22%", top:"-2%"}}><Vine height={Math.min(240,vh*0.32)} flip opacity={0.4}/></div>
    {/* bundles of herbs hung to dry from the top beam */}
    <div style={{position:"absolute", left:"32%", top:"-1%", opacity:0.78}}><HangingBundle size={Math.min(150,vh*0.2)}/></div>
    <div style={{position:"absolute", left:"44%", top:"-1%", opacity:0.66}}><HangingBundle size={Math.min(120,vh*0.16)} color="#6a5a3a"/></div>
    {/* framed pressed specimens on the back wall, left of the window */}
    <div style={{position:"absolute", right:"30%", top:"10%", opacity:0.6, transform:"rotate(-1.5deg)"}}>
      <div style={{padding:8, background:"#2a1d12", border:"2px solid #46321f", borderRadius:2, boxShadow:"0 8px 18px rgba(0,0,0,0.5)"}}><div style={{background:C.paper, padding:6}}><Pressed id={236776} size={54}/></div></div>
    </div>
    <div style={{position:"absolute", right:"40%", top:"24%", opacity:0.5, transform:"rotate(2deg)"}}>
      <div style={{padding:7, background:"#2a1d12", border:"2px solid #46321f", borderRadius:2, boxShadow:"0 8px 18px rgba(0,0,0,0.5)"}}><div style={{background:C.paper, padding:5}}><Pressed id={236761} size={44}/></div></div>
    </div>
    {/* a potted herb on the near shelf-edge, lower center-left */}
    <div style={{position:"absolute", left:"22%", bottom:"-2%", opacity:0.8}}><PottedHerb size={Math.min(110,vh*0.15)}/></div>

    {/* final atmospheric vignette */}
    <div style={{position:"absolute", inset:0, background:"radial-gradient(85% 75% at 50% 46%, transparent, rgba(0,0,0,0.55))"}}/>
  </div>;
}
const leafBase = { flex:1, height:"100%", position:"relative", overflow:"hidden", background:C.paper };
function Gutter({ side }){
  const bg = side==="left" ? "linear-gradient(90deg, rgba(58,42,28,0.2), transparent)" : "linear-gradient(270deg, rgba(58,42,28,0.2), transparent)";
  return <div style={{position:"absolute", top:0, bottom:0, [side]:0, width:32, pointerEvents:"none", zIndex:2, background:bg}} aria-hidden="true"/>;
}
