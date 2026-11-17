# v18/1.3.2 Splits and Merges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add v18/1.3.2, a copy of 1.3.1 whose Historical tab ends with a Splits and merges table. The table is grouped by date, lists the parcels that land went to or came from, and can show any one change on the map.

**Architecture:**
- **Working out the links:** `scripts/parcel-snapshot/lineage.js` works them out at build time. It intersects each parcel's versions with other parcels' versions that start or end within a day.
- **Groups:** it classifies each change as a group (split, moved, created, merged, added or reference), then fills in links that only one side found.
- **Where the results go:** `generate.js` writes them to a new `lineage` key in the manifest and to one `lineage-<ngc>.json` file of map pieces per parcel. The manifest's `history` and `dateVersions` are unchanged, so 1.3 and 1.3.1 behave as before.
- **The page:** 1.3.2's map base gains datasets for the pieces, and its compare-dates page renders the table and drives the map.

**Tech Stack:** GOV.UK Prototype Kit (Nunjucks, Express), `@defra/interactive-map` 0.0.52 (alias `interactive-map-v52`) datasets plugin, `@turf/intersect` 7.4.0, `@turf/union` 7.4.0, `@turf/area` 7.3.4, Node `node:test`, and headless Chrome over CDP for browser checks.

**Spec:** `docs/superpowers/specs/2026-11-17-v18-1-3-2-splits-and-merges-design.md`. Read it first: its tables of heading wording and real cases are binding. Background is in `app/views/v18/_design-history/splits-and-merges-findings.md`.

## Global Constraints

- **Leave earlier versions alone:** do not edit anything under `app/views/v18/1.3/`, `app/views/v18/1.3.1/`, `app/views/v18/1.2/` or their routes. Shared files may change only as listed: `app/data/v18-1-3-parcel-history.js`, `scripts/parcel-snapshot/`, `app/assets/data/snapshot-112965195/`, `app/routes.js` (one line), `app/views/v18/index.html` (one radio), `package.json`/`package-lock.json` and `CLAUDE.md`.
- **1.3 and 1.3.1 keep working:** for the same input, the manifest's `sbi`, `history` and `dateVersions` stay byte-for-byte the same as now.
- **Dates:** show VALID_FROM and VALID_TO exactly as supplied, through the page's `longDate`. The one-day tolerance is only for matching.
- **Wording:** use the spec's headings exactly, in the form `<longDate>: <lower-case wording>`. Write references with a space, through `fmtNgc`. Areas have 4 decimal places. There is no total row. Don't put quotes around UI labels in copy or comments.
- **Numbers:** drop links under **0.01 ha**. A reference change needs an overlap of at least **99%** of both versions' areas.
- **Other parcels' data:** files contain no geometry or land cover from other parcels. Map pieces are intersections with this parcel's own versions. Other parcels appear only as `ref`, `ha` and flags. The only exception is SK40626719's single version, which the designer approved.
- **Hiding elements:** any element with a GOV.UK class that sets `display` and is toggled with `hidden` needs a `#id[hidden] { display: none; }` rule. Browser checks must test `getComputedStyle(el).display`, not `el.hidden`.
- **Dev server:** never stop the user's dev server. Check against `http://localhost:3000`. Use headless Chrome on port 9333 with an isolated profile in the scratchpad, and stop only that Chrome. Run one page at a time.
- **Git:** work on a new branch, `v18-1.3.2-splits-and-merges`. Leave the uncommitted files already on `main` (design history, findings, earlier plans) alone. Never stage them. Commit only once the user has agreed to commits for this plan, and never push.

## Review Focus

1. **The live version's date key:** SK40623814's live version starts on 1 May 2017. The live date comes from the API's VALID_FROM, which may not be 8 digits, so take the first 8 characters when looking up the change. This is covered by Task 5, check B.
2. **Pieces outside the frame:** land that left lies outside the version's outline. Show on map must frame the parcel and every piece. This is covered by Task 4, check C.
3. **Base map switch:** switching to Satellite rebuilds datasets from their construction-time data. Pieces on the map must survive a switch to Satellite and back. This is covered by Task 4, check D.
4. **State after Hide:** after Show on map, then ticking a date, then Hide, the map, inset and fade must match the ticked dates. No Showing on map row may be left behind. This is covered by Task 5, checks F–H.
5. **Phone width:** below the hybrid breakpoint the inline map isn't mounted. Show on map must not throw, and the change must be on the map when Map view opens. This is covered by Task 5, check K.

---

