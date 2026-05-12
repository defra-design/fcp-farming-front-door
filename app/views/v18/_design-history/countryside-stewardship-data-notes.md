# Countryside Stewardship data — notes

Companion to the `view-land-cs` / `view-land-parcel-cs` prototype pages. Captures
what we learned from the source dataset and how it maps onto the existing land
parcel views.

## Source dataset

The data comes from the *Countryside Stewardship Scheme 2016 Management Options
England* GeoJSON. It is a national `FeatureCollection` of 1,231 agreement
features. Once flattened and filtered, the slimmed working file lives at
`app/data/countryside-stewardship-agreements.json` (1,123 records, ~493 KB).

### How records link to RPA parcels

Each agreement carries a `parcref` field. **1,123 of 1,231 records (91.2%)**
match the pattern `^[A-Z]{2}\d{8}$` — a 10-character composite that splits
cleanly into RPA's `SHEET_ID` (2 letters + 4 digits) and `PARCEL_ID`
(4 digits). Example: `SK93866651` = `SHEET_ID` `SK9386` + `PARCEL_ID` `6651`.

The remaining 108 records use placeholder `parcref` values (`AGREEMENT` or
`ROTATIONAL`) and are dropped during extraction — they cannot be linked to a
specific parcel.

### Contract-level vs per-row fields

Several fields look per-row but are actually **constant within a single
`contract_id`** (verified across all 97 contracts in the dataset):

- `startdate`, `enddate`
- `total_value`
- `cs_type`, `mag_cs_typ` (scheme tier)
- `org_name`

The genuinely per-record fields are: `parcref`, `option_code`,
`option_description`, `option_quantity`, `unit_of_measure`.

This is why the contract block on `view-land-cs` reads start/end/value off the
first matched record — the same values would repeat on every row of that
contract.

### Geographic coverage

All 226 distinct `SHEET_ID` values in the dataset sit within the **SK** OS grid
(roughly Lincolnshire/Nottinghamshire). Top SHEET_IDs by frequency: SK7784
(40 records), SK8879 (26), SK8495 (23), SK9180 (20). An SBI whose parcels fall
outside the SK area will produce zero matches — the new sidebar sections
correctly hide in that case.

## Option codes

Codes follow a `<prefix><number>` convention from the 2016 scheme. The prefix
groups options into a thematic family. The dataset contains 75 distinct codes
across 16 prefixes.

| Prefix | Theme | Example | Records |
| --- | --- | --- | ---: |
| SW | Soil & Water (buffer strips, watercourse protection) | SW1 — 4-6m buffer strip on cultivated land | 444 |
| GS | Grassland (lowland management) | GS10 — Management of wet grassland for wintering waders and wildfowl | 188 |
| BE | Boundaries — hedgerow management (revenue) | BE3 — Management of hedgerows | 131 |
| FG | Fencing & Gates (capital) | FG1 — Fencing | 75 |
| BN | Boundaries — hedgerow creation/restoration (capital) | BN5 — Hedgerow laying | 70 |
| AB | Arable & horticultural land — biodiversity | AB8 — Flower rich margins and plots | 59 |
| RP | Resource Protection (yards, drainage, pollution prevention capital) | RP1 — Resurfacing of gateways | 42 |
| TE | Trees & Edges (planting, guards, surgery) | TE1 — Planting standard hedgerow tree | 40 |
| HS | Historic & archaeological features | HS5 — Management of historic and archaeological features on grassland | 33 |
| WD | Woodland | WD1 — Woodland creation maintenance | 21 |
| LV | Livestock infrastructure (drinkers, troughs) | LV3 — Hard bases for livestock drinkers | 12 |
| WT | Wetland — buffering ponds/ditches | WT2 — Buffering in-field ponds and ditches on arable land | 3 |
| SP | Supplements (e.g. native breeds) | SP8 — Native breeds at risk supplement | 2 |
| WN | Wetland — pond creation (capital) | WN5A — Pond management - creation | 1 |
| WF | Wildfire | WF1 — Create a wildfire checklist | 1 |
| AQ | Air Quality | AQ1 — Automatic slurry scraper | 1 |

