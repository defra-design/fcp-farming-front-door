# Parcel splits and merges: what we know so far

**Status:** working notes, last updated 10 November 2026. The data provider has answered our questions on splits and merges (see below). Other questions are still waiting for a reply.

**Publishing:** the snapshot files for this SBI were committed on 9 November 2026 after the data provider cleared them for publication. Check that this clearance also covers these notes before committing them, as they include neighbouring parcels' references and history.

## Summary

- The snapshot does not explicitly record splits or merges. No field links a parcel to the parcels it became.
- RPA holds no authoritative record of splits and merges either, so linking versions ourselves is the only way to show them.
- Most can be rebuilt by linking parcel versions through change dates and shape overlaps.
- Area balanced to within 0.5% in 27 of the 33 events involving more than two parcel versions. The data provider says it is OK for area not to balance.
- A parcel's reference can change while its shape stays the same.

## Answers from the data provider

| Question | Answer |
| --- | --- |
| Is there an authoritative record of splits and merges? | No. Any links we show are worked out by us. |
| Why doesn't area always balance? | No definitive reason, but we were told that's OK. |
| Can a parcel's reference change while its shape stays the same? | Yes. |

## Data used

| Source | Contents |
| --- | --- |
| `outputs.zip` | 10 parcels, 29 version files |
| `adjacent_outputs.zip` | 306 parcels, 637 version files, including exact copies of the 29 files above |
| RPA public API, fetched 2 November 2026 | 194 current parcels (513.9 ha) for SBI 112965195 |

The snapshot has current versions for 14 of the SBI's 194 parcels (34.1 ha). Everything below is limited to the parcels in the snapshot, so it says nothing about the other 180.

## How we rebuilt the links

1. Remove zero-length versions, where VALID_FROM equals VALID_TO. This drops 20 files and leaves 617 versions.
2. Treat a VALID_TO of 31 December as the following 1 January.
3. For each change date, collect the versions that end and the versions that start.
4. Remove pairs with the same parcel reference and the same area (within 1 square metre), as their boundary has not changed.
5. Link the remaining old and new versions if they have the same reference or overlap. The overlap must be at least 2% of the smaller parcel, measured by sampling points on a 10m grid.
6. Treat each connected group as one event and compare total area before and after. An event balances if the difference is 0.5% or less.

### What each part contributes

| Input | Role | Limit |
| --- | --- | --- |
| Dates | Show when a change happened | Cannot link parcels alone: a typical balanced event shares its date with 63 starting or ending versions |
| Shapes | Link old and new parcels | Must be calculated, as there is no neighbour field |
| Areas | Confirm a proposed link | We have not tested whether they can find links without shapes |
| Adjacent data | Supplies parcels missing from `outputs` | Only extends so far, so some events may run outside the extract |

## Results across all the data

| Event type | Events | Area balances |
| --- | --- | --- |
| Split (one version to many) | 23 | 18 |
| Merge (many versions to one) | 2 | 2 |
| Redraw (many versions to many) | 8 | 7 |
| **Total with more than two versions** | **33** | **27** |
| One to one, same reference (boundary change) | 97 | 53 |
| One to one, new reference | 2 | 1 |
| Appears, with no predecessor in the data | 254 | Not applicable |
| Disappears, with no successor in the data | 7 | Not applicable |

- A one-to-one boundary change is expected to alter the area, so not balancing is not a problem in itself.
- Most appearances look like the start of records rather than new land: 155 are on 1 January 2010 and 49 on 1 January 2014.
- The labels split, merge and redraw are ours. RPA may class these changes differently.

## Worked examples

All areas are in hectares. Totals are calculated from unrounded areas, so they can differ slightly from the sum of the figures shown.

### SK40623814: one large parcel divided twice

**Split on 1 January 2016 (balances exactly)**

| Before | After |
| --- | --- |
| SK40623814: 18.0586 | SK40623814: 13.1932 |
| | SK40622425: 4.8654 |
| **Total: 18.0586** | **Total: 18.0586** |

**Split on 1 May 2017 (difference of +0.0011)**

| Before | After |
| --- | --- |
| SK40623814: 13.1932 | SK40623814: 3.8715 |
| | SK40625920: 2.9817 |
| | SK40622501: 3.0414 |
| | SK40624821: 1.6386 |
| | SK40611696: 0.6440 |
| | SK40625401: 0.4558 |
| | SK40621602: 0.3580 |
| | SK40623714: 0.1461 |
| | SK40611699: 0.0574 |
| **Total: 13.1932** | **Total: 13.1943** |

