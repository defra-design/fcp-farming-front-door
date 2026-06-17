# Historical Land-Cover Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `view-land-parcel-SX39647821.html` render its land covers from a local "before 3 February 2026" file instead of the live RPA WFS, so it acts as the historical counterpart to the API-backed current page.

**Architecture:** A static GeoJSON file (in the same schema the WFS LandCovers feed returns) supplies the historical covers; the page swaps its `LandCovers` fetch for that file while keeping the parcel outline and hedgerows live. The placeholder file is generated from the existing stray export with deliberate per-feature geometry scaling so it differs visibly from the current page; a real RPA extract can later overwrite it with no code change.

**Tech Stack:** GOV.UK Prototype Kit (Express + Nunjucks), Defra interactive-map plugin, vanilla JS in-page. No test framework — verification is manual browser/CLI checks.

> **Note on verification:** This project has no automated test suite (see `CLAUDE.md`). "Verify" steps use Node assertions, `curl`, `grep`, and a manual browser check against the running dev server instead of unit tests.

---

### Task 1: Generate the historical land-cover data file

Generate `app/assets/data/land-covers/SX39647821-before.json` (served at `/public/data/land-covers/SX39647821-before.json`) from the stray export `app/views/v18/1.1/SX39647821.json`. Output mirrors the WFS LandCovers GeoJSON schema. All five covers and their types are kept; each is scaled about its own centroid by a per-feature factor so areas and shapes differ from the current state (scaling a polygon by `k` multiplies its area by `k²`).

**Files:**
- Create (build tool, not committed): `/tmp/gen-historical-covers.js`
- Create (committed): `app/assets/data/land-covers/SX39647821-before.json`
- Read then delete: `app/views/v18/1.1/SX39647821.json`

- [ ] **Step 1: Write the generator script**

Create `/tmp/gen-historical-covers.js`:

```js
// One-time generator for the placeholder "before 3 Feb 2026" land covers of
// parcel SX3964 7821. Reads the stray export, converts it to the WFS LandCovers
// GeoJSON schema, and scales each feature about its centroid so the historical
// page differs visibly from the current API-backed page. Recorded here (not
// committed) — the committed artifact is the JSON output.
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'app/views/v18/1.1/SX39647821.json')
const OUT = path.join(ROOT, 'app/assets/data/land-covers/SX39647821-before.json')

// Per-feature linear scale factors keyed by source ID. All five covers and their
// types are kept; areas/shapes are deliberately altered. area_new = area_old * k^2.
const SCALE = {
  '13012189': 1.0,   // 583 Rivers and streams type 3 — unchanged
  '13012192': 0.8,   // 643 Track - Natural Surface   — smaller historically
  '13012190': 0.6,   // 551 Hard Standings            — smaller historically
  '13012191': 1.25,  // 130 Permanent Grassland (sm)  — larger historically
  '13012193': 1.1    // 130 Permanent Grassland (lg)  — larger historically
}

const round7 = n => Math.round(n * 1e7) / 1e7

function centroid (rings) {
  let sx = 0, sy = 0, n = 0
  rings.forEach(r => r.forEach(([x, y]) => { sx += x; sy += y; n++ }))
  return [sx / n, sy / n]
}

function scaleGeometry (geom, k) {
  const [cx, cy] = centroid(geom.coordinates)
  const scaleRing = r => r.map(([x, y]) => [round7(cx + k * (x - cx)), round7(cy + k * (y - cy))])
  return { type: geom.type, coordinates: geom.coordinates.map(scaleRing) }
}

const src = JSON.parse(fs.readFileSync(SRC, 'utf8'))

const features = src.features.map(f => {
  const p = f.properties
  const ref = String(p.PARCEL_REF)                 // e.g. "SX39647821"
  const id = String(p.ID)
  const k = SCALE[id] != null ? SCALE[id] : 1.0
  const areaSqm = Number(p.GEOM_AREA_SQM) * k * k
  return {
    type: 'Feature',
    id: 'LandCovers.' + id,
    geometry: scaleGeometry(f.geometry, k),
    geometry_name: 'geom',
    properties: {
      ID: id,
      SHEET_ID: ref.slice(0, 6),                   // "SX3964"
      PARCEL_ID: ref.slice(6),                     // "7821"
      LAND_COVER_CLASS_CODE: String(p.CODE),
      DESCRIPTION: p.DESCRIPTION,
      AREA_HA: String(areaSqm / 10000),
      SHAPE_AREA: areaSqm,
      VALID_FROM: '20231012000000',                // historical window start (12 Oct 2023)
      VALID_TO: '20260203000002',                  // superseded by the 3 Feb 2026 update
      CREATED_ON: '20231012000000',
      SBI: '111089693'
    }
  }
})

const out = {
  type: 'FeatureCollection',
  name: 'SX39647821_before_20260203',
  features,
  totalFeatures: features.length,
  numberMatched: features.length,
  numberReturned: features.length,
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::4326' } }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
console.log('Wrote', OUT, 'with', features.length, 'features')
```

