# v18/1.3.1 Splits and Merges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the v18/1.3.1 compare-dates page, show where a parcel's land went to and came from, using links worked out from the RPA snapshot, in the dates table, the details and the map.

**Architecture:** `scripts/parcel-snapshot/generate.js` works out the links at build time by intersecting each parcel's versions with the versions of other parcels that start or end within a day of the change. Small slivers are dropped. The results go in two places: a new `lineage` key in the manifest (text: references and areas) and one `lineage-<ngc>.json` file per parcel (map pieces). The pieces are always parts of this parcel's own versions. `view-land-parcel-compare-dates.html` reads both. The 1.3.1 base gains two optional map datasets for the pieces, behind a `showLineage` flag. 1.3 and 1.2 are unchanged.

**Tech Stack:** GOV.UK Prototype Kit (Nunjucks, Express), `@defra/interactive-map` 0.0.52 (alias `interactive-map-v52`) datasets plugin, `@turf/intersect`, `@turf/union` and `@turf/area` 7.x, Node 22 `node:test`, headless Chrome over CDP for browser checks.

**Spec:** there is no separate spec document. The design comes from the recommendation agreed in conversation on 10 November 2026, and the findings in `app/views/v18/_design-history/splits-and-merges-findings.md` ("Answers from the data provider" and "What this means for the prototype"). Facts about the data are in `app/views/v18/_design-history/parcel-history-findings.md`.

## Global Constraints

- **Build on 1.3.1:** change only `app/views/v18/1.3.1/`, `app/data/v18-1-3-parcel-history.js`, `scripts/parcel-snapshot/`, `app/assets/data/snapshot-112965195/`, `package.json`/`package-lock.json` and `CLAUDE.md`. Do not edit any file under `app/views/v18/1.3/`, `app/views/v18/1.2/` or their routes.
- **1.3 keeps working:** for the same input, the manifest's `sbi`, `history` and `dateVersions` stay exactly as they are now. Lineage only adds new keys and files.
- **Dates:** show VALID_FROM and VALID_TO exactly as supplied, formatted with the page's existing `longDate`. Do not apply the 1.2 day-before rule. Do not add 1 day to a 31 December VALID_TO for display. The one-day tolerance is only for matching.
- **Wording:** describe where land went or came from. Never use the words split, merge, merged or redraw in the UI. Do not show a total that implies the areas balance. Do not put quotes around UI labels in copy or comments (for example, the Valid from column, not "Valid from").
- **Other parcels' data:** the files written must not include any other parcel's geometry or land cover. Map pieces are intersections with this parcel's own versions. Other parcels appear only as a reference, an area and an `inBusiness` flag. The one exception, a renumbered predecessor's versions in Task 3, needs the user's go-ahead first.
- **Numbers:** keep areas to 4 decimal places, as elsewhere on the page. Drop pieces under **0.01 ha**. A reference change needs an overlap of at least **99%** of both versions' areas.
- **Hiding elements:** any new element with a GOV.UK class that sets `display` (for example `govuk-error-message`, `govuk-inset-text` or `govuk-table`) and is toggled with `hidden` needs a `[hidden] { display: none; }` rule. Browser checks must test `getComputedStyle(el).display`, not `el.hidden`.
- **Dev server:** never stop the user's dev server. Check against `http://localhost:3000`. Use headless Chrome on port 9333 with an isolated profile in the scratchpad, and stop only that Chrome.
- **Git:** work on a new branch `v18-1.3.1-splits-and-merges`. Commit only after the user has agreed to commits for this plan, and never push.

## Review Focus