### Task 1: Create 1.3.2 as a copy of 1.3.1

**Files:**
- Create: `app/routes/v18/1.3.2/routes.js` (a copy of 1.3.1's)
- Create: `app/views/v18/1.3.2/` (copies of the 4 1.3.1 views)
- Modify: `app/routes.js` (add the 1.3.2 line after 1.3.1's, at line 129)
- Modify: `app/views/v18/index.html` (a Version 1.3.2 radio above 1.3.1, `data-start="view-land"`, hint SBI 112965195<br>WIP (Splits and merges))

**Interfaces:**
- Produces: the URL prefix `/v18/1.3.2/` and the session key `sbiV18_132`. The pages are identical to 1.3.1's apart from their paths.

- [ ] **Step 1: Create the branch**

`git checkout -b v18-1.3.2-splits-and-merges`

- [ ] **Step 2: Check that 1.3.2 doesn't exist yet**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/v18/1.3.2/view-land`
Expected: `404`.

- [ ] **Step 3: Copy the files and replace the version**
  - In every copied file, replace `v18/1.3.1` with `v18/1.3.2` and `sbiV18_131` with `sbiV18_132`.
  - Update the copied comments that say 1.3.1 to say 1.3.2, where they describe this copy.
  - Add the `app/routes.js` line and the index radio.

- [ ] **Step 4: Check the copy**

Run:
```bash
grep -rn "1\.3\.1\|sbiV18_131" app/views/v18/1.3.2 app/routes/v18/1.3.2
for p in view-land "view-land-parcel-compare-dates?parcel=SK40623814" "view-land-parcel?parcel=SK40623931"; do curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:3000/v18/1.3.2/$p"; done
git status --short app/views/v18/1.3.1 app/routes/v18/1.3.1
```
Expected:
- `grep` prints only comments that say the copy came from 1.3.1, or nothing.
- Each page returns `200`.
- `git status` prints nothing.

- [ ] **Step 5: Commit** (only if the user has agreed to commits)

```bash
git add app/routes.js app/routes/v18/1.3.2 app/views/v18/1.3.2 app/views/v18/index.html
git commit -m "Add v18/1.3.2, a copy of 1.3.1 for splits and merges"
```

### Task 2: Work out splits and merges from the snapshot

**Files:**
- Create: `scripts/parcel-snapshot/lineage.js`
- Create: `scripts/parcel-snapshot/lineage.test.js`
- Modify: `scripts/parcel-snapshot/convert.js` (export `shift`)
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes:
  - Versions from `convert.js`'s `parseVersionName` plus `features`, in the form `{ ngc, validFrom, validTo, features }`. Features are raw snapshot covers with `GEOM_AREA_SQM`.
  - `shift(geometry, { dLng, dLat })` from `convert.js`.
- Produces:
  - `dayAfter(yyyymmdd) => string`, worked out in UTC. For example, `'20151231'` gives `'20160101'`.
  - `findLineage(ngc, versions, { liveRefs: Set<string>, minHa = 0.01 }) => Lineage`
    - `Lineage = { groups: Group[], pieces: Piece[], earlierVersions: Version[] }`
    - `Group = { date: 'YYYYMMDD', direction: 'out' | 'in' | 'reference', kind: 'split' | 'moved' | 'created' | 'merged' | 'added' | 'reference', links: Link[], ownHa?: number, mapDate: 'YYYYMMDD' }`
    - `Link = { ref, ha, inBusiness: boolean }`
    - `Piece = { date, direction: 'out' | 'in' | 'stayed', ref?: string, ha, geometry }`, with the geometry not shifted.
  - `makeSymmetric(lineageByNgc: { [ngc]: Lineage }) => { [ngc]: Lineage }`. It returns new objects and doesn't change its input.
  - `toLineageFile(lineage, { offset }) => FeatureCollection`. Each feature has the properties `{ date, direction, ref, ha }` and a shifted geometry.
  - `lineageSummary(lineage) => { groups: Group[] }`, with `ha` and `ownHa` rounded to 4 decimal places as numbers.

**The algorithm.** This is the 1.3.1 plan's Task 1 algorithm, with additions.
- **Zero-length versions:** ignore them everywhere (`validFrom === validTo`).
- **Order:** sort this parcel's versions oldest first, as `own[0..n]`.
- **Outline:** the union of a version's cover geometries.
- **Area of a piece:** `area(piece) / area(outline(v)) * Σ GEOM_AREA_SQM(v) / 10000`, where `v` is the version the piece was cut from.
- **Out, for `k > 0`, with `before = own[k-1]`:**
  - Candidates are other references' versions `w` with `w.validFrom` equal to `before.validTo` or to `dayAfter(before.validTo)`.
  - Each link is `before ∩ w`.
  - `ownHa` is the area of `before ∩ own[k]`, and that intersection is a `'stayed'` piece.
  - `date = own[k].validFrom` and `mapDate = before.validFrom`.
  - `kind` is `'split'` if every link's `w` is the earliest version of its reference in the data, otherwise `'moved'`.
- **In, for any `k`:**
  - Candidates are other references' versions `u` where `u.validTo` equals `own[k].validFrom`, or `dayAfter(u.validTo)` does.
  - Each link is `own[k] ∩ u`.
  - `date = mapDate = own[k].validFrom`.
  - `kind`:
    - `'created'` when `k === 0`, and `ownHa` is left out.
    - Otherwise `'merged'`, if every `u` is the latest version of its reference and `u.validTo !== '99991231'`. Here `ownHa` is the area of `own[k] ∩ own[k-1]`.
    - Otherwise `'added'`, with `ownHa` worked out the same way.
- **Reference change, when `k === 0`:**
  - It applies when an in link from `u` has `ha` at least 99% of `own[0]`'s area and at least 99% of `u`'s.
  - Replace that link with a `{ direction: 'reference', kind: 'reference', links: [{ ref: u.ngc, ha: <own[0] area>, inBusiness }], mapDate: own[0].validFrom }` group.
  - Set `earlierVersions` to `u.ngc`'s versions, oldest first. Go back one level only.
- **Dropping and sorting:**
  - Drop links under `minHa`, and drop a group left with no links.
  - Sort links by `ha` descending, then by `ref`.
  - Sort groups by `date`, then by direction: `out`, `reference`, `in`.
- **Pieces:** one for each link kept (`direction` `'out'` or `'in'`, with its `ref`), plus the `'stayed'` piece for each out group.
- **`makeSymmetric`:**
  - For every out group in A that links to B, where B is a key in the map: B must have an in group on the same `date` that links to A.
  - If it doesn't, add a link `{ ref: A, ha: <A's figure>, inBusiness: true }` to B's in group for that date, creating the group if needed.
  - Do the same for in groups that are missing their out side.
  - Re-run the kind rules on any group that changes. The kind rules need to know whether a reference is new or has ended, so `findLineage` must also return `facts: { [ref]: { first: validFrom, last: validTo } }` for every reference it saw. `makeSymmetric` uses those facts.
  - Added links get no pieces.

- [ ] **Step 1: Install the turf packages**

`npm install --save-dev --no-audit @turf/intersect@7.4.0 @turf/union@7.4.0 @turf/area@7.3.4`

Expected: `package.json` gains these three packages under `devDependencies`. Use `--no-audit` because `npm audit` crashes on the map alias.

- [ ] **Step 2: Write the failing tests** in `lineage.test.js`

Use synthetic rectangles only. Copy the `rect`, `cover` and `version` helpers from `convert.test.js`, at `LAT = 53.15`, and set `GEOM_AREA_SQM` to each rectangle's `@turf/area`. A is `[0,0,2,1]` from `20100101` to `20160101`, then `[0,0,1,1]` from `20160101` to `99991231`.
- **`dayAfter rolls over months and years`:** `'20151231'` gives `'20160101'`, `'20170501'` gives `'20170502'` and `'20240228'` gives `'20240229'`.
- **`land leaving to a new parcel is a split`:** B is `[1,0,2,1]` from `20160101` to `99991231`, and is B's only version. A has one group `{ date: '20160101', direction: 'out', kind: 'split', mapDate: '20100101' }`, with B's `ha` and `ownHa` each about half A's first area, give or take 0.0001. Its pieces are 1 `out` (B) and 1 `stayed`.
- **`land leaving to an existing parcel is moved`:** B also has an earlier version, `[1,1,2,2]` from `20100101` to `20160101`. The `kind` is `'moved'`.
- **`a parcel that starts a day later still counts`:** B starts `20160102`, so B is in the group. If B starts `20160103`, there is no group.
- **`a version ending on 31 December links to one starting on 1 January`:** A's first version ends `20151231`, and A's next version and B start on `20160101`. B is in the `20160101` group.
- **`a new parcel made from another is created`:** `findLineage('B', ...)` gives `{ date: '20160101', direction: 'in', kind: 'created' }`, linking A, with no `ownHa`.
- **`parcels that ended and joined are merged`:** C is `[2,0,3,1]` from `20100101` to `20190101`. A gains `[0,0,3,1]` from `20190101` to `99991231` after `[0,0,2,1]` from `20160101` to `20190101`. The result is `kind: 'merged'`, with `ownHa` equal to the `[0,0,2,1]` area.
- **`land from a parcel that carries on is added`:** as above, but C continues with `[2.5,0,3,1]` from `20190101` to `99991231`. The result is `kind: 'added'`.
- **`slivers under 0.01 ha are dropped`:** B overlaps A by about 50 m² only, so there is no link and no group.
- **`zero-length versions are ignored`:** adding `B_20160101_20160101` doesn't change the result.
- **`inBusiness follows liveRefs`**
- **`a reference change is its own group`:** U is `[0,0,1,1]` from `20131216` to `20151231`, and A is the same shape from `20160101` to `99991231`. The result is one group `{ direction: 'reference', links: [{ ref: 'U' }] }`, with `earlierVersions` holding U's version.
- **`half an overlap is not a reference change`:** U covers half of A's first version, so the result is `kind: 'created'`, linking U.
- **`makeSymmetric fills the missing side`:** A has an out link to B for 1.5 ha and B has no groups. B then has an in group with A at 1.5, and the input is unchanged.
- **`makeSymmetric leaves complete pairs alone`**
- **`toLineageFile shifts pieces and labels them`:** with `{ dLng: 0.0001, dLat: 0.00002 }`, the coordinates are the piece's minus the offset, as in `convert.js`.
- **`lineageSummary rounds to 4 places and drops pieces`**

- [ ] **Step 3: Run the tests to see them fail**

Run: `node --test scripts/parcel-snapshot/lineage.test.js`
Expected: FAIL with `Cannot find module './lineage'`.

- [ ] **Step 4: Implement `lineage.js` and export `shift`**

- [ ] **Step 5: Run every parcel snapshot test**

Run: `node --test scripts/parcel-snapshot/*.test.js`
Expected: all pass, including the existing ones.

- [ ] **Step 6: Commit** (only if the user has agreed to commits)

```bash
git add package.json package-lock.json scripts/parcel-snapshot/lineage.js scripts/parcel-snapshot/lineage.test.js scripts/parcel-snapshot/convert.js
git commit -m "Work out splits and merges from the RPA snapshot"
```

### Task 3: Write lineage and SK40626719's version to the snapshot files

**Files:**
- Modify: `scripts/parcel-snapshot/convert.js` (`buildManifest` and `toSnapshotFile`)
- Modify: `scripts/parcel-snapshot/generate.js`
- Modify: `app/data/v18-1-3-parcel-history.js`
- Test: `scripts/parcel-snapshot/convert.test.js`, `scripts/parcel-snapshot/parcel-history.test.js`

**Interfaces:**
- Consumes: from Task 2, `findLineage` (with its `facts`), `makeSymmetric`, `toLineageFile` and `lineageSummary`.
- Produces:
  - `buildManifest(selected, { sbi, stamp, lineage = {} })`. The output gains `lineage: { [ngc]: { file: string | null, groups, earlierVersions: [{ file, ref, validFrom, validTo }] } }`, where `earlierVersions` is newest first. `history` and `dateVersions` are unchanged.
  - Lineage files at `app/assets/data/snapshot-112965195/lineage-<ngc>.json`, served at `/public/data/snapshot-112965195/lineage-<ngc>.json?v=<stamp>`. One is written only for parcels with at least one piece, and `file` is `null` otherwise.
  - `toSnapshotFile(version, { sbi, offset, asNgc })`. With `asNgc`, every `SHEET_ID`/`PARCEL_ID` is `asNgc`'s, and `parcel.properties.REFERENCE` is `version.ngc`. Without `asNgc`, the output is unchanged.
  - The earlier-version file name is `fileName(asNgc, version.validFrom)`, which gives `SK40626919-20131216.json`.
  - `loadParcelHistory(sbi, manifestPath?) => { history, dateVersions, lineage }`. `lineage` is `{}` whenever `history` is `{}`, or when the manifest has no `lineage` key.

- [ ] **Step 1: Write the failing tests**
  - **`buildManifest adds lineage without changing history or dateVersions`:** build with and without `lineage`. `history` and `dateVersions` are deep-equal, and `lineage` is passed through as given.
  - **`toSnapshotFile with asNgc files the version under the new reference`:** check the IDs and `REFERENCE`.
  - **`toSnapshotFile without asNgc is unchanged`:** deep-equal to the current output.
  - **`parcel-history.test.js`:** `EMPTY` becomes `{ history: {}, dateVersions: {}, lineage: {} }`. Add two tests, `a matching manifest gives its lineage` and `a manifest without lineage gives an empty lineage`.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test scripts/parcel-snapshot/*.test.js`
Expected: FAIL on the missing `lineage` key and on `REFERENCE`.

- [ ] **Step 3: Implement the changes**
  - **`generate.js`:**
    - Keep every version from both folders for `findLineage`.
    - Run `findLineage` for each selected parcel, then `makeSymmetric` over the selected parcels.
    - Write `toLineageFile` with the parcel's own offset.
    - Convert each of `earlierVersions` with `toSnapshotFile(..., { asNgc })` and the parcel's offset, running the same outline area check.
    - Pass everything to `buildManifest`, and add a `groups` column to the report.
    - The existing cleanup already removes stale `.json` files.
  - **`loadParcelHistory`:** return `lineage: manifest.lineage || {}`.

- [ ] **Step 4: Run the tests**

Run: `node --test scripts/parcel-snapshot/*.test.js`
Expected: all pass.

- [ ] **Step 5: Regenerate from the real snapshot**

Unzip `~/Downloads/outputs.zip` and `~/Downloads/adjacent_outputs.zip`, each into its own new, empty scratchpad folder. Then run:
`node scripts/parcel-snapshot/generate.js --outputs <scratch>/outputs --adjacent <scratch>/adjacent_outputs`

Expected:
- **Output:** `11 parcels`, and `20 previous versions written` plus the 1 earlier version.
- **Existing files:** `git diff --stat app/assets/data/snapshot-112965195` shows only `manifest.json` changed. Every existing version file is untouched.
- **New files:** `lineage-*.json` files, and `SK40626919-20131216.json` with `REFERENCE: "SK40626719"` and VALID_FROM/VALID_TO `20131216`/`20151231`.
- **1.3 and 1.3.1 keys:** this prints `same`:
  ```bash
  node -e "const a=require('./app/assets/data/snapshot-112965195/manifest.json');const b=JSON.parse(require('child_process').execSync('git show HEAD:app/assets/data/snapshot-112965195/manifest.json'));const s=o=>JSON.stringify([o.sbi,o.history,o.dateVersions]).replace(/\?v=\d+/g,'');console.log(s(a)===s(b)?'same':'DIFFERENT')"
  ```
- **`lineage` groups:** they match this table. Areas may differ in the fourth decimal place. Anything else is a finding to investigate and record in the ledger.

| Parcel | Date | Group |
| --- | --- | --- |
| SK40623814 | 20160101 | out, split: SK40622425 4.8654; ownHa 13.1932 |
| SK40623814 | 20170501 | out, split: SK40622501 3.0414, SK40625920 2.9817, SK40624821 1.6386, SK40611696 0.6437, SK40625401 0.4558 (not in business), SK40621602 0.3571, SK40623714 0.1461 (not in business), SK40611699 0.0574 (not in business); ownHa 3.8715 |
| SK40622425 | 20160101 | in, created: SK40623814 4.8654 |
| SK40622425 | 20170501 | out, split: SK40621823 about 0.2609 (it starts 20170502) |
| SK40622501, SK40625920 | 20170501 | in, created: SK40623814 3.0414 and 2.9817 |
| SK40624821 | 20170501 | in, created: SK40623814 1.6386 |
| SK40624821 | 20190101 | in, merged: SK40625401 0.4558, SK40623714 0.1461; ownHa about 1.6386 |
| SK40611696 | 20190101 | in, added: SK40621602 0.1464 |
| SK40621602 | 20190101 | out, moved: SK40611696 0.1464 |
| SK40626919 | 20160101 | reference: SK40626719 1.2702 |
| SK52635702 | 20160101 | out, split: SK52626283 0.7455; then in, merged: SK52627478 3.4822 (not in business) |
| SK52626283 | 20160101 | in, created: SK52627478 about 3.86 and SK52635702 0.7455 |
| SK52626283, SK52635702 | 20170101 | a group is expected (the findings' 0.7% event with SK52625098 and SK52627297). Record its values in the ledger. |
| SK40623931 | none | no groups expected |

- [ ] **Step 6: Commit** (only if the user has agreed to commits)

```bash
git add scripts/parcel-snapshot app/data/v18-1-3-parcel-history.js app/assets/data/snapshot-112965195
git commit -m "Add splits and merges, and SK4062 6719's version, to the parcel history files"
```

### Task 4: Map datasets for splits and merges (1.3.2 base)

**Files:**
- Modify: `app/views/v18/1.3.2/_compare-single-map.html`
- Test: `<scratchpad>/scripts/lineage-map.js` (a CDP driver, not committed)

**Interfaces:**
- Consumes: the lineage file features from Task 3, with `properties.direction` set to `'out'`, `'in'` or `'stayed'`.
- Produces, in the base's global scope:
  - `DS.lineageOut = 'land-now-elsewhere'`, `DS.lineageIn = 'land-added'` and `DS.lineageStayed = 'land-stayed'`.
  - `setLineagePieces(features: Feature[], { frame = false } = {}) => void`:
    - It stores the features, calls `setData` on the three datasets (split by `direction`), and shows each one only while it has features.
    - With `frame`, it fits the map to the parcel outline plus every piece, with padding 40 and duration 500.
    - Called before `datasets:ready`, it only stores the features, and `buildMap` applies them. This also covers phones, where the map mounts later.

**Map styles:**
- **Out:** labelled Land now in another parcel. It uses the same style as `buildElsewhereDataset`: grey `forward-diagonal-hatch` on `#f3f2f1`, foreground `#6f777b`, stroke `#505a5f` at width 2.
- **In:** labelled Land added from another parcel. Fill `transparent`, stroke `#0b0c0c`, width 2, `strokeDashArray: [1, 1.5]`.
- **Stayed:** labelled This parcel after the change. Fill `#ffdd00` at opacity 0.5, stroke `#0b0c0c`, width 3.
- **All three:** `showInKey: true`, `showInMenu: false`, hidden while empty.
- **Placement:** add them in `buildMap`, with `restoreZOrder` placing them after the change layers and before `DS.outlinePrevious`. Re-apply them in `swapParcelDatasets`.
- **Labels:** optional. If a native MapLibre symbol layer (taking the map from the `map:ready` event's `e.map`) can show `ref` with the style's glyphs on both base maps, add it for the out and in pieces. If it can't, skip it and write a Ruling in the ledger.

- [ ] **Step 1: Write the failing browser check**

Follow the CDP pattern in memory note `headless-chrome-cdp-map-verification.md`. Open `/v18/1.3.2/view-land-parcel-compare-dates?parcel=SK40623814`, wait for `datasetsReady`, load `lineage-SK40623814.json` with `cachedFetchJson`, then call `setLineagePieces(<20170501 features>, { frame: true })`.
- **A:** `typeof setLineagePieces === 'function'`, and the `DS.lineageOut` layer exists.
- **B:** the out source has 8 features, the stayed source has 1, and both are `'visible'`. After `setLineagePieces([])`, all three are `'none'`.
- **C:** after `idle`, `getBounds()` contains every piece's bounding box.
- **D:** switch to Satellite and back, then wait for `idle`. The out source still has 8 features.
- **E:** `/v18/1.3.1/view-land-parcel-compare-dates?parcel=SK40623814` has no `land-now-elsewhere` layer.

- [ ] **Step 2: Run it to see it fail**

Run: `node <scratchpad>/scripts/lineage-map.js`
Expected: A fails.

- [ ] **Step 3: Implement it in the 1.3.2 base**

- [ ] **Step 4: Run it to see it pass**

Run: `node <scratchpad>/scripts/lineage-map.js`
Expected: A–E pass.

- [ ] **Step 5: Commit** (only if the user has agreed to commits)

```bash
git add app/views/v18/1.3.2/_compare-single-map.html
git commit -m "Add map layers for splits and merges to 1.3.2"
```

### Task 5: The Splits and merges section on the Historical tab

**Files:**
- Modify: `app/views/v18/1.3.2/view-land-parcel-compare-dates.html`
- Test: `<scratchpad>/scripts/lineage-page.js` (a CDP driver, not committed)

**Interfaces:**
- Consumes:
  - `const LINEAGE_ALL = {{ parcelHistory.lineage | dump | safe }}`, then `const LINEAGE = LINEAGE_ALL[selectedNgc] || { file: null, groups: [], earlierVersions: [] }`.
  - `const HISTORY_REFS = {{ parcelHistory.history | dump | safe }}`, for has-history links.
  - From the base: `setLineagePieces`, `cachedFetchJson`, `fmtNgc` and `longDate`, plus the page's own `renderSingleDate`, `renderDetails` and `syncMapToTab`.
- Produces: no new globals. Everything stays inside the page's IIFE.

**What to build** (the spec's What the user sees section is binding):
- **Section:** `<h2 class="govuk-heading-m">Splits and merges</h2>` after the Compare button, inside the Historical panel. Leave it out completely when there are no groups.
- **Table:** one `govuk-table`, with a header row of Parcel and Area (ha), the area column right-aligned. Each group is its own `<tbody>`:
  - **Heading row:** `<th scope="rowgroup">` with the heading text on a `#f3f2f1` background, and a cell holding the map control.
  - **Link rows:** one per link.
  - **Final row:** Stayed in this parcel for `out` groups, Already in this parcel for `merged` and `added` groups, and none for `created` groups.
  - **Reference group:** a single row with `fmtNgc(ref)` and, on a second line, Old reference for this land, with no map control.
- **Headings:** `<longDate(date)>: <wording>`.

  | `kind` | Wording |
  | --- | --- |
  | `split` | `split into ${links.length + 1} parcels` |
  | `moved` | one link: `land moved to ${fmtNgc(ref)}`; more: `land moved to ${n} parcels` |
  | `created` | one link: `created from ${fmtNgc(ref)}`; more: `created from ${n} parcels` |
  | `merged` | `merged with ${n} parcel` or `merged with ${n} parcels` |
  | `added` | one link: `land added from ${fmtNgc(ref)}`; more: `land added from ${n} parcels` |
  | `reference` | `reference changed` |

- **Parcel cell:**
  - In the business and in `HISTORY_REFS`: a link to `/v18/1.3.2/view-land-parcel-compare-dates?parcel=<ref>`.
  - In the business, not in `HISTORY_REFS`: a link to `/v18/1.3.2/view-land-parcel?parcel=<ref>`.
  - Not in the business: `fmtNgc(ref)`, then `<br><span class="govuk-body-s app-secondary">Not in this business</span>`.
- **Explanation:** after the table, `<p class="govuk-body-s app-secondary">` with the spec's explanation word for word.
- **Map control:**
  - A `<button type="button" class="govuk-link app-link-button">` with the text Show on map, and visually hidden text naming the heading.
  - While active, the cell shows `<span class="govuk-body-s app-secondary">Showing on map</span>` and a Hide button styled the same way.
  - One control at a time.
  - A single `role="status"` region announces Showing <heading> on the map, and Removed <heading> from the map.
- **Show on map:**
  1. Load the version for `group.mapDate` onto the map, using the same loading path `renderSingleDate` uses, without changing the ticks.
  2. Hide the compare summary, the single-date inset, the fade control and `#pair-details`.
  3. Call `setLineagePieces(features where properties.date === group.date and the direction matches the group, plus that date's stayed piece for out groups, { frame: true })`.
- **The live version:** match the live row through `date.from.slice(0, 8)`.
- **Hide:** call `setLineagePieces([])`, then re-run whatever the Historical tab would show for the current ticks. That is `renderSingleDate`, `renderDetails`, or the untouched default. It brings back the elements step 2 hid.
- **Clearing:** a tick change, Compare, or a tab switch first clears an active change, as Hide does but with no status message, then carries on as in 1.3.1.
- **SK40626719's version:** append `LINEAGE.earlierVersions` to the page's `previous` list, so the row sorts by date. Its single-date inset is `Valid to <longDate(validTo)>. Reference at the time: <fmtNgc(ref)>.`
- **Failed load:** if the lineage file fails, use `console.error`. The table still renders, and Show on map shows the version with no pieces.
- **CSS:** define `.app-secondary { color: #505a5f; }` and `.app-link-button`, a button reset (no border, background or padding, with inherited font) so it looks like a `govuk-link`. Add `[hidden]` rules for every toggled element that has a GOV.UK display class. Let cells wrap, so the table fits the sidebar, following the 1.3.1 dates table fix in `fe47088d`.

- [ ] **Step 1: Write the failing browser check** `lineage-page.js`

Check computed styles throughout.
- **A:** SK40623814's Historical tab has an h2 reading Splits and merges, and two `tbody` groups, headed 1 January 2016: split into 2 parcels and 1 May 2017: split into 9 parcels. The rows are in the order given in the spec, with no total row, and the explanation paragraph comes after the table.
- **B:** in the 1 May 2017 group, SK4062 2501 links to `view-land-parcel-compare-dates?parcel=SK40622501`. SK4062 5401 has no link and reads Not in this business. The last row is Stayed in this parcel, 3.8715.
- **C:** press Show on map for 1 May 2017. That cell reads Showing on map with a Hide button, the other group still has Show on map, the out source has 8 features, and the status region names the change. The inset, fade and summary all compute to `display: none`.
- **D:** SK40624821 has a group 1 January 2019: merged with 2 parcels, with Already in this parcel as its last row, and 1 May 2017: created from SK4062 3814.
- **E:** SK40626919 has a group 1 January 2016: reference changed, with one row (SK4062 6719 / Old reference for this land) and no map button. The dates table has a 16 December 2013 row. Ticking it alone shows the inset Valid to 31 December 2015. Reference at the time: SK4062 6719.
- **F:** on SK40623814, press Show on map, then tick 1 January 2016. All the lineage layers are `'none'`, no cell reads Showing on map, and the single-date inset is visible.
- **G:** tick 1 January 2016, press Show on map for 1 May 2017, then press Hide. The single-date inset for 1 January 2016 is visible again, and the lineage layers are `'none'`.
- **H:** press Show on map, then switch to the Current tab and back. No change is active.
- **I:** SK40623931 has no Splits and merges heading and no console errors.
- **J:** no `[hidden]` element has a computed `display` other than `none`, in every state above.
- **K:** at a 390px-wide viewport, press Show on map. There are no errors. Open Map view, wait for `datasetsReady`, and the out source has 8 features.

- [ ] **Step 2: Run it to see it fail**

Run: `node <scratchpad>/scripts/lineage-page.js`
Expected: A fails.

- [ ] **Step 3: Implement the page changes**

- [ ] **Step 4: Run it to see it pass**

Run: `node <scratchpad>/scripts/lineage-page.js`
Expected: A–K pass.

- [ ] **Step 5: Commit** (only if the user has agreed to commits)

```bash
git add app/views/v18/1.3.2/view-land-parcel-compare-dates.html
git commit -m "Show splits and merges on the 1.3.2 Historical tab"
```

### Task 6: Regression checks and docs

**Files:**
- Modify: `CLAUDE.md`
- Test: `<scratchpad>/scripts/regress.js` (a CDP driver, not committed)

- [ ] **Step 1: Update `CLAUDE.md`**
  - Add `v18/1.3.2` to the list of active versions.
  - Add 2–3 sentences in the file's style: 1.3.2 copies 1.3.1 and adds a Splits and merges table to the Historical tab; `generate.js` writes the `lineage` manifest key and the `lineage-<ngc>.json` files; and the 0.01 ha and 99% thresholds.

- [ ] **Step 2: Write and run the regression check**

`regress.js` opens these pages one at a time, then collects console errors and the dates table row text:
- `/v18/1.3/view-land-parcel-dates-list?parcel=SK40623814`
- `/v18/1.3.1/view-land-parcel-compare-dates?parcel=SK40623814`
- `/v18/1.3.1/view-land-parcel-compare-dates?parcel=SK40626919`

Run:
- `node --test scripts/parcel-snapshot/*.test.js`
- `node <scratchpad>/scripts/regress.js`
- `node <scratchpad>/scripts/lineage-map.js`
- `node <scratchpad>/scripts/lineage-page.js`
- `git status --short app/views/v18/1.3 app/views/v18/1.3.1 app/views/v18/1.2 app/routes/v18/1.3 app/routes/v18/1.3.1 app/routes/v18/1.2`

Expected:
- All the tests pass.
- 1.3 shows SK40623814's three dates, as before.
- 1.3.1 shows SK40626919 with no 16 December 2013 row and no Splits and merges heading.
- There are no new console errors. The known string native ID warnings from the datasets plugin are fine.
- The lineage checks pass.
- `git status` prints nothing.

- [ ] **Step 3: Check by eye**

Take screenshots of SK40623814 with 1 May 2017 on the map, on desktop and at 390px wide, and of SK40624821's merge. Check:
- the hatching and yellow are visible on both Satellite and the light map
- the Key lists the new entries
- the table doesn't spill out of the sidebar

- [ ] **Step 4: Commit** (only if the user has agreed to commits)

```bash
git add CLAUDE.md
git commit -m "Describe v18/1.3.2 in CLAUDE.md"
```

## Out of scope

- **Parcels with one version:** SK40621823, SK52625098 and SK52627297 have no history, so they open `view-land-parcel` and have no Splits and merges section.
- **A design history page** for 1.3.2.
- **Selecting a piece on the map** to select its table row.
- **Following ticked dates:** the section never filters by the dates ticked above it.