- [ ] **Step 2: Run the generator**

Run (from repo root):
```bash
node /tmp/gen-historical-covers.js
```
Expected: `Wrote .../app/assets/data/land-covers/SX39647821-before.json with 5 features`

- [ ] **Step 3: Verify the output file's schema, count, and that areas differ from source**

Run:
```bash
node -e '
const fs=require("fs");
const out=JSON.parse(fs.readFileSync("app/assets/data/land-covers/SX39647821-before.json","utf8"));
const src=JSON.parse(fs.readFileSync("app/views/v18/1.1/SX39647821.json","utf8"));
const need=["SHEET_ID","PARCEL_ID","LAND_COVER_CLASS_CODE","DESCRIPTION","AREA_HA"];
if(out.features.length!==5) throw new Error("expected 5 features, got "+out.features.length);
const types=out.features.map(f=>f.properties.DESCRIPTION);
["Rivers and streams type 3","Track - Natural Surface","Hard Standings","Permanent Grassland"].forEach(t=>{
  if(!types.includes(t)) throw new Error("missing cover type: "+t);
});
out.features.forEach(f=>{
  need.forEach(k=>{ if(f.properties[k]===undefined) throw new Error("missing prop "+k+" on "+f.id); });
  if(f.properties.SHEET_ID!=="SX3964") throw new Error("bad SHEET_ID "+f.properties.SHEET_ID);
});
// At least one feature must differ in area from the source (deliberate change).
const srcArea=Object.fromEntries(src.features.map(f=>[String(f.properties.ID),Number(f.properties.GEOM_AREA_SQM)]));
const changed=out.features.filter(f=>Math.abs(f.properties.SHAPE_AREA-srcArea[f.properties.ID])>0.5).length;
if(changed<3) throw new Error("expected >=3 covers with changed area, got "+changed);
console.log("OK: 5 features, all types present, schema fields present,", changed, "areas changed");
'
```
Expected: `OK: 5 features, all types present, schema fields present, 4 areas changed`

- [ ] **Step 4: Delete the stray, unfetchable source export**

The source export lives under `views/` (not HTTP-fetchable) and its data now lives, transformed, in the served file. It is untracked, so removal is a plain delete:
```bash
rm app/views/v18/1.1/SX39647821.json
```

- [ ] **Step 5: Commit the data file**

```bash
git add app/assets/data/land-covers/SX39647821-before.json
git commit -m "Add historical (pre-3-Feb-2026) land-cover data for SX3964 7821"
```

---

### Task 2: Point the page's covers fetch at the local historical file

**Files:**
- Modify: `app/views/v18/1.1/view-land-parcel-SX39647821.html` (remove `buildDateClause` at lines 442–455; replace `coversUrlFor` at lines 467–474)

- [ ] **Step 1: Remove the now-unused `buildDateClause` function**

Delete this block (lines 442–455, the comment and the function):

```js
      // If the page was opened with a ?from-date-* window, scope the covers fetch to
      // "covers created on/after that date" via CREATED_ON (the WFS only exposes
      // currently-valid rows, so this is the only "change" signal — VALID_FROM shown per row).
      function buildDateClause () {
        const d = urlParams.get('from-date-day')
        const m = urlParams.get('from-date-month')
        const y = urlParams.get('from-date-year')
        if (!d || !m || !y) return ''
        const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        const dt = new Date(iso)
        if (isNaN(dt.getTime()) || dt > new Date()) return ''
        const today = new Date().toISOString().slice(0, 10)
        return ` AND CREATED_ON BETWEEN '${iso}' AND '${today}'`
      }
```

(Leave the blank line that followed it so the `// --- WFS endpoints ---` comment keeps its spacing.)

- [ ] **Step 2: Replace `coversUrlFor` with the local-file path**

Replace the existing comment + function (lines 467–474):

```js
      // PARCEL_ID is quoted so the WFS compares it as a string — unquoted, a leading-zero
      // id like 0469 coerces to 469 and matches nothing. SHEET_ID can't be filtered
      // server-side (the WAF rejects quotes around the alphanumeric value), so we
      // disambiguate by SHEET_ID client-side after the fetch.
      function coversUrlFor (parcelId) {
        const cql = `SBI=${sbi} AND PARCEL_ID='${parcelId}'${buildDateClause()}`
        return `https://environment.data.gov.uk/data-services/RPA/LandCovers/wfs?version=2.0.0&request=GetFeature&typeNames=RPA:LandCovers&cql_filter=${encodeURIComponent(cql)}&srsname=EPSG:4326&outputFormat=application/json`
      }