1. **Event on the live version:** SK40623814's current version starts on 1 May 2017, which is when land moved to 8 parcels. The live row's date comes from the API's `VALID_FROM`, which may not be 8 digits. Its lineage note must still be found, using the first 8 characters. This is tested in Task 5, Step 1, check A.
2. **Pieces outside the view:** land that moved out lies outside the version's outline, and the single-date view frames only that outline. The map must also frame the pieces. This is tested in Task 4, Step 1, check C.
3. **Base map change:** a style change rebuilds datasets from their construction-time data. The pieces must survive a switch to Satellite and back. This is tested in Task 4, Step 1, check D.
4. **Tab switch:** pieces belong to the Historical single-date view only. They must clear on the Current tab and in a two-date comparison, and come back on returning to the same single date. This is tested in Task 5, Step 1, check E.
5. **1.3 regression and hidden elements:** after regenerating, 1.3's dates list must still show SK40623814's three dates, with no new console errors. No `[hidden]` element on the 1.3.1 page may take up space. This is tested in Task 6, Step 2.

---

### Task 1: Work out lineage from the snapshot

**Files:**
- Create: `scripts/parcel-snapshot/lineage.js`
- Create: `scripts/parcel-snapshot/lineage.test.js`
- Modify: `scripts/parcel-snapshot/convert.js` (export `shift`)
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: the version shape from `convert.js`'s `parseVersionName` plus `features`: `{ ngc, validFrom, validTo, features }`, where features are raw snapshot covers with `GEOM_AREA_SQM`. Also `shift(geometry, { dLng, dLat })` from `convert.js`.
- Produces:
  - `dayAfter(yyyymmdd: string) => string`, for example `'20151231' → '20160101'`, done in UTC.
  - `findLineage(ngc: string, versions: Version[], { liveRefs: Set<string>, minHa = 0.01 }) => { events: { [validFrom: string]: Event }, earlierVersions: Version[] }`
    - `Event = { movedTo: Link[], addedFrom: Link[], stayedHa?: number, referenceChangedFrom?: string }`
    - `Link = { ref: string, ha: number, inBusiness: boolean, geometry: Polygon | MultiPolygon }`, with the geometry not shifted.
  - `toLineageFile(lineage, { offset }) => FeatureCollection`. There is one feature per Link, with properties `{ event, direction: 'moved' | 'added', ref, ha }` and the geometry shifted by `offset`.
  - `lineageSummary(lineage) => { events: { [validFrom]: { movedTo: {ref, ha, inBusiness}[], addedFrom: {...}[], stayedHa?, referenceChangedFrom? } } }`. This drops the geometry and rounds `ha` to 4 decimal places as numbers.

