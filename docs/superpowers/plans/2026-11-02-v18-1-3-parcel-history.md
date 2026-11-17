# v18/1.3 Parcel History From The RPA Snapshot: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show real previous versions of parcels on v18/1.3 for SBI 112965195, using the RPA snapshot where it has history and the public API for everything else.

**Architecture:** A script converts the snapshot into the file format 1.2's dates list already reads, plus a manifest. The files and manifest are gitignored until the data provider clears publication. The 1.3 routes load the manifest and pass it to the land summary and to copies of 1.2's dates list and compare template. Current details always come from the API.

**Tech Stack:** GOV.UK Prototype Kit, Nunjucks, Express, `@defra/interactive-map` 0.0.52, Node 22 (`node:test`), `@turf/union` (already in `node_modules`).

**Spec:** No separate spec. The requirement was agreed in conversation on 2 November 2026:

- build in v18/1.3, which already has SBI 112965195 and the clustering
- leave v18/1.2 unchanged
- use the snapshot for historical views, and the API for parcels it doesn't cover

Background is in `app/views/v18/_design-history/parcel-history-findings.md`.

## Global Constraints

- **Do not change anything under `app/views/v18/1.2/` or `app/routes/v18/1.2/`.**
- **Never commit snapshot data.** Output goes in `app/assets/data/snapshot-112965195/`, which Task 2 gitignores. Tests use synthetic fixtures only.
- **Never publish neighbours' data.** Only parcels the API lists under SBI `112965195` may be converted, even though 5 of them are found only in `adjacent_outputs`.
- **Parcels shown with history:** those with a current version plus at least one earlier version that isn't zero-length. This is expected to be 11 parcels.
- **All other parcels use the API-only page:** `view-land-parcel`, with no history links.
- **Current details always come from the API,** never from the snapshot.
- **Dates match the snapshot exactly:** keep each version's `VALID_FROM` and `VALID_TO` unchanged in the output files, and show those dates on the page. Do not reformat the stored values, subtract a day or carry over 1.2's Valid until rule. Do not invent a `CREATED_ON`.
- **Align to the API:** shift each parcel's historical geometry by its measured offset from the API (about 2.1m). Stop if an offset is over 5m.
- **Do not kill the running dev server.** Test against `localhost:3000`, using `npm run dev` only if nothing is running.
- **Commit only when the user asks,** and stage named files only. `git add -A` is not allowed.
- **Copy rule:** no quotation marks around UI labels.

## Review Focus

1. **Fresh clone or deployed copy, no manifest:** every parcel opens the API-only page, with no errors. Tested in Task 3.
2. **A dates list URL for a parcel with no history:** redirects to the API-only page, not "Could not load parcel". Tested in Task 3.
3. **`?sbi=` set to a different business:** no snapshot history is offered. Tested in Task 3.
4. **A previous version identical to the current one:** the date is listed and opens with no change tags and no errors. Tested in Task 6 on SK40625920.
5. **An earlier boundary much larger than today's:** the map reframes to show it, and today's hedgerows are not presented as historical. Tested in Task 6 on SK40623814.

---

### Task 1: Convert snapshot versions to the page's format

**Files:**
- Create: `scripts/parcel-snapshot/convert.js`
- Test: `scripts/parcel-snapshot/convert.test.js`

**Interfaces:**
- Produces, all exported from `convert.js`:
  - `parseVersionName(name: string) -> { ngc, validFrom, validTo }`, for names like `SK40623814_20170501_99991231`
  - `selectVersions(versions, liveRefs: Set<string>) -> Map<ngc, version[]>`, oldest first. Drops zero-length versions and refs not in `liveRefs`, then drops parcels with no current version or no earlier version.
  - `registrationOffset(snapshotFeatures, liveFeatures) -> { dLng, dLat }`. Mean vertex position of the snapshot minus that of the API. Throws if the result exceeds 5m.
  - `toSnapshotFile(version, { sbi, offset }) -> object`. See step 3 for the shape.
  - `buildManifest(selected, { sbi, stamp }) -> { sbi, generatedAt, history, dateVersions }`

- [ ] **Step 1: Write the failing tests**

Use `node:test` and `node:assert/strict`, with synthetic refs such as `AA00001234` and rectangles only.

