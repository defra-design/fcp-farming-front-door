# Parcel history: what we know so far

**Status:** working notes, last updated 3 November 2026. Questions have gone to the data provider and we are waiting for a reply.

**Do not commit this file yet.** This repository is public, and these notes use parcel references and history from a data snapshot that we do not yet have permission to publish.

For how land moves between parcels, see `splits-and-merges-findings.md`.

## Summary

- The snapshot adds history. It does not add more detail about a parcel than the public API: the API has more fields, as well as hedges.
- It covers only part of SBI 112965195: current versions for 14 of the 194 parcels the API returns (34.1 of 513.9 ha).
- Not every parcel in the snapshot has earlier versions. Of 305 parcels, 184 (60%) have more than one version and 121 (40%) have one.
- Having more than one version does not guarantee a change: 25 parcels have several versions but no change in area or land cover.
- History shows what was mapped and when. It does not say why anything changed or who changed it.
- Most versions start on 1 January (448 of 617, 73%), so a VALID_FROM date may not be the day anything changed. We do not yet know what the date represents.

## Data used

| Source | Contents |
| --- | --- |
| `outputs.zip` | 10 parcels, 29 version files |
| `adjacent_outputs.zip` | 306 parcel references, 637 version files, including exact copies of the 29 files above |
| RPA public API, fetched 2 November 2026 | 194 current parcels (513.9 ha), 318 land covers and 401 hedges for SBI 112965195 |

The latest VALID_FROM date in the snapshot is 6 October 2026. We do not know the exact date it was taken.

Figures in these notes use `adjacent_outputs` unless stated, because it includes every parcel in `outputs`. They exclude the 20 zero-length versions, which leaves 617 versions across 305 parcels. One further reference, 306 in total, has only a zero-length version.

## What a version contains

Each file is one version of one parcel, named `<PARCEL_REF>_<VALID_FROM>_<VALID_TO>.json`. It holds one polygon feature per land cover area, in WGS84 coordinates (the file does not state this, we identified it from the values).

| Field | Meaning |
| --- | --- |
| `ID` | Land cover feature ID |
| `REFERENCE_PARCELS_ID` | ID of this parcel version |
| `PARCEL_REF` | Parcel reference, equivalent to `SHEET_ID` + `PARCEL_ID` in the API |
| `LAND_COVER_CLASS_CODE` | Land cover code |
| `LAND_COVER_CLASS_DESCRIPTION` | Land cover name |
| `VALID_FROM`, `VALID_TO` | Validity dates. A `VALID_TO` of `99991231` means current |
| `GEOM_AREA_SQM` | Area of the land cover feature in square metres |

The meanings of `ID` and `REFERENCE_PARCELS_ID` are inferred from how the values behave and have not been confirmed.

## Snapshot compared with the public API

| | Snapshot | Public API |
| --- | --- | --- |
| Parcels for this SBI | 14 with current versions | 194 |
| Area covered | 34.1 ha, about 7% | 513.9 ha |
| History | Back to 30 October 2009 | Current versions only in our results |
| Land cover codes, IDs and areas | Yes | Yes |
| Hedges | No | Yes |
| SBI, Less Favoured Area code, created date, perimeter | No | Yes |

### How well they match

- **Attributes:** for all 14 parcels, the current land cover names, areas and start dates match the API.
- **Position:** on the 9 current parcels in `outputs`, the snapshot shapes sit about 2.1m north of the API's. The shift is consistent, so it looks like a coordinate conversion difference. We do not know which position is correct.

## How much history parcels have

| Group | Parcels | One version | Two or more | Change in area or land cover | Versions but no such change |
| --- | --- | --- | --- | --- | --- |
| All parcels | 305 | 121 | 184 | 159 | 25 |
| Current parcels for this SBI | 14 | 3 | 11 | 9 | 2 |
| Other parcels | 291 | 118 | 173 | 150 | 23 |

The other parcels are the 290 neighbours and SK52627478, a retired parcel from `outputs`.

### What one version means

A single version does not always mean history is missing.

