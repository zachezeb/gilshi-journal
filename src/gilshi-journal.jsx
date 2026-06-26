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
const HERBS = [
  { id:236761, gid:236767, name:"Tranquility Bloom", latin:"Flos tranquillitatis", no:"01", role:"common potion base", tier:"common", est:8,  vel:10, color:C.sage },
  { id:236776, name:"Argentleaf",        latin:"Folium argenteum",     no:"02", role:"flask reagent",       tier:"common", est:14, vel:8,  color:C.verdigris },
  { id:236774, name:"Azeroot",           latin:"Radix azerothi",       no:"03", role:"potion base",         tier:"common", est:9,  vel:7,  color:C.verdigris },
  { id:236778, name:"Mana Lily",         latin:"Lilium manae",         no:"04", role:"inscription & potions",tier:"common", est:11, vel:8,  color:C.ink2 },
  { id:236770, name:"Sanguithorn",       latin:"Spina sanguinea",      no:"05", role:"flask reagent",       tier:"uncommon",est:22, vel:6,  color:C.sanguine },
  { id:236780, name:"Nocturnal Lotus",   latin:"Lotus nocturna",       no:"06", role:"rare flask gate · gathered by chance",tier:"premium",est:180,vel:4,color:C.lotus },
];
const HERB = id => HERBS.find(h=>h.id===id);

// motes & intermediate reagents (transmute products, not gathered herbs)
const MOTES = [
  { id:236949, name:"Mote of Light", color:C.ochre },
  { id:236950, name:"Mote of Primal Energy", color:C.verdigris },
  { id:236951, name:"Mote of Wild Magic", color:C.sage },
  { id:236952, name:"Mote of Pure Void", color:C.plum },
];

// FULL sellable catalog — the ranking engine scores every tradeable entry here.
// est/vel are realm estimates (clearly labeled in-app) until live UE data replaces them.
// ids are real where verified; placeholders resolve to real ids by name when hosted.
const PRODUCTS = [
  // ── Flasks (combat · one per secondary stat) ──
  { id:241326, gid:241327, name:"Flask of the Shattered Sun",   cat:"Flask", kind:"flask", role:"Crit flask · flagship seller",  est:420, vel:9, mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6}], tradeable:true },
  { id:241322, gid:241323, name:"Flask of the Magisters",       cat:"Flask", kind:"flask", role:"Mastery · default healer flask", est:430, vel:9, mats:[{h:236780,q:1},{h:236770,q:8},{h:236778,q:6}], tradeable:true },
  { id:241325, gid:241324, name:"Flask of the Blood Knights",   cat:"Flask", kind:"flask", role:"Haste · often top DPS flask",    est:445, vel:8, mats:[{h:236780,q:1},{h:236770,q:6},{h:236776,q:8}], tradeable:true },
  { id:241320, gid:241321, name:"Flask of Thalassian Resistance",cat:"Flask",kind:"flask", role:"Vers · the base flask",          est:300, vel:5, mats:[{h:236780,q:1},{h:236774,q:8},{h:236776,q:6}], tradeable:true },
  // ── Phials (profession stats) ──
  { id:241311, name:"Haranir Phial of Finesse",     cat:"Phial", kind:"vial",  role:"gathering · sells to farmers",   est:75,  vel:5, mats:[{h:236774,q:3},{h:236778,q:2}], tradeable:true },
  { id:241312, name:"Haranir Phial of Ingenuity",   cat:"Phial", kind:"vial",  role:"crafting · sells to crafters",   est:80,  vel:5, mats:[{h:236774,q:3},{h:236778,q:2}], tradeable:true },
  { id:241317, name:"Haranir Phial of Perception",  cat:"Phial", kind:"vial",  role:"gathering · rare-find buff",     est:85,  vel:4, mats:[{h:236774,q:3},{h:236778,q:2}], tradeable:true },
  // ── Light potions ──
  { id:241309, name:"Light's Potential",            cat:"Light Potion", kind:"potion", role:"safe stat potion · bulk seller", est:55, vel:10, mats:[{h:236761,q:8},{h:236774,q:3},{h:236776,q:3}], tradeable:true },
  { id:241296, name:"Potion of Zealotry",           cat:"Light Potion", kind:"potion", role:"Light combat variant",     est:48, vel:6, mats:[{h:236761,q:6},{h:236774,q:3}], tradeable:true },
  { id:241300, name:"Lightfused Mana Potion",       cat:"Light Potion", kind:"potion", role:"healer mana potion",       est:42, vel:8, mats:[{h:236761,q:8},{h:236778,q:3}], tradeable:true },
  { id:241305, name:"Silvermoon Health Potion",     cat:"Light Potion", kind:"potion", role:"health · off combat CD",   est:30, vel:9, mats:[{h:236761,q:6}], tradeable:true },
  { id:237055, name:"Refreshing Serum",             cat:"Light Potion", kind:"potion", role:"early utility · Stone mat", est:25, vel:4, mats:[{h:236761,q:8},{h:236770,q:3}], tradeable:true },
  // ── Void potions ──
  { id:241292, name:"Draught of Rampant Abandon",   cat:"Void Potion", kind:"potion", role:"more stats · puddle silences", est:70, vel:6, mats:[{h:236780,q:1},{h:236770,q:2}], tradeable:true },
  { id:241295, name:"Potion of Devoured Dreams",    cat:"Void Potion", kind:"potion", role:"void utility · risk/reward",   est:60, vel:4, mats:[{h:236770,q:3},{h:236778,q:2}], tradeable:true },
  { id:268954, name:"Entropic Extract",             cat:"Void Potion", kind:"potion", role:"early void leveling potion",   est:22, vel:3, mats:[{h:236761,q:3}], tradeable:true },
  // ── Reagents / transmute products ──
  { id:237200, name:"Wondrous Synergist",           cat:"Reagent", kind:"vial", role:"daily · value unproven",      est:260, vel:2, mats:[{h:236780,q:1},{h:236776,q:5}], cooldown:"18h", tradeable:true },
  { id:237201, name:"Composite Flora",              cat:"Reagent", kind:"vial", role:"crafted reagent · feeds recipes", est:40, vel:5, mats:[{h:236761,q:6},{h:236776,q:4}], tradeable:true },
  // ── Bound · never sold (listed, flagged) ──
  { id:237300, name:"Cauldron of Sin'dorei Flasks", cat:"Cauldron", kind:"cauldron", role:"raid utility · bound", est:null, vel:0, mats:[{h:236780,q:8},{h:236770,q:20},{h:236776,q:20}], tradeable:false },
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
    const saleSilver = price(h.id) ?? h.est ?? 0;
    const saleGold = h.gid ? (price(h.gid) ?? null) : null;
    return { id:h.id, item:h, price:saleSilver, saleSilver, saleGold, vel:h.vel??0, score:saleSilver };
  }).sort((a,b)=> b.score-a.score || b.vel-a.vel );
  return scored.map((s,i)=>({ ...s, rank:i+1, grade:gradeFor(i,scored.length), why:HERB_NOTE[s.id]||s.item.role }));
}