- `parseVersionName` returns the three parts of `AA00001234_20170501_99991231`.
- `selectVersions` drops a zero-length version, drops a ref not in `liveRefs`, drops a one-version parcel and returns the rest oldest first.
- `registrationOffset` returns about `{ dLng: 0, dLat: 0.00002 }` when the snapshot sits that far north of identical API shapes.
- `registrationOffset` throws for an offset of about 10m.
- `toSnapshotFile` gives a cover with `SHEET_ID: 'AA0000'`, `PARCEL_ID: '1234'`, `DESCRIPTION`, `AREA_HA: '0.5'` from `GEOM_AREA_SQM: 5000`, `VALID_FROM: '20170501'` and `VALID_TO: '20190101'` exactly as supplied, `SBI`, and no `CREATED_ON`.
- `toSnapshotFile` moves coordinates by minus the offset.
- `toSnapshotFile` joins two touching covers into one `parcel` Feature whose `AREA_HA` is their sum, and sets `hedgesUnavailable: true`.
- `buildManifest` gives the newest previous version as `history[ngc].beforeFile`.
- `buildManifest` gives `dateVersions[ngc]`, newest first, starting with `{ file: null }`. It has no entry for the current version.
- `buildManifest` file URLs have the form `/public/data/snapshot-112965195/<NGC>-<VALID_FROM>.json?v=<stamp>`.
- `buildManifest` gives a `dateLabel` of `1 May 2017 to 1 January 2019` for a version from `20170501` to `20190101`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/parcel-snapshot/convert.test.js`
Expected: FAIL with `Cannot find module './convert'`.

- [ ] **Step 3: Implement `convert.js`**

`toSnapshotFile` returns the shape of `app/assets/data/land-covers/SX39647821-before-20231012.json`, plus `hedgesUnavailable`:

```js
{ type: 'FeatureCollection', features: [/* covers */], parcel: {/* Feature */}, hedgesUnavailable: true }
```

- Set a cover's `LAND_COVER_CLASS_CODE`, `SHAPE_AREA`, `VALID_FROM` and `VALID_TO` from the snapshot, unchanged.
- Build the `parcel` geometry with `@turf/union`, and set its properties to `ID` (`REFERENCE_PARCELS_ID`), `SHEET_ID`, `PARCEL_ID`, `VALID_FROM`, `VALID_TO`, `AREA_HA`, `SBI` and `SHAPE_AREA`.
- Convert degrees to metres with latitude scaling for the 5m check.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/parcel-snapshot/convert.test.js`
Expected: all tests PASS.

- [ ] **Step 5: Commit, if asked**

```bash
git add scripts/parcel-snapshot/convert.js scripts/parcel-snapshot/convert.test.js
git commit -m "Add a converter from the RPA parcel snapshot to the historical page format"
```

### Task 2: Generate the local history files

**Files:**
- Create: `scripts/parcel-snapshot/generate.js`
- Modify: `.gitignore`
- Output, gitignored: `app/assets/data/snapshot-112965195/*.json` and `manifest.json`

**Interfaces:**
- Consumes: everything from Task 1.
- Produces: `app/assets/data/snapshot-112965195/manifest.json`, with the shape from `buildManifest`.
- Command: `node scripts/parcel-snapshot/generate.js --outputs <dir> --adjacent <dir>`

- [ ] **Step 1: Gitignore the output before generating anything**

Add `app/assets/data/snapshot-112965195/` to `.gitignore`.
Run: `git check-ignore app/assets/data/snapshot-112965195/manifest.json`
Expected: the path is printed.

- [ ] **Step 2: Write `generate.js`**

It does the following, in order:

1. Fetch `RPA:LandParcels` and `RPA:LandCovers` for the SBI in EPSG:4326, following redirects.
2. Read both directories, removing duplicates by filename.
3. Call `selectVersions`.
4. Measure one offset per parcel from its current snapshot version against its API covers.
5. Write one file per previous version, then the manifest.
6. Print a table of parcel, previous version count and offset.

If a parcel's merged area differs from the sum of its covers by more than 0.5%, stop with an error naming the parcel.

- [ ] **Step 3: Unpack the zips outside the repository and run it**

Unzip `~/Downloads/outputs.zip` and `~/Downloads/adjacent_outputs.zip` into separate new folders in a temporary directory, then pass those folders to the command.
Expected: 11 parcels, with offsets of about 2m to the north. SK40621823, SK52625098 and SK52627297 are absent.

- [ ] **Step 4: Check that the output is safe**

Run: `git status --short app/assets/data/`
Expected: no output.

Check that the generated folder has `manifest.json` plus one file per listed previous version, and that every file's `SBI` is `112965195`.

- [ ] **Step 5: Commit, if asked**

```bash
git add scripts/parcel-snapshot/generate.js .gitignore
git commit -m "Add a local generator for parcel history files, keeping the data out of git"
```

### Task 3: Load history in the 1.3 routes

**Files:**
- Create: `app/data/v18-1-3-parcel-history.js`
- Test: `scripts/parcel-snapshot/parcel-history.test.js`
- Modify: `app/routes/v18/1.3/routes.js:113-123` and before the catch-all at line 139