- **Still current (105 parcels):** these may simply not have changed. 51 have had the same version since 2010.
- **Retired (16 parcels):** we can only see that one period.
- **Possible earlier references:** a first version may not be the parcel's true start. For example, SK40622425 starts in 2016, but its land was part of SK40623814 before that.

### Length of record and pace of change

- **Length of record:** the typical parcel goes back about 16.8 years, measured to 2 November 2026.
- **First appearance:** 165 parcels first appear in 2010 and 56 in 2014. These peaks may reflect when records began rather than when the parcels were created.
- **Number of versions:** typically 2, and at most 7.
- **Version length:** a typical ended version lasted about 5.3 years, and a typical current version is 8.8 years old.
- **Status:** 287 parcels are current and 18 have ended.

## What changes between versions

There are 312 changes between consecutive versions.

| What differs | Changes |
| --- | --- |
| Parcel area | 139 |
| Land cover only, same parcel area | 128 |
| Nothing in the file | 26 |
| Boundary points only, same area and land cover | 17 |
| Land cover code only | 2 |

We checked these in that order and counted each change once, so a change in parcel area may include a land cover change. Areas were compared to the nearest square metre.

### When changes happen

| Year | New versions |
| --- | --- |
| 2010 | 1 |
| 2015 | 18 |
| 2016 | 62 |
| 2017 | 8 |
| 2018 | 46 |
| 2019 | 32 |
| 2020 | 25 |
| 2021 | 14 |
| 2022 | 10 |
| 2023 | 35 |
| 2024 | 6 |
| 2025 | 9 |
| 2026 | 46 |

These count versions after a parcel's first. The clusters may reflect mapping updates rather than changes on the ground, but this is unconfirmed.

### Dates cluster on 1 January

| Versions | Total | Start on 1 January |
| --- | --- | --- |
| All, `adjacent_outputs` | 617 | 448 (73%) |
| After a parcel's first, `adjacent_outputs` | 312 | 199 (64%) |
| All, `outputs` | 28 | 19 (68%) |
| After a parcel's first, `outputs` | 18 | 14 (78%) |

This looks like a convention rather than chance, but neither the snapshot nor the provider's note explains it. The date may be when a change took effect for scheme or claim purposes, not when the land changed or when RPA mapped it. The files have no field for when a change was surveyed or recorded, so they cannot settle this.

- **Example:** SK40623814's previous versions start on 1 January 2010, 2015 and 2016. Its current version is the exception, starting on 1 May 2017.
- **1 January 2010:** this is the most common date, with 155 versions, and every one is the first version of its parcel. It may be where digital records begin rather than a real change, but this is unconfirmed.
- **Other shared dates:** 45 versions start on 20 April 2016 and 10 on 1 May 2017. Versions sharing a date could mean changes applied in batches, but this is unconfirmed.
- **Other dates exist:** 169 versions start on other days, such as 9 November 2017 and 14 April 2026, so not every date is rounded to the start of a year.

### Changes in main land use

The largest land cover in a parcel changes at some point in 63 of the 305 parcels. The most common shifts are:

| From | To | Changes |
| --- | --- | --- |
| Permanent Grassland | Arable Land | 21 |
| Arable Land | Permanent Grassland | 16 |
| Unknown | Permanent Grassland | 15 |
| Arable Land | Solar Panels | 4 |

Some of these may be reclassification or better data rather than a change on the ground. For example, SK40623931 changes from Natural Woodland (330) to Woodland (332) with no change in area, and Unknown to Permanent Grassland may be the same kind of change.

## Parcels linked to this SBI

Areas are in hectares and rounded. Zero-length versions are not shown. SK40621823 and SK40622425 each have one, and so does SK52627297.

### Area or land cover changes

**SK40623814**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 Jan 2010 | 1 Jan 2015 | 18.06 | Permanent Grassland 18.06 |
| 1 Jan 2015 | 1 Jan 2016 | 18.06 | Permanent Grassland 17.56, Metalled Track - no permissive access 0.49 |
| 1 Jan 2016 | 1 May 2017 | 13.19 | Permanent Grassland 12.92, Metalled track 0.28 |
| 1 May 2017 | Current | 3.87 | Solar Panels 3.87 |

