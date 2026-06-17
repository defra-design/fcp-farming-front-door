# Historical land-cover page — iteration 1

**Date:** 2026-06-17
**Page:** `app/views/v18/1.1/view-land-parcel-SX39647821.html`
**Parcel:** SX3964 7821 (SBI 111089693)

## Problem

We want to show a parcel's land covers **as they were before the 3 February 2026
update**, alongside the current state.

The live RPA WFS only exposes currently-valid rows — every land-cover feature it
returns for this parcel carries `VALID_FROM = 20260203000002` (the 3 Feb update)
and `CREATED_ON = 20260213…`. The superseded pre-update versions are not
queryable (temporal CQL filters are rejected by the WAF, and the feed retains no
history). So the "before" state cannot come from the API and must be supplied as
a static file.

The stray `app/views/v18/1.1/SX39647821.json` (mislabelled "After") turned out to
be a copy of the *current* covers, shifted ~2.6 m — not the before state. It is
not HTTP-fetchable from the `views/` directory and is otherwise unused.

## Approach (iteration 1)

Two separate pages, no client-side diffing:

- **Current / "after"** — the existing API-backed `view-land-parcel.html`
  (reached via this page's *"Return to current version"* link). Unchanged.
- **Before / "historical"** — `view-land-parcel-SX39647821.html`. Its **land
  covers** are loaded from a local file instead of the live `LandCovers` WFS.

Only land covers move to the local file. The **parcel outline** (`LandParcels`)
and **hedgerows** (`HedgeControl`) keep coming from the live WFS — they position
the map and are not the focus of the before/after comparison.

## Components

### 1. Local historical data file

- **Path:** `app/assets/data/land-covers/SX39647821-before.json`
  → served at `/public/data/land-covers/SX39647821-before.json`
  (`app/assets` is served at `/public`, confirmed via the page's existing
  `/public/pdf/example-land-parcel.pdf` reference).
- **Schema:** identical to the WFS `LandCovers` GeoJSON the page already
  consumes — a `FeatureCollection` whose feature `properties` include
  `SHEET_ID`, `PARCEL_ID`, `LAND_COVER_CLASS_CODE`, `DESCRIPTION`, `AREA_HA`,
  `VALID_FROM`, `VALID_TO`, `CREATED_ON`; geometry in EPSG:4326.
  - The page renders covers using only `properties.DESCRIPTION` (style filter +
    sidebar label) and `properties.AREA_HA` (sidebar area), and filters by
    `properties.SHEET_ID`. Matching this schema means **no rendering code
    changes**, and the real RPA historical extract can later **overwrite this
    file** with no code change.
- **Placeholder content:** derived from the current covers but **deliberately
  different**, so the historical page visibly differs from the current page when
  demoed. Constraints:
  - **Keep all five cover features and all their types** — no covers removed,
    no types added. Current set retained: 583 Rivers and streams type 3,
    643 Track – Natural Surface, 551 Hard Standings, and two 130 Permanent
    Grassland features.
  - Vary the historical **areas** (`AREA_HA`) so the sidebar table differs, and
    adjust the corresponding **geometry** enough that the difference is also
    visible on the map (e.g. larger historical grassland, smaller hard
    standings / track). Concrete target areas are set during implementation;
    each feature's `AREA_HA` stays consistent with its polygon.

### 2. Page change — `view-land-parcel-SX39647821.html`

- Replace the live `LandCovers` fetch (`coversUrlFor`) with a fetch of the local
  file path above.
- Drop the WFS-only `CREATED_ON` date clause from the covers request (it has no
  meaning for a static file).
- Leave `LandParcels` (outline) and `HedgeControl` (hedges) fetching from the
  live WFS unchanged.
- Keep the existing "viewing a date in the past" banner and the
  "Return to current version" link.
- The `sessionStorage` cache, the client-side `SHEET_ID` filter, sidebar
  rendering, and the colour/key logic are unchanged (the local file carries
  `SHEET_ID` and the same property names).

### 3. Remove the stray file

Delete `app/views/v18/1.1/SX39647821.json` once its data has been repurposed into
the new served file — it is not fetchable from `views/` and is unused.

## Data flow

1. Page loads → builds map from the `LandParcels` (live) feature for SX3964 7821.
2. Covers fetched from `/public/data/land-covers/SX39647821-before.json` (static)
   instead of the live WFS; hedges fetched from `HedgeControl` (live).
3. Covers filtered client-side by `SHEET_ID`, drawn on the map and listed in the
   sidebar exactly as today — schema is unchanged, so the data is a drop-in.

## Out of scope (later iterations)

- On-page before/after toggle, overlay, side-by-side maps, or computed diff.
- Matching covers between before/after states (by type, ID, or geometry).
- Generalising beyond this single hard-coded parcel.

## Success criteria

- `view-land-parcel-SX39647821.html` renders its land covers from the local file
  with no live `LandCovers` request.
- The historical page shows all five cover types but with visibly different
  areas/shapes from the current (`view-land-parcel.html`) page.
- Replacing the local file with a real RPA pre-update extract (same schema)
  requires no code change.