**Interfaces:**
- Consumes: `manifest.json` from Task 2.
- Produces: `loadParcelHistory(sbi: string, manifestPath?: string) -> { history: object, dateVersions: object }`, which later tasks read as `res.locals.parcelHistory`.

- [ ] **Step 1: Write the failing tests**

- A missing manifest file returns `{ history: {}, dateVersions: {} }` and doesn't throw.
- A manifest whose `sbi` differs from the argument returns empty objects.
- A matching manifest returns its `history` and `dateVersions`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/parcel-snapshot/parcel-history.test.js`
Expected: FAIL with a module not found error.

- [ ] **Step 3: Implement the loader and routes**

- Read the manifest on each request, so regenerating doesn't need a restart.
- In the existing SBI middleware, set `res.locals.parcelHistory = loadParcelHistory(req.session.sbiV18_13)`.
- Add a `GET /v18/1.3/view-land-parcel-dates-list` route. If `parcelHistory.history[req.query.parcel]` is missing, redirect to `/v18/1.3/view-land-parcel?parcel=<encoded parcel>`. Otherwise render the page with `myData: res.locals.myData13`.

- [ ] **Step 4: Run the tests and check the redirect**

Run: `node --test scripts/parcel-snapshot/parcel-history.test.js`
Expected: all tests PASS.

Run: `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' 'localhost:3000/v18/1.3/view-land-parcel-dates-list?parcel=SK41715864'`
Expected: `302`, ending in `/v18/1.3/view-land-parcel?parcel=SK41715864`.

- [ ] **Step 5: Commit, if asked**

```bash
git add app/data/v18-1-3-parcel-history.js scripts/parcel-snapshot/parcel-history.test.js app/routes/v18/1.3/routes.js
git commit -m "Load snapshot parcel history in the 1.3 routes, falling back to the API-only page"
```

### Task 4: Add the dates list to 1.3 and link to it

**Files:**
- Create: `app/views/v18/1.3/_compare-single-map.html`, copied from 1.2
- Create: `app/views/v18/1.3/view-land-parcel-dates-list.html`, copied from 1.2
- Modify: `app/views/v18/1.3/view-land.html:617`

**Interfaces:**
- Consumes: `parcelHistory.history` and `parcelHistory.dateVersions` from Task 3.
- Produces: a working `/v18/1.3/view-land-parcel-dates-list?parcel=<NGC>`, with the base template's `pairByOverlap` option.

- [ ] **Step 1: Copy both files and repoint them**

Replace `v18/1.2` with `v18/1.3` and `111089693` with `112965195` in both copies.
Run: `grep -n "v18/1\.2\|/1\.2/\|111089693\|SX39" app/views/v18/1.3/_compare-single-map.html app/views/v18/1.3/view-land-parcel-dates-list.html`
Expected: only the `SX39` lines that step 2 replaces.

- [ ] **Step 2: Replace the hardcoded parcel data with the manifest**

- In the base, set `const HISTORY = {{ parcelHistory.history | dump | safe }}`.
- In the dates list, set `const DATE_VERSIONS = {{ parcelHistory.dateVersions | dump | safe }}`.
- Remove the comments describing mocked versions from both.

- [ ] **Step 3: Use real colours and compare covers by location**

- Load `/public/javascripts/map/land-cover-colours.js` in the base and use it the way `app/views/v18/1.3/view-land-parcel.html:501` does, so covers such as Solar Panels don't fall back to grey.
- Add `const PAIR_BY_OVERLAP = {{ 'true' if pairByOverlap else 'false' }}`, and change the check in `diffCovers` to `if (COMPARE_SPLITS || PAIR_BY_OVERLAP)`.
- Add `{% set pairByOverlap = true %}` before `extends` in the dates list. A grassland that became solar panels then shows as Changed with Was Permanent Grassland, not as Removed plus Added. `COMPARE_SPLITS` stays off, so the page doesn't gain surrounding parcels.

- [ ] **Step 4: Show the snapshot's dates exactly**

In the 1.3 dates list:

- Remove `dayBefore`, and set `version.validUntil` to `fmtValidFrom(snapshotDate(snapshot, 'VALID_TO'))`.
- Change `previousDateInsetPrefix` from `Valid until` to `Valid to`.
- Rewrite the header comment, which describes the day-before rule.

`fmtValidFrom` already reads 8-digit dates, so the stored values need no conversion. A version's Valid to date can match the next version's Parcel updated date, because that's what the data says.

- [ ] **Step 5: Link parcels with history from the land summary**