### Notes on the prefix system

- **Capital vs revenue.** Each record has a `cap_rev` flag. Capital options are
  one-off works (fencing, hedgerow laying, yard resurfacing — largely BN, FG,
  RP, TE). Revenue options are ongoing land-management payments (largely SW,
  GS, HS, WD).
- **Boundaries are split across three prefixes.** `BE` covers ongoing
  management of existing hedges (revenue). `BN` covers capital works on hedges
  (laying, coppicing, gapping, planting new). `FG` covers fencing and gates.
- **Water-themed family.** `SW`, `WT`, `WN` and parts of `RP` all overlap on
  water-quality outcomes. `SW` dominates volume because buffer strips are the
  workhorse option.

## Hardcoded SBI: 106332870

The map view is wired to SBI `106332870` (in `view-land-parcel.html` and
`view-land-parcel-cs.html`). RPA returns 33 land parcels for this SBI,
spread across SHEET_IDs `SK8287`, `SK8688`, `SK8689`, `SK8690`. **17 of those
33 parcels** have a Countryside Stewardship agreement, all under a single
contract.

### Contract 43647 (Casswell & Son Farming)

- Tier: **Countryside Stewardship — Middle Tier**
- Period: **1 January 2021 → 31 December 2026**
- Total value: **£117,581.70** (contract-level — the same value is repeated
  on every row of this contract in the source data)

### Parcels under this contract

| Parcel (SHEET_ID + PARCEL_ID) | Option | Description |
| --- | --- | --- |
| SK8688 5592 | SW1 | 4-6m buffer strip on cultivated land |
| SK8689 3476 | SW1 | 4-6m buffer strip on cultivated land |
| SK8689 4424 | GS10 | Management of wet grassland for wintering waders and wildfowl |
| SK8689 4658 | SW1 | 4-6m buffer strip on cultivated land |
| SK8689 5509 | SW1 | 4-6m buffer strip on cultivated land |
| SK8689 6743 | SW1 | 4-6m buffer strip on cultivated land |
| SK8689 8976 | SW1 | 4-6m buffer strip on cultivated land |
| SK8690 2976 | SW1 | 4-6m buffer strip on cultivated land |
| SK8690 3933 | HS5 | Management of historic and archaeological features on grassland |
| SK8690 4019 | HS5 | Management of historic and archaeological features on grassland |
| SK8690 4129 | HS5 | Management of historic and archaeological features on grassland |
| SK8690 5122 | HS1 | Maintenance of Weatherproof Traditional Farm Buildings |
| SK8690 5197 | SW1 | 4-6m buffer strip on cultivated land |
| SK8690 8081 | SW1 | 4-6m buffer strip on cultivated land |
| SK8690 9127 | SW1 | 4-6m buffer strip on cultivated land |
| SK8690 9153 | SW1 | 4-6m buffer strip on cultivated land |
| SK8690 9205 | SW1 | 4-6m buffer strip on cultivated land |

The holding is essentially a buffer-strip + heritage-features agreement, with
one wet-grassland parcel.

## Reproducing the data extract

The slimmed working file is generated from the source GeoJSON with `jq`:

```sh
jq '[.features[]
  | select(.properties.parcref | test("^[A-Z]{2}\\d{8}$"))
  | .properties
  | {parcref, option_code, option_description, option_quantity,
     unit_of_measure, total_value, startdate, enddate,
     cs_type, mag_cs_typ, org_name, contract_id}]' \
  "Countryside_Stewardship_Scheme_2016_Management_Options_England (1).json" \
  > app/data/countryside-stewardship-agreements.json
```

Geometry is dropped — linkage to RPA parcels is by `parcref`, not coordinates.