**SK40626919**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 Jan 2016 | 9 Nov 2017 | 1.27 | Permanent Grassland 1.27 |
| 9 Nov 2017 | 1 Jan 2021 | 1.27 | Permanent Grassland 0.76, Notional - Scrub 0.51 |
| 1 Jan 2021 | 14 Apr 2026 | 1.27 | Permanent Grassland 1.27 |
| 14 Apr 2026 | Current | 1.27 | Woodland 0.88, Permanent Grassland 0.39 |

**SK40622425**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 Jan 2016 | 1 May 2017 | 4.87 | Permanent Grassland 4.64, Metalled track 0.22 |
| 1 May 2017 | 1 Jan 2019 | 4.49 | Permanent Grassland 4.37, Solar Panels 0.12 |
| 1 Jan 2019 | 1 Jan 2020 | 4.60 | Permanent Grassland 4.52, Solar Panels 0.08 |
| 1 Jan 2020 | Current | 4.60 | Permanent Grassland 4.60 |

**SK52635702**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 30 Oct 2009 | 1 Jan 2016 | 4.34 | Arable Land 4.34 |
| 1 Jan 2016 | 1 Jan 2017 | 7.07 | Arable Land 7.07 |
| 1 Jan 2017 | 1 Jan 2020 | 5.15 | Solar Panels 4.89, Metalled track 0.26, Farm Building under 0.01 |
| 1 Jan 2020 | Current | 5.15 | Solar Panels 4.89, Track - Natural Surface 0.26, Farm Building under 0.01 |

**SK52626283**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 Jan 2016 | 1 Jan 2017 | 4.61 | Arable Land 4.61 |
| 1 Jan 2017 | 1 Jan 2019 | 4.35 | Arable Land 4.27, Metalled track 0.08 |
| 1 Jan 2019 | Current | 4.35 | Arable Land 4.27, Metalled track 0.08 |

**SK40611696**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 May 2017 | 1 Jan 2019 | 0.64 | Permanent Grassland 0.64 |
| 1 Jan 2019 | Current | 0.79 | Permanent Grassland 0.79 |

**SK40621602**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 May 2017 | 1 Jan 2019 | 0.36 | Metalled track 0.28, Permanent Grassland 0.08 |
| 1 Jan 2019 | Current | 0.21 | Metalled track 0.13, Permanent Grassland 0.08 |

**SK40623931**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 Jan 2010 | 1 Jan 2021 | 3.02 | Natural Woodland 3.02 |
| 1 Jan 2021 | Current | 3.02 | Woodland 3.02 |

**SK40624821**

| From | To | Area | Land cover |
| --- | --- | --- | --- |
| 1 May 2017 | 1 Jan 2019 | 1.64 | Permanent Grassland 1.64 |
| 1 Jan 2019 | Current | 2.24 | Permanent Grassland 2.24 |

### New version, but no change in area or land cover

| Parcel | From | To | Area | Land cover |
| --- | --- | --- | --- | --- |
| SK40622501 | 1 May 2017 | 1 Jan 2019 | 3.04 | Solar Panels 3.04 |
| SK40622501 | 1 Jan 2019 | Current | 3.04 | Solar Panels 3.04 |
| SK40625920 | 1 May 2017 | 1 Jan 2019 | 2.98 | Solar Panels 2.98 |
| SK40625920 | 1 Jan 2019 | Current | 2.98 | Solar Panels 2.98 |

### One version only

| Parcel | From | To | Area | Land cover |
| --- | --- | --- | --- | --- |
| SK40621823 | 2 May 2017 | Current | 0.26 | Metalled track 0.22, Scrub - Ungrazeable 0.04 |
| SK52625098 | 1 Jan 2017 | Current | 1.45 | Arable Land 1.45 |
| SK52627297 | 1 Jan 2017 | Current | 0.82 | Permanent Grassland 0.81, Metalled track 0.01 |
| SK52627478 (retired) | 30 Oct 2009 | 31 Dec 2015 | 7.35 | Arable Land 7.35 |

## Data quirks