// UE's commodity feed returns ONE price per item — the market sell price in gold.

// returns tradeable craftables with BOTH qualities' market prices.
//   saleSilver = baseline quality price   saleGold = best-materials quality price
// Ranked by the silver (baseline) price. Gold shown alongside where it exists.
function rankCraft(price){
  const sellable = PRODUCTS.filter(p=>p.tradeable);
  const scored = sellable.map(prod=>{
    const saleSilver = price(prod.id) ?? prod.est ?? 0;
    const saleGold = prod.gid ? (price(prod.gid) ?? null) : null;
    const herbCost = (prod.mats||[]).reduce((s,m)=>{ const h=HERB(m.h); return s + (h?((price(h.id)??h.est??0)*m.q):0); },0);
    return { id:prod.id, item:prod, sale:saleSilver, saleSilver, saleGold, herbCost,
             marginGathered:saleSilver, marginBuy:saleSilver-herbCost, margin:saleSilver,
             vel:prod.vel??0, score:saleSilver };
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

const ACHIEVEMENTS = [
  {name:"First Harvest",req:"gather all 34 variants",reward:"34 KP",type:"Knowledge",note:"front-loaded · do it early"},
  {name:"Lotus Hunter",req:"gather 1,000 lotus",reward:"the gathering mount",type:"Mount",note:"the premium-herb grind"},
  {name:"Abundant Offerings",req:"20,000 event points",reward:"≈4,000g & currency",type:"Gold",note:"the Abundance meta · early weeks"},
  {name:"Sin'dorei Alchemist",req:"craft 5 flasks",reward:"flask recipes",type:"Recipe",note:"by deed, not chance · account-wide"},
  {name:"Master of the Cauldron",req:"craft the cauldron ×10",reward:"a milestone",type:"Recipe",note:"the cauldron is bound · guild glory"},
  {name:"Dye Artisan",req:"craft 25 dyes",reward:"the dye market",type:"Decor",note:"shared with scribes · steady coin"},
  {name:"Themed Decorator",req:"craft 10 decor",reward:"lab-theme set",type:"Decor",note:"tradable · needs Lumber"},
];
const COLLECTIONS = {
  Mounts:[
    {name:"Gathering Mount",source:"Herbalism meta",note:"the marquee cosmetic"},
    {name:"Abundance Loa Mount",source:"event & Amani rep",note:"a long, prestige grind"},
  ],
  Decor:[
    {name:"Ritual Basin",source:"alchemy decor",note:"a lab centerpiece · tradable"},
    {name:"Glowing Vial Cluster",source:"alchemy decor",note:"accent lighting · placed in sets"},
    {name:"Sin'dorei Cauldron (decor)",source:"alchemy decor",note:"a theme piece"},
    {name:"Dye Set",source:"alchemy & inscription",note:"always-needed repeat-buy"},
  ],
  Toys:[{name:"Dundun's Travel Method",source:"Chel the Chip",note:"saves hours on the grind"}],
};

const ZONES = [
  {name:"Eversong Woods",difficulty:"gentle",mote:"Mote of Light",color:C.ochre,notes:"even ground, few foes · follow the rivers, where nodes gather thickest",
   nodes:[[20,30],[35,25],[50,35],[65,28],[78,40],[70,58],[55,65],[40,60],[28,52],[22,42]],river:[[15,48],[35,50],[55,55],[75,50],[88,58]]},
  {name:"Zul'Aman",difficulty:"trying",mote:"Mote of Wild Magic",color:C.sanguine,notes:"crowded · carry Deftness or be interrupted · richest in Argentleaf & Azeroot",
   nodes:[[25,35],[42,30],[58,38],[72,32],[80,48],[68,60],[50,68],[32,62],[20,50]],river:[]},
  {name:"Harandar",difficulty:"severe",mote:"Mote of Primal Energy",color:C.verdigris,notes:"vertical thicket, dense with foes · four treasures wait here",
   nodes:[[30,22],[50,18],[68,25],[78,42],[72,60],[55,70],[38,66],[25,50],[42,45],[60,48]],river:[]},
  {name:"Voidstorm",difficulty:"harsh",mote:"Mote of Pure Void",color:C.plum,notes:"a hostile maze · the sole Pure Void source · bring all the Deftness you can",
   nodes:[[22,40],[38,28],[55,32],[70,26],[82,44],[74,62],[58,70],[40,64],[28,55]],river:[]},
];

const DEFAULT_CHAR = { name:"Gilshi", realm:"Moon Guard", faction:"Alliance", race:"Pandaren", class:"Death Knight", herbSkill:100, herbMax:100, alchSkill:100, alchMax:100, herbKP:0, alchKP:0 };

async function fetchPrices(realm){
  // Calls our own serverless proxy (/api/prices), which talks to Undermine
  // Exchange server-side. Returns { itemId: goldPrice } for whatever UE has;
  // missing ids fall back to each item's labeled estimate in the app.
  const allIds=[...HERBS,...PRODUCTS].flatMap(i=>[i.id, i.gid].filter(Boolean));
  const ids=[...new Set(allIds)].join(",");
  const region=CONFIG.ue.region||"us";
  try{
    const r=await fetch("/api/prices?region="+region+"&realm="+encodeURIComponent(realm)+"&ids="+ids);
    if(!r.ok) return null;
    const d=await r.json();
    // normalize keys to strings so price(id) lookups match
    const out={}; for(const k in d){ if(d[k]!=null) out[String(k)]=d[k]; }
    return out;
  }catch{return null;}
}
const fmtG = n => n==null?"-":n>=1000?`${(n/1000).toFixed(1)}k`:Math.round(n).toLocaleString();

/* ════════════════════════════════════════════════════════════════
   ILLUSTRATIONS — the interface is drawn
   ════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════
   SPECIALIZATION TREES — verified structure, Midnight (12.0.x)
   Point thresholds and branch names are confirmed; exact per-point
   stat values are mostly unpublished, so effects are described by
   their known milestones with honest notes where precision is unknown.
   ════════════════════════════════════════════════════════════════ */
const SPEC_TREES = {
  herb: {
    label:"Herbalism", accent:C.verdigris, cap:90,
    branches:[
      { key:"botany", name:"Botany", color:C.verdigris, max:40,
        gist:"quality of life. mounted gathering at 40 — the first thing a non-druid needs.",
        milestones:[[10,"unlocks a sub-spec (Mulching / Cultivation)"],[40,"mounted herb gathering · +Finesse, +Deftness along the way"]],
        per:"Finesse", perRate:0.9, // approx Finesse per point along the trunk (estimate)
        note:"the 40-point payoff (mounted gathering) is the value; the trickle of Finesse is a bonus, not the reason." },
      { key:"bountiful", name:"Bountiful Harvests", color:C.ochreDeep, max:40,
        gist:"pure yield. +1 minimum and +1 maximum herb per node at 40, plus skill for gold-quality.",
        milestones:[[20,"per-herb sub-spec: ~15–20% Finesse proc for bonus herbs"],[40,"+1 min & +1 max yield per gather · extra skill on all herbs"]],
        per:"yield", perRate:0.025, // +1 min/+1 max ≈ modeled as +0.05 herb/gather at 40 → ~0.025/pt avg shown as yield index
        note:"the strongest gold tree once you can gather mounted. target the herb selling highest on your realm." },
      { key:"overload", name:"Midnight Overload", color:C.plum, max:40,
        gist:"infused-node farming. a second Overload charge at 40. only matters if you chase elemental nodes.",
        milestones:[[1,"root: passive Overload cooldown reduction (free)"],[40,"second Overload charge · Lightfused & Voidbound double their motes"]],
        per:"motes", perRate:0.6,
        note:"heavy point cost for a benefit that only applies to rare infused nodes — last priority for most." },
    ],
  },
  alch: {
    label:"Alchemy", accent:C.ochreDeep, cap:90,
    branches:[
      { key:"flasks", name:"Fluent in Flasks", color:C.sanguine, max:50,
        gist:"the flask tree. the base Thalassian flask is taught here; crafting it 10× reveals the other three.",
        milestones:[[1,"learn Flask of Thalassian Resistance (the base flask)"],[30,"Cauldron of Sin'dorei Flasks (raid cauldron · warbound)"],[50,"full flask mastery · best Multicraft on flasks"]],
        per:"Multicraft", perRate:0.5,
        note:"flasks are the flagship sellers. 30 KP here unlocks the cauldron, though the cauldron itself is bound." },
      { key:"potions", name:"Potion Prowess", color:C.ink2, max:50,
        gist:"the potion tree. Light and Void potions, the bulk-volume sellers.",
        milestones:[[1,"improved potion yields"],[30,"Voidlight Potion Cauldron (bound utility)"],[50,"full potion mastery · best Multicraft on potions"]],
        per:"Multicraft", perRate:0.5,
        note:"Light's Potential is the steady bulk earner. potions carry the day-to-day coin between flask rushes." },
      { key:"transmute", name:"Transmutation Authority", color:C.verdigris, max:40,
        gist:"transmutes & reagents. turns motes into more motes, feeds cauldrons and other crafters.",
        milestones:[[1,"mote transmutes (18h shared cooldown)"],[40,"Wondrous Synergist & cross-profession reagents · best Multicraft on transmutes"]],
        per:"Multicraft", perRate:0.4,
        note:"Multicraft here means free extra motes on transmute. value depends on mote prices — watch the market." },
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
function Overview({ price, loading, live, go }){
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
      <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:C.inkFaint}}>profit when YOU gathered the herbs</span>
    </div>
    <div style={{margin:"7px 0 14px"}}>
      {craft.map((r,i)=>(
        <div key={r.id} onClick={()=>go("worth")} style={{display:"flex", gap:11, alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
          <span style={{fontFamily:DISPLAY, fontSize:16, fontStyle:"italic", color:i===0?C.sanguine:C.rule, minWidth:18}}>{i+1}</span>
          <Vial kind={r.item.kind} color={C.ochre} size={24}/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontFamily:DISPLAY, fontSize:14.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{r.item.name}</div>
            <div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint}}>{loading?"":<>silver {fmtG(r.saleSilver)}g{r.saleGold!=null?" · gold "+fmtG(r.saleGold)+"g":""}</>}</div>
          </div>
          <div style={{textAlign:"right", flexShrink:0}}>
            <div style={{fontFamily:DISPLAY, fontSize:16, color:r.marginGathered>0?C.ochreDeep:C.sanguine}}>{loading?"…":fmtG(r.marginGathered)}<span style={{fontSize:10, fontStyle:"italic"}}> g</span></div>
            <div style={{fontFamily:DISPLAY, fontSize:9, textTransform:"uppercase", letterSpacing:.5, color:C.inkFaint}}>gathered</div>
          </div>
        </div>
      ))}
    </div>

    <div style={{marginTop:"auto", display:"flex", gap:14, alignItems:"flex-start", paddingTop:10}}>
      <span style={{flexShrink:0, fontFamily:DISPLAY, fontStyle:"italic", fontSize:11, color:live?C.verdigris:C.inkFaint}}>{live?"● live prices":"by my own reckoning"}</span>
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
  return <div style={pad}>
    <Eyebrow>the herb gallery</Eyebrow>
    <Title size={26}>What the soil gives up</Title>
    <p style={{fontFamily:BODY, fontSize:13.5, lineHeight:1.75, color:C.inkSoft, margin:0}}>
      Every leaf here i pressed and drew myself, by lamplight. Beside each i keep its going rate, so a tired night never tempts me to sell the rare ones cheap. Tap any leaf to weigh it against the rest on the gathering page.
    </p>
    <Hand size={15} style={{marginTop:18}}>the rare one pays for the whole night. know it on sight.</Hand>
    <div style={{marginTop:"auto", paddingTop:16}}>
      <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, marginBottom:6}}>tonight's richest leaf</div>
      <SpecMount id={236780} price={price} loading={loading} go={go} mini/>
    </div>
  </div>;
}
function SpecRight({ price, loading, go }){
  // sorted by live price, richest first
  const order=[236780,236770,236776,236778,236774,236761]
    .map(id=>({id, p: price ? (price(id) ?? (HERB(id)?.est) ?? 0) : 0}))
    .sort((a,b)=>b.p-a.p).map(x=>x.id);
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6}}>
      <Eyebrow>by what they fetch</Eyebrow><Hand size={13} color={C.green} tilt={0}>richest first</Hand>
    </div>
    <div style={{overflowY:"auto"}}>{order.map(id=><SpecMount key={id} id={id} price={price} loading={loading} go={go}/>)}</div>
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
function SpecMount({ id, mini, price, loading, go }){
  const h=HERB(id);
  const p = price ? (price(id) ?? h.est ?? null) : null;
  return <div onClick={()=>go&&go("worth")} style={{position:"relative", padding:"6px 4px 12px", marginBottom:mini?0:2, cursor:go?"pointer":"default", borderBottom:mini?"none":"1px solid "+C.ruleSoft}}>
    <Tape w={48} rot={-7} style={{top:-5, left:14}}/>{!mini&&<Tape w={48} rot={6} style={{top:-5, right:14}}/>}
    <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>
      <div style={{flexShrink:0}}><Pressed id={id} size={mini?72:80}/></div>
      <div style={{flex:1, paddingTop:4}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8}}>
          <h3 style={{fontFamily:DISPLAY, fontSize:17, fontWeight:400, margin:0, color:C.ink, fontStyle:"italic"}}>{h.name}</h3>
          <span style={{fontFamily:DISPLAY, fontSize:17, color:C.sanguine}}>{loading?"…":(p==null?<span style={{fontSize:12, fontStyle:"italic", color:C.inkFaint}}>not sold</span>:<>{fmtG(p)}<span style={{fontSize:11, fontStyle:"italic"}}> g</span></>)}</span>
        </div>
        <div style={{fontFamily:DISPLAY, fontSize:12, fontStyle:"italic", color:C.inkFaint}}>{h.latin} · № {h.no}</div>
        <Hand size={13} style={{marginTop:5}}>{HERB_HAND[id]}</Hand>
      </div>
    </div>
  </div>;
}