In `view-land.html`, change `parcelUrl` to return the dates list URL when `ngc` is in `{{ parcelHistory.history | dump | safe }}`, and `view-land-parcel` otherwise. Leave `PARCELS_WITH_HISTORY` empty in `view-land-parcel.html`, because its links go to pages 1.3 doesn't have.

- [ ] **Step 6: Check the pages respond**

Run: `curl -s -o /dev/null -w '%{http_code}\n' 'localhost:3000/v18/1.3/view-land-parcel-dates-list?parcel=SK40623814'`
Expected: `200`.

Run: `curl -s 'localhost:3000/v18/1.3/view-land' | grep -c SK40623814`
Expected: at least `1`.

Run: `git status --short app/views/v18/1.2`
Expected: no output.

- [ ] **Step 7: Commit, if asked**

```bash
git add app/views/v18/1.3/_compare-single-map.html app/views/v18/1.3/view-land-parcel-dates-list.html app/views/v18/1.3/view-land.html
git commit -m "Add the dates list to 1.3 and link parcels with snapshot history to it"
```

### Task 5: Don't present today's hedgerows as historical

The snapshot has no hedge history, and the base template otherwise shows today's hedgerows for every previous version.

**Files:**
- Modify: `app/views/v18/1.3/_compare-single-map.html`

**Interfaces:**
- Consumes: `hedgesUnavailable: true` from each file made by `toSnapshotFile` in Task 1.

- [ ] **Step 1: Apply the behaviour on both load paths**

Apply this at initial load (around line 2842 of the copy) and in `loadPreviousSnapshot` (around line 2480), when the snapshot has `hedgesUnavailable`:

- Treat the previous version's hedgerows as empty.
- Use empty `marks.hedges`, so no current hedgerow is tagged as Added.
- Show `Not available` in the Previous tab's Hedgerows summary row.
- Replace the Previous tab's hedgerows table with `Hedgerow history is not available for previous versions.`
- In `applyVersionRadio`, show the hedgerows dataset only when Current details is selected.

- [ ] **Step 2: Check it in the browser**

Follow Task 6's browser method on SK40626919.
Expected with a past date and Previous details selected: the message shows, no hedgerows are on the map and the Current tab has no Added tags on hedgerows. Selecting Current details brings the hedgerows back.

- [ ] **Step 3: Commit, if asked**

```bash
git add app/views/v18/1.3/_compare-single-map.html
git commit -m "Say hedgerow history is unavailable on 1.3 snapshot versions"
```

### Task 6: Verify the full journey and update the docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `app/views/v18/_design-history/parcel-history-findings.md`

- [ ] **Step 1: Check the journey in headless Chrome**

Use the method in the `headless-chrome-cdp-map-verification` memory: swiftshader flags, never `--disable-gpu`, and one page at a time. Check there are no console errors apart from the known pattern-image race, then confirm:

| Page | Expected |
|---|---|
| `view-land`, zoomed out | Numbered discs show, and clicking one zooms in |
| `view-land`, select SK40623814 | Opens the dates list |
| `view-land`, select SK41715864 | Opens `view-land-parcel`, with no history links |
| Dates list, SK40623814 | Three dates, newest first. Choosing the oldest shows its boundary and reframes the map to fit it |
| Dates list, SK40626919 | Three dates, each showing its own land covers. Every Parcel updated and Valid to date matches the `VALID_FROM` and `VALID_TO` in that version's source filename, with no day subtracted |
| Dates list, SK52635702 | The 2016 version shows Changed with Was Arable Land on Solar Panels |
| Dates list, SK40625920 | One date. It opens with no change tags and no errors |

- [ ] **Step 2: Check the no-data case without removing the real data**

Run the `node:test` loader test from Task 3 for the missing manifest, then load `/v18/1.3/view-land?sbi=106332870`.
Expected: the land summary loads and parcels open `view-land-parcel`. Reset afterwards with `/v18/1.3/view-land?sbi=112965195`.

- [ ] **Step 3: Run the 1.2 regression check**

Open `/v18/1.2/view-land-parcel-dates-list?parcel=SX39647821`.
Expected: it behaves as before, listing its mocked dates.

- [ ] **Step 4: Update the docs**

- In `CLAUDE.md`, update the v18/1.3 description. It no longer holds only `view-land` and `view-land-parcel`. Add the generate command, and state that the snapshot output is gitignored until cleared.
- In `parcel-history-findings.md`, add a short note on what the prototype now does.

- [ ] **Step 5: Commit, if asked**

`parcel-history-findings.md` must stay uncommitted until the provider clears the data.

```bash
git add CLAUDE.md
git commit -m "Document snapshot parcel history on v18/1.3"
```