- **Zero-length versions:** 20 files have the same VALID_FROM and VALID_TO, such as `SK40622425_20170501_20170501`. We exclude them, but do not know what they mean.
- **One-day gaps:** VALID_TO usually matches the next VALID_FROM, as the provider described, but not always. SK52627478 ends on 31 December 2015 while the parcels that replaced it start on 1 January 2016. SK40621823's zero-length version is dated 1 May 2017 and its next version starts on 2 May 2017.
- **Versions with no visible change:** 26 changes between versions have identical data in the file.
- **Two codes, one name:** codes 130 and 131 are both described as Permanent Grassland.
- **Changing references:** SK40626719 ended on 31 December 2015 and SK40626919 started on 1 January 2016 with the same area. Following one reference can miss earlier history.
- **Missing parcels:** 5 parcels the API lists under this SBI appear only in `adjacent_outputs`: SK40621602, SK40621823, SK40622501, SK52625098 and SK52627297.

## Limits of these findings

- **Coverage:** these findings describe 305 parcels around two parts of this SBI's land. They may not represent the other 180 parcels or other businesses.
- **Mostly neighbours:** the overall figures are dominated by the 291 parcels not currently listed under this SBI.
- **Our definitions:** categories such as no change in area or land cover are ours, and RPA may see these versions differently. A version with identical data may still reflect a change that the extract does not include.
- **API history:** the API returned only current versions for this SBI query. We have not ruled out other ways of getting history from it.

## Questions waiting on the data provider

- Can we get history for the rest of the SBI, and was this subset deliberate?
- Why are 5 of this SBI's parcels only in `adjacent_outputs`?
- When was the snapshot taken?
- Is the history of hedges available, and can we see which business held each parcel in each period?
- What do zero-length versions mean, and can we ignore them?
- Should a VALID_TO of 31 December be treated as continuing to 1 January?
- Does VALID_FROM show when the land changed, when RPA recorded the change, or when it took effect for scheme purposes? Is the date a change was surveyed or recorded held anywhere, and could we have it? (New on 3 November 2026, not yet sent.)
- Why are some versions created when nothing seems to change?
- Do land cover changes always reflect changes on the ground, and is there a code list that explains them?
- Why are the snapshot shapes offset from the API, and which position is correct?
- Can we publish this data or use it in user research?

## What the prototype does now

v18/1.3 shows snapshot history locally for 11 parcels, using 20 previous versions. The other 183 parcels use the API only, with no history links.

These parcels open the dates list:

| Parcel | Previous versions |
| --- | --- |
| SK40611696 | 1 |
| SK40621602 | 1 |
| SK40622425 | 3 |
| SK40622501 | 1 |
| SK40623814 | 3 |
| SK40623931 | 1 |
| SK40624821 | 1 |
| SK40625920 | 1 |
| SK40626919 | 3 |
| SK52626283 | 2 |
| SK52635702 | 3 |

- **Dates:** VALID_FROM and VALID_TO are stored and shown exactly as the snapshot has them.
- **Position:** historical shapes are moved about 2m to line up with the API. This is the only change to the snapshot's geometry.
- **Added by us:** the page's field names, an SBI value and a parcel outline made by joining each version's land covers.
- **Hedgerows:** previous versions say hedgerow history is not available.
- **Publishing:** the generated files are gitignored until the provider clears them, so a deployed copy shows no history.

## What this means for the prototype

- History can be shown for the 11 current parcels that have earlier versions. The other 183 show no history links.
- The design needs to handle four cases: changes to show, new versions with nothing visible, one version with no earlier record, and a retired parcel.
- Avoid wording that presents a land cover change as a real change on the ground, or that gives a reason for it, until the provider confirms what these changes mean.
- The dates list's Parcel updated heading may claim too much, because a farmer may know nothing happened on a date like 1 January 2016. Keep the dates exactly as supplied, and consider a more neutral heading such as Valid from until the provider confirms what the date means.
- SK40623814 and SK40626919 have the most to show, so they are the strongest examples for research.
- Hide or merge zero-length versions, and consider merging versions with no visible change, once the provider confirms what they mean.
