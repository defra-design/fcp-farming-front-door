# Land summary prototype — technical notes (v1.0)

Companion to `design-history.html`. The design history is for service-design
and review audiences; this file is for the next developer on the prototype.

## Files in this iteration

| File | Route | Purpose |
| --- | --- | --- |
| `view-land.html` | `/v18/view-land` | Default layout — sidebar left, map right |
| `view-land-parcel.html` | `/v18/view-land-parcel?parcel=<NGC>` | Default layout — single parcel |
| `view-land-alt.html` | `/v18/view-land-alt` | Alternative layout — map left, sidebar right |
| `view-land-parcel-alt.html` | `/v18/view-land-parcel-alt?parcel=<NGC>` | Alternative layout — single parcel |

`NGC` is a composite key built from `SHEET_ID + PARCEL_ID`. It is computed
client-side from the WFS response and used both as the URL parameter and as
the row id in the summary table (`tr[data-ngc]`).

## Data sources

All four pages fetch directly from the RPA WFS endpoints on
`environment.data.gov.uk`. No server-side proxy or cache.

| Layer | Used by | Filter |
| --- | --- | --- |
| `RPA:LandParcels` | Summary, detail | `SBI=<sbi>` (summary), plus `AND PARCEL_ID=<id>` (detail) |
| `RPA:LandCovers` | Summary, detail | Same as above |
| `RPA:HedgeControl` | Detail only | `SBI=<sbi> AND REF_PARCEL_PARCEL_ID=<id>` |

Output format: `application/json`, SRS: `EPSG:4326`. SBI is hardcoded as
`106332870` in all four files.

On the summary page the dominant land cover per parcel is computed as the
land-cover feature with the largest area within that parcel — this is
derived in JS, not from the WFS.

## Map composition

Two different ways of putting features on the map are used in this prototype:

- **Summary** (`view-land(-alt).html`) — uses `interactPlugin` and adds the
  parcel boundaries directly as a MapLibre GeoJSON source/layer pair
  (`parcels-fill` invisible for hit-testing, `parcels-outline` for the visible
  stroke). This keeps the parcels list lightweight and lets selection drive
  the table highlight via `interact:selectionchange`. The fill+outline layers
  are re-added after a `map:stylechange` event.
- **Detail** (`view-land-parcel(-alt).html`) — uses `datasetsMaplibrePlugin`
  with one dataset per land cover description, plus a final `parcel-outline`
  dataset on top. Datasets are assembled from the WFS responses *before* the
  map is constructed, then passed in via `plugins: [...]`. The map is fitted
  to the parcel feature inside `map:ready`.

## Land cover styling

`landCoverColors` and `landCoverPatterns` (defined inline in the parcel
files) drive the dataset styles. Patterned land covers (`Farm Building`,
`Farmyards`, `Hard Standings`, `Residential dwelling, House`,
`Scrub - Ungrazeable`, `Arable Land`, `Permanent Grassland`, `Woodland`)
get a `fillPattern` overlay so that visually similar fills can still be told
apart and the map remains legible printed in black and white.

If a land cover description comes back from the WFS that's not in the colour
map, it falls back to `#CCCCCC`. Worth widening the colour map as new types
appear.

## Layout shell (CSS)

- `html, body { height: 100%; overflow: hidden }` — the page is a fixed
  viewport, not a scrolling document.
- `.app-map-fullscreen` is a flex row holding the sidebar and the map.
- `.app-map-fullscreen__sidebar` is `flex: 0 0 33.3333%` with internal scroll
  via `overflow-y: auto`.
- The default and alt files differ only in the order of the two child
  elements inside `.app-map-fullscreen`.
- At `max-width: 640px` the sidebar takes the full viewport and the map
  column collapses to zero width but stays in the DOM so the component can
  go fullscreen on demand.
- `html.im-is-fullscreen .govuk-header, html.im-is-fullscreen .govuk-service-navigation { display: none }`
  hides the GOV.UK chrome while the map is fullscreen.

## "Map view" button relocation

On mobile, the interactive-map component renders an open-map button. We move
it into the sidebar so it sits with the rest of the controls:

```js
function moveMapButton() {
  const btn = document.querySelector('.im-c-open-map-button')
  const slot = document.getElementById('map-button-slot')
  if (btn && slot && !slot.contains(btn)) {
    slot.appendChild(btn)
    return true
  }
  return false
}
```

The component inserts the button asynchronously, so a `MutationObserver` on
`#main-content` catches late insertions and disconnects after the first
successful move.

## Things to change before any pilot

- **Hardcoded SBI** (`const sbi = '106332870'`) — replace with the existing
  business-picker pattern.
- **Date input is decorative** — wire to a query parameter and make the
  WFS query honour it (or fetch and filter client-side if the WFS doesn't
  support time).
- **"Last updated 1 January 2010"** is hardcoded markup; it should come
  from the WFS feature's update timestamp.
- **Inert service-nav items** — `Register land` and `Get maps of your land`
  go to `#`.
- **Search plugin** is imported and instantiated commented out
  (`// defra.searchPlugin()`); decide whether to re-enable.
- **Hedgerows on the map** — fetched and listed but not drawn. Add a
  hedgerow dataset (line geometry) on the parcel-detail page.
- **Empty, error and loading states** — the only failure path is a
  `console.error` and a `–` in two cells.
- **Accessibility** — `cursor: pointer` is set on parcel rows but only the
  link in the first cell is keyboard-activatable. The whole row should
  either become focusable or the visual affordance should be reserved for
  the link.

## Running the prototype

This prototype runs on the GOV.UK Prototype Kit. From the project root:

```
npm install
npm run dev
```

Then visit `http://localhost:3000/v18/view-land` (or any of the four routes
above). The Defra interactive-map plugin is loaded via the prototype kit's
plugin-assets path; if the map fails to render, check that
`/plugin-assets/%40defra%2Finteractive-map/...` URLs return 200 in the
network tab.