**The algorithm** (the signatures and tests don't fully determine it):
- Ignore zero-length versions (`validFrom === validTo`) everywhere.
- Sort this parcel's versions oldest first: `own[0..n]`. The event key for `own[k]` is `own[k].validFrom`.
- **Moved to**, for `k > 0` with `before = own[k-1]`: candidates are versions `w` of another reference with `w.validFrom === before.validTo || w.validFrom === dayAfter(before.validTo)`. The piece is `intersect(outline(before), outline(w))`. `stayedHa` is the area of `intersect(outline(before), outline(own[k]))`.
- **Added from**, for any `k`: candidates are versions `u` of another reference with `u.validTo === own[k].validFrom || dayAfter(u.validTo) === own[k].validFrom`. The piece is `intersect(outline(own[k]), outline(u))`.
- **Outline** is the union of a version's cover geometries (`@turf/union`). Use the single geometry when there is one cover.
- **Area in ha** is `area(piece) / area(outline(v)) * sum(v.features GEOM_AREA_SQM) / 10000`, where `v` is the version the piece was cut from (`before` for moved, `own[k]` for added). This keeps the figures consistent with the file's own areas.
- Drop links with `ha < minHa`. Sort links by `ha` descending, then by `ref`. Leave out an event that ends up with nothing in it.
- **Reference change:** this applies when `k === 0` and an `addedFrom` link from `u` has `ha >= 0.99 * area(own[0])` and `ha >= 0.99 * area(u)`. Set `referenceChangedFrom = u.ngc`, remove that link from `addedFrom`, and set `earlierVersions` to all of `u.ngc`'s versions, oldest first. Go back one level only.
- `inBusiness` is `liveRefs.has(ref)`.

- [ ] **Step 1: Create the branch and install the turf packages**

```bash
git checkout -b v18-1.3.1-splits-and-merges
npm install --save-dev --no-audit @turf/intersect@7.4.0 @turf/union@7.4.0 @turf/area@7.3.4
```

Expected: `package.json` gains a `devDependencies` block with these three packages. Union and area were already installed as transitive dependencies but weren't declared. Use `--no-audit` because npm audit crashes on the map alias.

- [ ] **Step 2: Write the failing tests** in `lineage.test.js`

Use synthetic rectangles only, with the `rect`/`cover`/`version` helpers copied from `convert.test.js`, at `LAT = 53.15`. Give each rectangle a `GEOM_AREA_SQM` equal to its `@turf/area`, so expected hectares are exact.

  - `dayAfter rolls over months and years`: `'20151231' → '20160101'`, `'20170501' → '20170502'`, `'20240228' → '20240229'`.
  - `land that moves to another parcel is listed with its area`: A goes from `[0,0,2,1]` (`20100101–20160101`) to `[0,0,1,1]` (`20160101–99991231`). B is `[1,0,2,1]` (`20160101–99991231`). Expect `events['20160101'].movedTo` to be `[{ ref: 'B', ha: ≈ half of A's first area (±0.0001), inBusiness }]` and `stayedHa` ≈ the same.
  - `a version that starts a day later still counts`: as above, but B starts `20160102`. Expect B in `movedTo`. If B starts `20160103`, expect no event.
  - `a version ending on 31 December links to one starting on 1 January`: A's first version ends `20151231`, A's next and B start `20160101`. Expect B in `events['20160101'].movedTo`.
  - `land added from another parcel is listed`: C is `[2,0,3,1]` (`20100101–20190101`). A's last version is `[0,0,3,1]` (`20190101–99991231`) after `[0,0,2,1]`. Expect `events['20190101'].addedFrom` to be `[{ ref: 'C', ... }]`.
  - `slivers under 0.01 ha are dropped`: B overlaps A's earlier version by about 50 m² only. Expect no `movedTo` link to B, and no event if nothing else changed.
  - `zero-length versions are ignored`: add `B_20160101_20160101` with the same shape as B. The result equals the result without it.
  - `inBusiness follows liveRefs`: B is in `liveRefs`, C isn't.
  - `a reference change is reported, not listed as added land`: U is `[0,0,1,1]` (`20131216–20151231`), A is the same shape (`20160101–99991231`). Expect `events['20160101'].referenceChangedFrom === 'U'`, `addedFrom` to be empty or the event to have no `addedFrom` entries, and `earlierVersions` to be U's one version.
  - `half an overlap is not a reference change`: U covers only half of A's first version. Expect `addedFrom` to have U and no `referenceChangedFrom`.
  - `toLineageFile shifts pieces and labels them`: given `{ dLng: 0.0001, dLat: 0.00002 }`, each coordinate equals the piece's minus the offset (the same sign as `convert.js`). Properties are `{ event, direction, ref, ha }`.
  - `lineageSummary drops geometry and rounds to 4 places`.

- [ ] **Step 3: Run the tests to see them fail**

Run: `node --test scripts/parcel-snapshot/lineage.test.js`
Expected: FAIL with `Cannot find module './lineage'`.

- [ ] **Step 4: Implement `lineage.js`**, and add `shift` to `convert.js`'s exports.

- [ ] **Step 5: Run all parcel snapshot tests**

Run: `node --test scripts/parcel-snapshot/*.test.js`
Expected: every test passes, including the 12 existing ones.

- [ ] **Step 6: Commit** (only if the user has agreed to commits)

```bash
git add package.json package-lock.json scripts/parcel-snapshot/lineage.js scripts/parcel-snapshot/lineage.test.js scripts/parcel-snapshot/convert.js
git commit -m "Work out where parcel land went from the RPA snapshot"
```

### Task 2: Write lineage into the manifest and files

**Files:**
- Modify: `scripts/parcel-snapshot/convert.js` (`buildManifest`)
- Modify: `scripts/parcel-snapshot/generate.js`
- Modify: `app/data/v18-1-3-parcel-history.js`
- Test: `scripts/parcel-snapshot/convert.test.js`, `scripts/parcel-snapshot/parcel-history.test.js`

**Interfaces:**
- Consumes: `findLineage`, `toLineageFile`, `lineageSummary` (Task 1).
- Produces:
  - `buildManifest(selected, { sbi, stamp, lineage = {} })`. `lineage` maps an ngc to `{ file: string, events, earlierVersions: [] }`. The output gains a `lineage` key with exactly that value. `history` and `dateVersions` stay as they are.
  - A lineage file at `app/assets/data/snapshot-112965195/lineage-<ngc>.json`, with the URL `/public/data/snapshot-112965195/lineage-<ngc>.json?v=<stamp>`. It's written only for parcels with at least one event.
  - `loadParcelHistory(sbi, manifestPath?) => { history, dateVersions, lineage }`, where `lineage` is `{}` when the manifest is missing, unreadable, for another SBI, or has no `lineage` key.

- [ ] **Step 1: Write the failing tests**
  - In `convert.test.js`, `buildManifest adds lineage without changing history or dateVersions`: build once without `lineage` and once with `{ AA00001234: { file: '/x.json', events: {}, earlierVersions: [] } }`. `history` and `dateVersions` should be deep-equal, and the second should have `lineage.AA00001234.file === '/x.json'`.
  - In `parcel-history.test.js`, change `EMPTY` to `{ history: {}, dateVersions: {}, lineage: {} }`. Add `a matching manifest gives its lineage` and `a manifest without lineage gives an empty lineage`.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test scripts/parcel-snapshot/*.test.js`
Expected: FAIL. The new `buildManifest` test and the `EMPTY` comparisons fail on the missing `lineage` key.

- [ ] **Step 3: Implement the changes**
  - **`generate.js`:**
    - Keep every version from both directories for `findLineage`, not just the selected parcels.
    - For each selected parcel, call `findLineage(ngc, allVersions, { liveRefs })`. Write `toLineageFile(lineage, { offset })` using that parcel's offset, and pass `{ file, ...lineageSummary(lineage), earlierVersions: [] }` to `buildManifest`.
    - Add an `events` count to the report table.
    - Delete stale `lineage-*.json` files along with the version files. The existing cleanup already removes every `.json` file.
  - **`loadParcelHistory`:** return `lineage: manifest.lineage || {}`.

- [ ] **Step 4: Run the tests**

Run: `node --test scripts/parcel-snapshot/*.test.js`
Expected: all pass.

- [ ] **Step 5: Regenerate from the real snapshot**

Extract each zip into its own new, empty folder in the scratchpad, then run:
`node scripts/parcel-snapshot/generate.js --outputs <scratch>/outputs --adjacent <scratch>/adjacent_outputs`

Expected:
- **Output line:** `11 parcels, 20 previous versions written`, with the `events` column filled in.
- **`git status`:** only `manifest.json` changed, and new `lineage-*.json` files were added. The existing version files are unchanged, which `git diff --stat` confirms.
- **`manifest.json` lineage:** compare it with these values, calculated on 10 November 2026 with the same method:

| Parcel | Event | Expected |
| --- | --- | --- |
| SK40623814 | `20160101` | moved to SK40622425 4.8654, stayed 13.1932 |
| SK40623814 | `20170501` | moved to SK40622501 3.0414, SK40625920 2.9817, SK40624821 1.6386, SK40611696 0.6437, SK40625401 0.4558 (not in business), SK40621602 0.3571, SK40623714 0.1461 (not in business), SK40611699 0.0574 (not in business); stayed 3.8715 |
| SK40622425 | `20160101` | added from SK40623814 4.8654 |
| SK40622425 | `20170501` | moved to SK40621823 0.2609 only (the 0.0003 and 0.0009 ha slivers are dropped) |
| SK40624821 | `20190101` | added from SK40625401 0.4558 and SK40623714 0.1461, both not in business |
| SK40611696 | `20190101` | added from SK40621602 0.1464 |
| SK40626919 | `20160101` | `referenceChangedFrom: "SK40626719"` |
| SK52635702 | `20160101` | moved to SK52626283 0.7455, added from SK52627478 3.4822 (not in business) |
| SK40623931, SK40625920, SK40622501 | | no events |

  A difference in the fourth decimal place is fine. Anything else is a finding to investigate.

- [ ] **Step 6: Commit** (only if the user has agreed to commits)

```bash
git add scripts/parcel-snapshot app/data/v18-1-3-parcel-history.js app/assets/data/snapshot-112965195
git commit -m "Add land movements between parcels to the 1.3.1 history files"
```

### Task 3: Include a renumbered parcel's earlier versions (needs the user's go-ahead)

Ask the user first. SK40626719's version is the same land as SK40626919, but it was never listed under this SBI in the API. If they say no, skip this task: the page will still show the Reference changed from SK4062 6719 note, with no earlier dates.

**Files:**
- Modify: `scripts/parcel-snapshot/convert.js` (`toSnapshotFile`)
- Modify: `scripts/parcel-snapshot/generate.js`
- Test: `scripts/parcel-snapshot/convert.test.js`

**Interfaces:**
- Produces:
  - `toSnapshotFile(version, { sbi, offset, asNgc })`. With `asNgc`, every `SHEET_ID`/`PARCEL_ID` is the new parcel's, so the page's `buildParcelData(selectedNgc)` finds it. `parcel.properties.REFERENCE` is set to `version.ngc`, the reference at the time. Without `asNgc`, the output is unchanged.
  - The manifest's `lineage[ngc].earlierVersions` becomes `[{ file, ref }]`, newest first. File names are `fileName(asNgc, version.validFrom)`.

- [ ] **Step 1: Write the failing tests**
  - `toSnapshotFile with asNgc files the version under the new reference`: check the IDs and `REFERENCE`.
  - `toSnapshotFile without asNgc is unchanged`: deep-equal to the current output.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test scripts/parcel-snapshot/convert.test.js`
Expected: FAIL on `REFERENCE` being undefined.

- [ ] **Step 3: Implement the change**
  - In `toSnapshotFile`, add the `asNgc` option.
  - In `generate.js`, convert each of `lineage.earlierVersions` with the parcel's offset and `asNgc`, and run the same outline-area check. Write the files and fill in `earlierVersions` in the manifest.

- [ ] **Step 4: Run the tests and regenerate**

Run: `node --test scripts/parcel-snapshot/*.test.js`, then the generate command from Task 2.
Expected: all tests pass. One new file is created, `SK40626919-20131216.json`, with `REFERENCE: "SK40626719"` and VALID_FROM/VALID_TO `20131216`/`20151231`. `history` and `dateVersions` are unchanged.

- [ ] **Step 5: Commit** (only if the user has agreed to commits)

```bash
git add scripts/parcel-snapshot app/assets/data/snapshot-112965195
git commit -m "Include SK4062 6719's version in SK4062 6919's 1.3.1 history"
```

### Task 4: Map datasets for land that moved (1.3.1 base)

**Files:**
- Modify: `app/views/v18/1.3.1/_compare-single-map.html`
- Modify: `app/views/v18/1.3.1/view-land-parcel-compare-dates.html` (only the `{% set showLineage = true %}` line, next to `pairByOverlap`)
- Test: `<scratchpad>/scripts/lineage-map.js` (CDP driver, not committed)

**Interfaces:**
- Consumes: the lineage file features from Task 2, with `properties.direction` set to `'moved'` or `'added'`.
- Produces, in the base's global scope, available to the page script:
  - `const SHOW_LINEAGE = {{ 'true' if showLineage else 'false' }}`
  - `DS.lineageMoved = 'land-now-elsewhere'`, `DS.lineageAdded = 'land-added'`
  - `setLineagePieces(features: Feature[], { frame = false } = {}) => void`. This stores the features, calls `setData` on both datasets (split by `direction`) and shows each dataset only while it has features. With `frame`, if the parcel's outline together with the pieces doesn't fit the view, it calls `fitBounds` with padding 40 and duration 500. It does nothing if `!SHOW_LINEAGE`. Before `datasets:ready`, it stores the features, and `buildMap` reads them.

**Map styles:**
- **Moved:** label Land now in another parcel. Grey hatch `fill: '#f3f2f1'`, `fillPattern: 'forward-diagonal-hatch'`, pattern background `#f3f2f1` and foreground `#6f777b`, `stroke: '#505a5f'`, `strokeWidth: 2`, symbol description grey diagonal hatching. This is the same as `buildElsewhereDataset`. It doesn't conflict because `COMPARE_SPLITS` is false on this page.
- **Added:** label Land added from another parcel. `fill: 'transparent'`, `stroke: '#0b0c0c'`, `strokeWidth: 2`, `strokeDashArray: [1, 1.5]`, symbol description black dotted outline.
- **Both:** `showInKey: true`, `showInMenu: false`, hidden while empty.
- **Placement:** add the datasets to `buildMap` only when `SHOW_LINEAGE`. Put both in `restoreZOrder` after the change layers and before `DS.outlinePrevious`. Re-apply them in `swapParcelDatasets`.

- [ ] **Step 1: Write the failing browser check** `lineage-map.js`

Base it on the scratchpad's `verify-fixes.js` pattern. Open `/v18/1.3.1/view-land-parcel-compare-dates?parcel=SK40623814`, wait for `datasetsReady`, then load the lineage file with `cachedFetchJson` and call `setLineagePieces(features, { frame: true })`.

  - **A:** `typeof setLineagePieces === 'function'`, and `hedgeMap.getLayer(DS.lineageMoved)` exists.
  - **B:** after setting the `20170501` features, the moved source has 8 features and the layer is `'visible'`. After `setLineagePieces([])`, it is `'none'`.
  - **C:** after setting the `20170501` moved features with `frame: true`, then waiting for `idle`, `hedgeMap.getBounds()` contains every piece's bounding box.
  - **D:** switch the base map to Satellite and back (through the map-styles plugin, or `hedgeMap.setStyle` as the existing checks do), then wait for `idle`. The moved source still has 8 features.
  - **E:** open `/v18/1.3/view-land-parcel-dates-list?parcel=SK40623814`. The page has no `land-now-elsewhere` layer, and there are no new console errors.

- [ ] **Step 2: Run it to see it fail**

Run: `node <scratchpad>/scripts/lineage-map.js` with headless Chrome on port 9333.
Expected: A fails, because `setLineagePieces` isn't defined.

- [ ] **Step 3: Implement this in the 1.3.1 base, and set `showLineage` on the page**

- [ ] **Step 4: Run it to see it pass**

Run: `node <scratchpad>/scripts/lineage-map.js`
Expected: A–E all pass.

- [ ] **Step 5: Commit** (only if the user has agreed to commits)

```bash
git add app/views/v18/1.3.1/_compare-single-map.html app/views/v18/1.3.1/view-land-parcel-compare-dates.html
git commit -m "Add map layers for land that moved between parcels on 1.3.1"
```

### Task 5: Show land movements on the compare-dates page

**Files:**
- Modify: `app/views/v18/1.3.1/view-land-parcel-compare-dates.html`
- Test: `<scratchpad>/scripts/lineage-page.js` (CDP driver, not committed)

**Interfaces:**
- Consumes: `parcelHistory.lineage`, rendered as `const LINEAGE = {{ parcelHistory.lineage | dump | safe }}`, and `HISTORY`, `setLineagePieces`, `cachedFetchJson`, `fmtNgc` and `loadComparedPair` from the base. `dates[i].from` is the date key, using `.slice(0, 8)`.
- Produces: no new globals. Everything stays inside the page's IIFE.

**What to build:**

- **Event lookup:** `eventFor(date)` returns `lineage.events[date.from.slice(0, 8)]` or `undefined`.
- **Dates table:** add one `<span class="govuk-body-s app-dates-table__change">` per line, on its own line under the date in the Valid from cell. Lines appear in this order:
  - Reference changed from SK4062 6719
  - Land moved to 1 parcel, or Land moved to N parcels
  - Land added from 1 parcel, or Land added from N parcels

  Add the same text to the checkbox's hidden label after the dates, separated by a comma. With Task 3, the earlier version's row has the line Reference SK4062 6719. Append `earlierVersions` to `previous` with their `ref`, so they sort into place by date.
- **Single date** (`renderSingleDate`): if the shown date has an event, add the following after the existing tables:
  - **Reference change:** a `govuk-body` paragraph: Until 31 December 2015 this parcel's reference was SK4062 6719. Use the predecessor's VALID_TO through `longDate`, as supplied. Without Task 3, the date is unknown, so write This parcel's reference changed from SK4062 6719 on 1 January 2016.
  - **Land moved:** an `h3.govuk-heading-s` heading, Where land went on 1 May 2017. Under it, a table with the columns Parcel and Area (ha), one row per link and a final Stayed in this parcel row. There is no total row.
  - **Land added:** an `h3`, Where land came from on 1 January 2019, with the same table but no Stayed row.
  - **Parcel cell:**
    - In the business with history: a link to `view-land-parcel-compare-dates?parcel=<ref>`.
    - In the business without history: a link to `view-land-parcel?parcel=<ref>`.
    - Not in the business: plain `fmtNgc(ref)` with a second line `<span class="govuk-body-s">Not in this business</span>`.
  - **Note:** after the tables, `<p class="govuk-body-s">These areas are worked out by comparing map shapes, so they may not add up exactly.</p>`
  - **Map:** call `setLineagePieces(featuresForEvent, { frame: true })`, taking the features from `cachedFetchJson(lineage.file)` filtered by `event`. With no event, call `setLineagePieces([])`.
  - **Failed load:** if the lineage file fails, log it with `console.error`, keep the tables, and show no pieces.
- **Two dates** (`renderDetails`): collect events with `earlier.from.slice(0, 8) < key <= later.from.slice(0, 8)`. If there are any, add an `h3`, Land that moved between these dates, and a table with the columns Date, Parcel, Change and Area (ha).
  - **Change values:** Moved to, Added from, or Reference changed. A reference change row has `–` for its area.
  - **Map:** call `setLineagePieces([])`, as comparisons show no pieces.
- **Tab switch** (`syncMapToTab`): on `'current'`, call `setLineagePieces([])`. On returning to a single date, call it again for that date.

- [ ] **Step 1: Write the failing browser check** `lineage-page.js`

Check computed styles, not the `hidden` attribute.

  - **A:** SK40623814's Historical tab. The Current row's date cell contains Land moved to 8 parcels. The 1 January 2016 row contains Land moved to 1 parcel. The 1 January 2010 and 1 January 2015 rows have no change line.
  - **B:** tick only the 1 January 2016 row and wait for the details. The heading reads Where land went on 1 January 2016. The table rows are SK4062 2425 (a link to `view-land-parcel-compare-dates?parcel=SK40622425`) at 4.8654, and Stayed in this parcel at 13.1932. There's no total row, and the note paragraph is present.
  - **C:** tick only the Current row. The table has 8 parcel rows plus Stayed. SK4062 5401's cell has no link and contains Not in this business. The map's moved source has 8 features.
  - **D:** SK40624821, tick only the Current row, which starts on `20190101`. The heading reads Where land came from on 1 January 2019, with rows SK4062 5401 0.4558 and SK4062 3714 0.1461, neither linked.
  - **E:** SK40623814, Current row ticked alone. Switching to the Current tab leaves both lineage layers at `'none'`. Switching back to Historical shows the moved layer as `'visible'` with 8 features.
  - **F:** SK40623814, tick the 1 January 2010 row and the Current row, then press Compare. The Land that moved between these dates table has 9 rows: 1 dated 1 January 2016 and 8 dated 1 May 2017. Both lineage layers are `'none'`.
  - **G:** SK40626919. The 1 January 2016 row contains Reference changed from SK4062 6719. Ticking it alone shows the reference paragraph. With Task 3, it reads Until 31 December 2015 this parcel's reference was SK4062 6719, and there's an extra row dated 16 December 2013 with Reference SK4062 6719.
  - **H:** SK40623931 (no events). No change lines, no lineage headings, no console errors.
  - **I:** no element with `[hidden]` has a computed `display` other than `none`, or a non-zero height, with the Historical tab open, in any of the states above.

- [ ] **Step 2: Run it to see it fail**

Run: `node <scratchpad>/scripts/lineage-page.js`
Expected: A fails, because there's no change line.

- [ ] **Step 3: Implement the page changes**, including any `[hidden]` CSS rules the new elements need.

- [ ] **Step 4: Run it to see it pass**

Run: `node <scratchpad>/scripts/lineage-page.js`
Expected: A–I all pass (G in its Task 3 or no-Task-3 form).

- [ ] **Step 5: Commit** (only if the user has agreed to commits)

```bash
git add app/views/v18/1.3.1/view-land-parcel-compare-dates.html
git commit -m "Show where land went and came from on the 1.3.1 compare dates page"
```

### Task 6: Regression checks and docs

**Files:**
- Modify: `CLAUDE.md` (the 1.3.1 paragraph)
- Test: the scratchpad's `verify13.js`, `visible-error.js` and `lineage-*.js`

- [ ] **Step 1: Update `CLAUDE.md`**

Add to the 1.3.1 paragraph: the `lineage` manifest key and `lineage-<ngc>.json` files from `generate.js`, the `showLineage` flag and `setLineagePieces` in the 1.3.1 base, and the 0.01 ha and 99% thresholds. Keep it to 2–3 sentences in the file's existing style.

- [ ] **Step 2: Run every check**

Run, one Chrome page at a time:
- `node --test scripts/parcel-snapshot/*.test.js`
- `node <scratchpad>/scripts/verify13.js` (1.3)
- `node <scratchpad>/scripts/visible-error.js` (1.3 dates list)
- `node <scratchpad>/scripts/lineage-map.js`
- `node <scratchpad>/scripts/lineage-page.js`
- `git status --short app/views/v18/1.3 app/views/v18/1.2 app/routes/v18/1.3 app/routes/v18/1.2`

Expected:
- All unit tests pass.
- 1.3's SK40623814 dates are unchanged, with 11 parcels with history and no console errors.
- The lineage checks pass.
- The `git status` command prints nothing.

- [ ] **Step 3: Check by eye**

Take screenshots of SK40623814's Current row on its own (desktop and a 390px-wide viewport), and of SK40624821's 2019 version. Check that the hatching is visible on Satellite and on the light map, that the Key lists the two new entries, and that the dates table doesn't spill out of the sidebar. Recent 1.3.1 commits fixed that spill.

- [ ] **Step 4: Commit** (only if the user has agreed to commits)

```bash
git add CLAUDE.md
git commit -m "Describe 1.3.1 land movements in CLAUDE.md"
```

## Out of scope

- **Parcels with one version:** SK40621823, SK52625098 and SK52627297 were made from other parcels' land but have no earlier versions of their own, so they open the API-only `view-land-parcel`. Showing Created from land in … there is a follow-up.
- **Map labels:** pieces aren't labelled with their reference on the map, and clicking a piece doesn't select its table row.
- **Other parcels' outlines:** the 1.2 surrounding parcels layer stays switched off.
- **Copy:** the Valid from column header is unchanged.
