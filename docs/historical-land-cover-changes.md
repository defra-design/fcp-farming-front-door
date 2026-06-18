# Land cover changes: before vs current

Comparison of each parcel's land covers between the supplied historical ("before")
extract and the current live RPA LandCovers data. Areas are in m²; each parcel's
total is conserved, so the changes are redistributions of cover within the parcel.

## SX3964 7821 — changed on 3 February 2026

The **Track (natural surface) was extended**, taking that area from permanent
grassland. Hard standings and the watercourse were untouched.

| Land cover | Before (m²) | Now (m²) | Change |
|---|--:|--:|--:|
| Track – Natural Surface | 307.4 | 665.1 | **+357.7** (≈2.2×) |
| Permanent Grassland | 12,482.9 | 12,125.7 | **−357.2** |
| Hard Standings | 254.2 | 254.2 | no change |
| Rivers and streams type 3 | 14.1 | 14.1 | no change |
| **Total** | 13,058.5 | 13,059.0 | ~0 |

- The track grew by **~358 m²** and grassland shrank by the same amount — i.e. ~358 m² of grassland was reclassified as track.
- Permanent grassland also had a **classification code change (131 → 130)** — still "Permanent Grassland", just a different RPA class code.
- Same number of features (5) before and after.

## SX3963 2340 — changed on 17 October 2025

A small **scrub patch was absorbed into the pond**. Woodland unchanged.

| Land cover | Before (m²) | Now (m²) | Change |
|---|--:|--:|--:|
| Pond | 4,376.2 | 4,406.9 | **+30.7** |
| Scrub – Ungrazeable | 30.7 | 0.0 | **removed** |
| Woodland | 2,862.6 | 2,862.6 | no change |
| **Total** | 7,269.5 | 7,269.5 | 0 |

- The **30.7 m² scrub island within the pond was removed** and that exact area became pond.
- Feature count dropped from **3 to 2**.

## Notes / caveats

- "Before" figures come from the supplied historical extracts; "Now" figures are
  the current live RPA LandCovers feed (`SBI 111089693`).
- The historical extracts sit ~2.6 m off the current parcel boundary (export
  registration offset plus genuine boundary drift over time), so areas can carry a
  few m² of digitisation noise. The sub-1 m² total differences above are that
  noise, not real change.
- Source files: `Before03022026_SX39647821.json`, `Before17102025_SX39632340-1.json`
  (converted into `app/assets/data/land-covers/<ngc>-before.json`).