```

with:

```js
      // Land covers come from a local "before 3 February 2026" snapshot, not the live
      // WFS: the WFS only exposes currently-valid rows, so the pre-update covers can't
      // be queried. The file mirrors the WFS LandCovers GeoJSON schema, so the rest of
      // this page renders it unchanged (filtered by SHEET_ID, styled by DESCRIPTION,
      // area from AREA_HA). A real RPA historical extract can later overwrite the file.
      // parcelId is unused — this page is fixed to the single parcel SX3964 7821.
      function coversUrlFor (parcelId) {
        return '/public/data/land-covers/SX39647821-before.json'
      }
```

(The parcel-outline and hedgerow fetches are intentionally left calling the live WFS.)

- [ ] **Step 3: Verify the source edits — no live LandCovers call, local path wired, dead function gone**

Run:
```bash
grep -n "RPA/LandCovers" app/views/v18/1.1/view-land-parcel-SX39647821.html || echo "NO live LandCovers fetch (correct)"
grep -n "/public/data/land-covers/SX39647821-before.json" app/views/v18/1.1/view-land-parcel-SX39647821.html
grep -n "buildDateClause" app/views/v18/1.1/view-land-parcel-SX39647821.html || echo "buildDateClause removed (correct)"
grep -cn "RPA/LandParcels\|RPA/HedgeControl" app/views/v18/1.1/view-land-parcel-SX39647821.html
```
Expected:
- `NO live LandCovers fetch (correct)`
- one line printing the `coversUrlFor` return path
- `buildDateClause removed (correct)`
- `2` (outline + hedgerow live fetches still present)

- [ ] **Step 4: Commit the page change**

```bash
git add app/views/v18/1.1/view-land-parcel-SX39647821.html
git commit -m "Load historical land covers from local file on SX3964 7821 page"
```

---

### Task 3: Verify end-to-end in the running prototype

**Files:** none (manual verification against the dev server)

- [ ] **Step 1: Start the dev server**

Run:
```bash
npm run dev
```
Expected: server starts on `http://localhost:3000` with no startup errors.

- [ ] **Step 2: Verify the static file is served with 200 + JSON**

Run (in a second shell):
```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/public/data/land-covers/SX39647821-before.json
```
Expected: `200` and a JSON content type (e.g. `application/json`).

- [ ] **Step 3: Browser check — historical covers render, no live LandCovers request**

1. Open `http://localhost:3000/v18/1.1/view-land-parcel-SX39647821`.
2. Open DevTools → Network, reload.
3. Confirm: a `200` request to `/public/data/land-covers/SX39647821-before.json`.
4. Confirm: **no** request to `environment.data.gov.uk/.../RPA/LandCovers`.
5. Confirm: requests to `RPA/LandParcels` and `RPA/HedgeControl` still occur (outline + hedges stay live).
6. Confirm on the page: the map draws the coloured land covers, and the sidebar "Land cover" table lists all of: Permanent Grassland (×2), Hard Standings, Track - Natural Surface, Rivers and streams type 3.

Expected: all confirmations hold; the map shows covers and the "viewing a date in the past" banner is present.

- [ ] **Step 4: Confirm the historical page differs from the current page**

1. In a new tab open the current page: `http://localhost:3000/v18/1.1/view-land-parcel?parcel=SX39647821`.
2. Compare the "Land cover" area figures and polygon shapes against the historical page from Step 3.

Expected: areas/shapes visibly differ — e.g. historical Permanent Grassland is larger and Hard Standings smaller than current — while both pages list the same cover types.

- [ ] **Step 5: Stop the dev server**

Stop the `npm run dev` process (Ctrl-C).

---

## Self-review notes

- **Spec coverage:** local file (Task 1) ✓; WFS schema for drop-in replacement (Task 1 Step 1 properties) ✓; placeholder keeps all 5 types but deliberately different areas/geometry (Task 1 SCALE + Step 3 assertions) ✓; page swaps only covers to local, outline + hedges stay live (Task 2 Steps 2–3) ✓; drop CREATED_ON date clause (Task 2 Step 1) ✓; remove stray file (Task 1 Step 4) ✓; verify no live LandCovers + visible difference (Tasks 2–3) ✓.
- **Placeholder scan:** all code blocks complete; no TODO/TBD.
- **Consistency:** property names (`SHEET_ID`, `DESCRIPTION`, `AREA_HA`) match what the page reads (`buildParcelData` filters on `SHEET_ID`; sidebar reads `AREA_HA`; styling filters on `DESCRIPTION`); served path `/public/data/land-covers/SX39647821-before.json` identical in generator `OUT`, `coversUrlFor`, and verification steps.
- **Caveat (intended):** scaling each cover about its own centroid can introduce small overlaps/gaps between covers — acceptable for placeholder data that a real extract will replace.