/* ── WORTH (Field Notes · live ranking · numbers stay plain) ── */
function Worth({ price, loading, live }){
  const [side,setSide]=useState("herb");
  const ranked = side==="herb"?rankHerbs(price):rankCraft(price);
  return <div style={pad}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
      <Eyebrow>{side==="herb"?"what to gather · by coin":"what to make · by margin"}</Eyebrow>
      <span style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:live?C.verdigris:C.inkFaint}}>{live?"● live prices":"by my reckoning"}</span>
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
              ? <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.inkFaint}}>
                  <span>silver <span style={{color:C.sanguine, fontSize:15}}>{r.saleSilver==null?"—":fmtG(r.saleSilver)+"g"}</span></span>
                  <span> · gold {r.saleGold==null?<span style={{fontStyle:"italic", fontSize:11}}>not listed</span>:<span style={{color:C.ochreDeep, fontSize:15}}>{fmtG(r.saleGold)}g</span>}</span>
                </div>
              : <div style={{fontFamily:DISPLAY, fontSize:12.5, color:C.inkFaint}}>
                  <span>silver <span style={{color:C.sanguine, fontSize:15}}>{r.saleSilver==null?"—":fmtG(r.saleSilver)+"g"}</span></span>
                  <span> · gold {r.saleGold==null?<span style={{fontStyle:"italic", fontSize:11}}>not listed</span>:<span style={{color:C.ochreDeep, fontSize:15}}>{fmtG(r.saleGold)}g</span>}</span>
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
              <div style={{display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap"}}>
                <h3 style={{fontFamily:DISPLAY, fontSize:16, fontWeight:400, margin:0, color:C.ink}}>{r.name}</h3>
                <div style={{display:"flex", gap:5}}>{r.bound&&<Tag small color={C.plum}>bound</Tag>}{r.mc&&<Tag small color={C.verdigris}>multicrafts</Tag>}</div>
              </div>
              <div style={{fontFamily:BODY, fontSize:12.5, color:C.inkSoft, marginTop:2, lineHeight:1.5}}>{r.effect}</div>
              {hasM&&<div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:7}}>{r.mats.map((m,j)=>{const h=HERB(m.h); if(!h)return null; return <span key={j} style={{display:"inline-flex", alignItems:"center", gap:4, background:C.paperDeep, border:"1px solid "+C.ruleSoft, padding:"2px 7px 2px 3px", borderRadius:3}}><Pressed id={m.h} size={16}/><span style={{fontFamily:DISPLAY, fontSize:11, color:C.ink}}>{m.q}× {h.name.split(" ")[0]}</span><span style={{fontFamily:DISPLAY, fontSize:10, color:C.ochreDeep}}>· {loading?"…":fmtG((price(h.id)??h.est)*m.q)}g</span></span>;})}</div>}
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
  const sale=price(prod.id)??prod.est??0;
  const herbCost=(prod.mats||[]).reduce((s,m)=>{const h=HERB(m.h);return s+(h?(price(h.id)??h.est??0)*m.q:0);},0);
  const gathered=sale;            // herbs free → sell price is the profit
  const bought=sale-herbCost;     // if you bought the herbs
  return <div style={pad}>
    <Eyebrow>the scale · weigh a craft</Eyebrow>
    <Title size={22}>What it leaves in hand</Title>
    <div style={{display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap", marginBottom:14}}>
      <div><div style={{fontFamily:DISPLAY, fontSize:10.5, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>the craft</div>
        <select value={pid} onChange={e=>setPid(Number(e.target.value))} style={{background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:15, padding:"3px 0"}}>{sellable.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div><div style={{fontFamily:DISPLAY, fontSize:10.5, textTransform:"uppercase", letterSpacing:1, color:C.inkFaint, marginBottom:3}}>how many</div>
        <input type="number" min="1" value={n} onChange={e=>setN(Math.max(1,parseInt(e.target.value)||1))} style={{width:70, background:"transparent", border:"none", borderBottom:"1px solid "+C.rule, color:C.ink, fontFamily:DISPLAY, fontSize:18, padding:"2px 0"}}/>
      </div>
    </div>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:8}}>
      {[["sells for",sale,C.sanguine],["herbs cost",herbCost,C.inkSoft],["you keep",gathered,gathered>0?C.ochreDeep:C.sanguine]].map(([l,v,col],i)=>(
        <div key={i} style={{textAlign:"center", padding:"12px 4px", background:C.card, border:"1px solid "+C.ruleSoft}}>
          <div style={{fontFamily:DISPLAY, fontSize:21, color:col}}>{loading?"…":fmtG(v)}<span style={{fontSize:11, fontStyle:"italic"}}> g</span></div>
          <div style={{fontFamily:DISPLAY, fontSize:9.5, textTransform:"uppercase", letterSpacing:.4, color:C.inkFaint, marginTop:2}}>{l}</div>
        </div>
      ))}
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.inkFaint, marginBottom:14, textAlign:"center"}}>
      the herbs you gather cost you nothing, so "you keep" is the full sell price. if you bought every herb instead, you'd keep {fmtG(bought)}g.
    </div>
    <div style={{textAlign:"center", padding:"14px", background:C.paperDeep, border:"1px solid "+C.rule}}>
      <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkSoft}}>{n} of these, gathered, leaves you</div>
      <div style={{fontFamily:DISPLAY, fontSize:30, color:gathered*n>0?C.ochreDeep:C.sanguine}}>{loading?"…":fmtG(gathered*n)}<span style={{fontSize:15, fontStyle:"italic"}}> g</span></div>
    </div>
    <Hand size={13} color={C.greenDk} tilt={-0.4} style={{marginTop:14}}>before multicraft's luck, every proc on top is found coin.</Hand>
  </div>;
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
    <div style={{position:"relative", border:"1px solid "+C.rule, background:C.paperDeep, padding:8, marginBottom:10}}>
      <svg viewBox="0 0 100 90" style={{width:"100%", display:"block"}}>
        <path d={pathD+" Z"} fill="none" stroke={z.color} strokeWidth="0.5" strokeOpacity="0.45" strokeDasharray="2 2.5"/>
        {z.nodes.map((nd,i)=><circle key={i} cx={nd[0]} cy={nd[1]} r="2.2" fill={z.color} opacity="0.85"/>)}
        <circle cx={z.nodes[0][0]} cy={z.nodes[0][1]} r="3" fill="none" stroke={C.sanguine} strokeWidth="0.9"/>
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
    const capped=Math.min(v, T.cap-others); // can't exceed the KP cap
    setBuild(p=>({...p,[tree]:{...p[tree],[brk]:capped}}));
  };
  // a simple "what you're getting" index per branch, for the graph
  const bars=T.branches.map(br=>{
    const pts=b[br.key]||0;
    return { name:br.name, color:br.color, pts, max:br.max, per:br.per, value:+(pts*br.perRate).toFixed(1) };
  });
  const maxVal=Math.max(1,...bars.map(x=>x.value));
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
    <div style={{display:"flex", alignItems:"baseline", gap:8, marginBottom:12}}>
      <span style={{fontFamily:DISPLAY, fontSize:28, color:left<0?C.sanguine:T.accent}}>{spent}</span>
      <span style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkFaint}}>of {T.cap} knowledge spent · {left} left</span>
    </div>

    {/* live graph */}
    <div style={{border:"1px solid "+C.rule, background:"rgba(255,255,255,0.15)", padding:"12px 12px 8px", marginBottom:14}}>
      <div style={{fontFamily:DISPLAY, fontSize:10.5, letterSpacing:1, textTransform:"uppercase", color:C.inkFaint, marginBottom:8}}>what you're getting</div>
      {bars.map((bar,i)=>(
        <div key={i} style={{marginBottom:9}}>
          <div style={{display:"flex", justifyContent:"space-between", fontFamily:DISPLAY, fontSize:11.5, color:C.inkSoft, marginBottom:2}}>
            <span>{bar.name}</span><span style={{color:bar.color}}>{bar.value} {bar.per}{bar.pts>0?" · "+bar.pts+"pt":""}</span>
          </div>
          <div style={{height:9, background:C.paperDeep, borderRadius:1, overflow:"hidden"}}>
            <div style={{height:"100%", width:(bar.value/maxVal*100)+"%", background:bar.color, transition:"width 0.25s"}}/>
          </div>
        </div>
      ))}
      <div style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:C.inkFaint, marginTop:4}}>relative payoff index — milestones are exact, per-point rates are estimates</div>
    </div>

    {/* allocators */}
    <div style={{overflowY:"auto"}}>
      {T.branches.map(br=>{
        const pts=b[br.key]||0;
        return <div key={br.key} style={{padding:"10px 0", borderBottom:"1px solid "+C.ruleSoft}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <span style={{width:9, height:9, borderRadius:2, background:br.color, flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:DISPLAY, fontSize:15.5, color:C.ink}}>{br.name}</div>
              <div style={{fontFamily:DISPLAY, fontSize:11.5, fontStyle:"italic", color:C.inkFaint}}>{br.gist}</div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
              <button onClick={()=>set(br.key,pts-5,br.max)} style={stepBtn}>–</button>
              <span style={{fontFamily:DISPLAY, fontSize:16, color:C.ink, minWidth:46, textAlign:"center"}}>{pts}<span style={{fontSize:11, color:C.inkFaint}}>/{br.max}</span></span>
              <button onClick={()=>set(br.key,pts+5,br.max)} style={stepBtn}>+</button>
            </div>
          </div>
          {/* milestone ticks */}
          <div style={{display:"flex", gap:10, marginTop:7, flexWrap:"wrap", paddingLeft:19}}>
            {br.milestones.map(([at,desc],i)=>{const hit=pts>=at;
              return <span key={i} style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:DISPLAY, fontSize:11, color:hit?br.color:C.inkFaint, opacity:hit?1:0.7}}>
                <span style={{width:13, height:13, borderRadius:"50%", border:"1.5px solid "+(hit?br.color:C.rule), background:hit?br.color:"transparent", flexShrink:0}}/>
                <b style={{fontWeight:hit?700:400}}>{at}</b> {desc}
              </span>;
            })}
          </div>
          {pts>0 && <div style={{fontFamily:HAND, fontSize:12.5, color:C.greenDk, transform:"rotate(-0.3deg)", marginTop:6, paddingLeft:19}}>{br.note}</div>}
        </div>;
      })}
    </div>
    <div style={{fontFamily:DISPLAY, fontSize:10.5, fontStyle:"italic", color:C.inkFaint, marginTop:8}}>your build is kept while the journal is open. points step by 5; the cap is the knowledge you'll have deep into the tier.</div>
  </div>;
}
const stepBtn={ width:28, height:28, borderRadius:"50%", border:"1px solid "+C.rule, background:"rgba(255,255,255,0.3)", color:C.ink, fontFamily:DISPLAY, fontSize:17, cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" };

/* ── the ribboned sections of the book ── */
const SECTIONS = [
  { key:"overview",  ribbon:"#9c4a3c", title:"the night's plan",  voice:true },
  { key:"specimens", ribbon:"#6b7d4e", title:"the herb gallery", voice:true },
  { key:"worth",     ribbon:"#c19a45", title:"what's worth it",    voice:true },
  { key:"knowing",   ribbon:"#46627a", title:"what i've come to know", voice:true },
  { key:"planner",   ribbon:"#b06a86", title:"the spec planner",   voice:false },
  { key:"formulary", ribbon:"#7d6a9c", title:"the formulary",      voice:false },
  { key:"scale",     ribbon:"#9a7833", title:"the scale & bench",  voice:false },
  { key:"maps",      ribbon:"#5a7d5e", title:"the four grounds",   voice:false },
];

/* index page (front of book) */
function IndexPage({ go }){
  return <div style={pad}>
    <Hand size={15} color={C.green} tilt={-1} style={{marginBottom:4}}>if found, return to Gilshi — Silvermoon</Hand>
    <h1 style={{fontFamily:DISPLAY, fontSize:"clamp(26px,5vw,38px)", fontWeight:400, margin:"4px 0 2px", color:C.ink, lineHeight:1.02}}>The Field Book</h1>
    <div style={{fontFamily:DISPLAY, fontSize:13, fontStyle:"italic", color:C.inkFaint, marginBottom:18}}>kept across the soil of Midnight, by my own hand</div>
    {SECTIONS.map((s,i)=>(
      <div key={s.key} onClick={()=>go(s.key)} style={{display:"flex", gap:14, alignItems:"baseline", padding:"10px 0", borderBottom:"1px solid "+C.ruleSoft, cursor:"pointer"}}>
        <span style={{width:10, height:10, borderRadius:2, background:s.ribbon, flexShrink:0, alignSelf:"center"}}/>
        <div style={{flex:1, fontFamily:DISPLAY, fontSize:17, color:C.ink}}>{s.title}</div>
        <span style={{fontFamily:DISPLAY, fontSize:16, color:C.inkFaint}}>›</span>
      </div>
    ))}
    <div style={{position:"absolute", bottom:22, right:26, opacity:0.9}}><Tape w={36} rot={28} style={{top:8, right:24}}/><Pressed id={236761} size={66}/></div>
  </div>;
}

/* which component pair renders for a section (left leaf, right leaf) */
function spreadFor(key, ctx){
  const { price, loading, live, go, build, setBuild } = ctx;
  switch(key){
    case "overview":  return [<Overview key="ol" price={price} loading={loading} live={live} go={go}/>, <OverviewRight key="or" go={go}/>];
    case "specimens": return [<SpecLeft key="sl" price={price} loading={loading} go={go}/>, <SpecRight key="sr" price={price} loading={loading} go={go}/>];
    case "worth":     return [<Worth key="wl" price={price} loading={loading} live={live}/>, <WorthHelp key="wr"/>];
    case "knowing":   return [<Knowing key="kl"/>, <KnowingHelp key="kr"/>];
    case "formulary": return [<FormularyPage key="fl" price={price} loading={loading}/>, null];
    case "scale":     return [<ScalePage key="cl" price={price} loading={loading}/>, <BenchPage key="cr" price={price} loading={loading}/>];
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

/* ════════════ the book ════════════ */
export default function App(){
  const [section, setSection] = useState("index");
  const [scene, setScene] = useState("table");
  const [turning, setTurning] = useState(false);
  const [mobile, setMobile] = useState(typeof window!=="undefined" && window.innerWidth<820);
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState({ herb:{}, alch:{} });
  const [navOpen, setNavOpen] = useState(false);

  useEffect(()=>{
    const on=()=>setMobile(window.innerWidth<820); window.addEventListener("resize",on);
    return ()=>window.removeEventListener("resize",on);
  },[]);

  // price fetch — runs only if CONFIG.ue.enabled (live); otherwise estimates stand
  useEffect(()=>{
    let live=false;
    if(CONFIG.ue.enabled){
      setLoading(true);
      fetchPrices(CONFIG.ue.realm).then(p=>{ setPrices(p); setLoading(false); });
      live=true;
    }
  },[]);
  const price = useCallback((id)=> (prices && prices[id]!=null) ? prices[id] : null, [prices]);
  const live = CONFIG.ue.enabled && !!prices;

  const turnTo = (key)=>{ if(key===section){return;} setTurning(true); setTimeout(()=>{ setSection(key); setTurning(false); }, 500); };
  const ctx = { price, loading, live, go:turnTo, build, setBuild };
  const isIndex = section==="index";
  const curIdx = SECTIONS.findIndex(s=>s.key===section);
  const curSec = SECTIONS[curIdx] || null;
  const prevKey = curIdx>0 ? SECTIONS[curIdx-1].key : null;
  const nextKey = curIdx>=0 && curIdx<SECTIONS.length-1 ? SECTIONS[curIdx+1].key : null;
  const tableScene = scene==="table" && !mobile;
  const [leftLeaf, rightLeaf] = isIndex ? [<IndexPage key="ix" go={turnTo}/>, null] : spreadFor(section, ctx);
  // on desktop, if a section has no right leaf, center the single leaf
  const single = isIndex || rightLeaf==null;

  return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative",
      background: tableScene ? "radial-gradient(80% 70% at 50% 38%, #3a2c1c 0%, #271b11 60%, #160e07 100%)" : "radial-gradient(70% 60% at 50% 30%, #36281a, #170f08)"}}>
      <SceneBg tableScene={tableScene}/>

      <div style={{position:"relative", zIndex:5, transition:"transform 0.7s cubic-bezier(.5,.05,.2,1)",
        transform: tableScene ? "perspective(1700px) rotateX(13deg) scale(0.9)" : "perspective(2200px) rotateX(3deg) scale(1)",
        transformOrigin:"center 60%", width: mobile?"100vw":"min(94vw, 1040px)", height: mobile?"100vh":"min(90vh, 740px)", maxWidth:"100%"}}>

        {/* cover */}
        <div style={{position:"absolute", inset: mobile?0:-16, background:"linear-gradient(155deg, "+C.cover+", "+C.coverDk+")", borderRadius: mobile?0:8, boxShadow:"0 40px 90px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.45)"}}/>

        {/* ribbons (quick visual access; the labeled menu is the main nav) */}
        <div style={{position:"absolute", top: mobile?44:-16, left:0, right:0, display:"flex", justifyContent:"center", gap:mobile?9:14, zIndex:9}}>
          {SECTIONS.map(sec=>(
            <button key={sec.key} onClick={()=>turnTo(sec.key)} title={sec.title} aria-label={sec.title} className="ribbon"
              style={{width:mobile?11:13, height: section===sec.key?(mobile?40:72):(mobile?28:54), background:sec.ribbon, border:"none", cursor:"pointer", padding:0, boxShadow:"0 3px 5px rgba(0,0,0,0.3)", transition:"height 0.3s", clipPath:"polygon(0 0,100% 0,100% 86%,50% 100%,0 86%)"}}/>
          ))}
        </div>

        {/* spread */}
        <div style={{position:"absolute", inset: mobile?0:6, top: mobile?62:10, display:"flex", borderRadius: mobile?0:3, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
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
        </div>

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
              <span style={{width:11, height:11, borderRadius:2, background:sec.ribbon, flexShrink:0}}/>
              <span style={{flex:1, fontFamily:DISPLAY, fontSize:15, color:C.ink}}>{sec.title}</span>
              {!sec.voice && <span style={{fontFamily:DISPLAY, fontSize:10, fontStyle:"italic", color:C.inkFaint}}>tool</span>}
              {on && <span style={{fontFamily:DISPLAY, fontSize:11, fontStyle:"italic", color:C.sanguine}}>here</span>}
            </div>;
          })}
        </div>
      </>}

      {/* ── prev / next stepping (keeps the page-turn feel) ── */}
      {!isIndex && prevKey && <button onClick={()=>turnTo(prevKey)} aria-label="previous page" className="stepnav" style={stepNav("left", mobile)}>‹</button>}
      {!isIndex && nextKey && <button onClick={()=>turnTo(nextKey)} aria-label="next page" className="stepnav" style={stepNav("right", mobile)}>›</button>}

      {/* ── scene toggle + index return ── */}
      <button onClick={()=>setScene(scene==="table"?"held":"table")} className="scenebtn"
        style={{position:"fixed", bottom:18, right:18, zIndex:20, background:"rgba(30,22,14,0.8)", color:"#d8c9a8", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"8px 14px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>
        {scene==="table" ? "take it up ✦" : "set it down ✦"}
      </button>
      {!isIndex && <button onClick={()=>turnTo("index")} className="scenebtn" style={{position:"fixed", bottom:18, left:18, zIndex:20, background:"rgba(30,22,14,0.8)", color:"#d8c9a8", border:"1px solid #5a4330", fontFamily:DISPLAY, fontStyle:"italic", fontSize:12.5, padding:"8px 14px", borderRadius:20, cursor:"pointer", backdropFilter:"blur(4px)"}}>✦ index</button>}

      <style>{"@media (prefers-reduced-motion: reduce){ *{transition:none !important;} } .ribbon:hover{ filter:brightness(1.12); } .ribbon:focus-visible,.scenebtn:focus-visible,.stepnav:focus-visible{ outline:2px solid "+C.candle+"; outline-offset:2px; } .stepnav:hover{ background:rgba(40,30,18,0.92) !important; } select,input,button{ outline-color:"+C.sanguine+"; } h1,h2,h3{ text-shadow:0 0 0.4px rgba(42,32,23,0.25); } p,span,div{ -webkit-font-smoothing:auto; }"}</style>
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
const leafBase = { flex:1, height:"100%", position:"relative", overflow:"hidden", background:C.paper };
function Gutter({ side }){
  const bg = side==="left" ? "linear-gradient(90deg, rgba(58,42,28,0.2), transparent)" : "linear-gradient(270deg, rgba(58,42,28,0.2), transparent)";
  return <div style={{position:"absolute", top:0, bottom:0, [side]:0, width:32, pointerEvents:"none", zIndex:2, background:bg}} aria-hidden="true"/>;
}