The remaining SK40623814 is now entirely Solar Panels.

### SK40624821: merge on 1 January 2019 (balances exactly)

Two of the small parcels from the 2017 split were merged into SK40624821.

| Before | After |
| --- | --- |
| SK40624821: 1.6386 | SK40624821: 2.2404 |
| SK40625401: 0.4558 | |
| SK40623714: 0.1461 | |
| **Total: 2.2404** | **Total: 2.2404** |

### SK40611696 and SK40621602: land moved between parcels on 1 January 2019 (balances exactly)

Both references continue, but land moved from one to the other.

| Before | After |
| --- | --- |
| SK40611696: 0.6440 | SK40611696: 0.7904 |
| SK40621602: 0.3580 | SK40621602: 0.2116 |
| **Total: 1.0020** | **Total: 1.0020** |

### SK52627478 and SK52635702: redraw on 1 January 2016 (balances exactly)

SK52627478 ended and SK52626283 started. SK52635702 continued with a larger area. This is why it is a redraw rather than a simple split.

| Before | After |
| --- | --- |
| SK52627478: 7.3469 | SK52635702: 7.0717 |
| SK52635702: 4.3351 | SK52626283: 4.6103 |
| **Total: 11.6820** | **Total: 11.6820** |

### SK40626719 to SK40626919: a new reference for the same land

SK40626719 ended on 31 December 2015 and SK40626919 started on 1 January 2016. Both are 1.2702 ha and their shapes overlap completely. The land cover changed at the same time, from Natural Woodland (330) to Permanent Grassland (130). The data provider confirmed that a reference can change while the shape stays the same. Following a single reference would miss the earlier history.

## Events that do not balance

| Date | Parcels | Change | Note |
| --- | --- | --- | --- |
| 1 January 2017 | SK52626283 and SK52635702 became SK52625098, SK52626283, SK52627297 and SK52635702 | 11.6820 to 11.7612 (+0.0793, about 0.7%) | Cause unknown |
| 1 May 2017 | SK40622425 | 4.8654 to 4.4904 (-0.3750) | Explained below. Counted as a one-to-one boundary change |
| 1 January 2019 | SK40622425 | 4.4904 to 4.6036 (+0.1132) | Explained below. Counted as a one-to-one boundary change |

The first row is one of the 6 multi-parcel events that do not balance. We have not looked into the other 5. Land may have moved to parcels outside the extract, or boundaries may have been redrawn at the same time. The data provider could not say why, but told us that area not balancing is OK.

### SK40622425: a one-day gap and land that left and returned

- **One-day gap:** about 5.4% of the old SK40622425 (roughly 0.26 ha) is in SK40621823, whose current version starts on 2 May 2017, a day after the change. Our method compares a single date, so it did not link them.
- **Land that left and returned:** about 0.11 ha is in no parcel in the data from 2 May 2017 until 1 January 2019. SK40622425 gained about 0.11 ha back on that date, and it is the same land.
- **Unknown:** the data does not say why this land was outside the parcels for those 20 months, or whether it sat in a parcel outside the extract.

## Limits of the method

- **Inferred, not recorded:** the data shows where land ended up, not why it moved. RPA has no record to check it against.
- **One-day gaps:** we only allow for versions ending on 31 December. Other gaps, like SK40621823 starting on 2 May 2017, split one event in two, so the counts above may change slightly. We have not re-run them.
- **Sampling:** overlaps are measured on a 10m grid, so very small parcels or small overlaps can be missed.
- **Thresholds:** we chose the 2% overlap and 0.5% area thresholds ourselves and have not tested how sensitive the results are to them.
- **Incomplete extract:** a parcel with no apparent predecessor or successor may simply have one outside the data.
- **Changes without a boundary change:** new versions can also reflect land cover changes or nothing visible. These are not splits or merges.

## Questions still waiting on the data provider

- How common are reference changes like SK40626719 to SK40626919?
- What do zero-length versions mean, and can we ignore them?
- Should a VALID_TO of 31 December be treated as continuing to 1 January?
- Can we use this data in user research?

## What this means for the prototype

- Lineage will always be worked out by us, because RPA has no record of splits and merges. A production service would need to do the same.
- Describe where land went or came from, not what happened. For example, say "Some of this land is now in SK4062 2425", not "This parcel was split".
- Don't show totals that look as if they should add up, and don't hide events that don't balance.
- Treat a reference change as part of the same parcel's history.
- Leave out small slivers of overlap, as these are more likely to be boundaries being redrawn than land moving.
- The other 180 parcels would need to say that no history is available.
