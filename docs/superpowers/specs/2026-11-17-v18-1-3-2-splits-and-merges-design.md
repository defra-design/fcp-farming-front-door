# v18/1.3.2: splits and merges

**Date:** 17 November 2026
**Status:** agreed with the designer in conversation, 10–17 November 2026
**Mockups:** `.superpowers/brainstorm/31430-1794331186/screenshots/` (not committed). The chosen layout is option 3 in `splits-table-options-v2.png`, and the map treatment is in `option-a-copy-v2.png`.
**Background:** `app/views/v18/_design-history/splits-and-merges-findings.md` and `parcel-history-findings.md`. The earlier 1.3.1 plan, `docs/superpowers/plans/2026-11-10-v18-1-3-1-splits-and-merges.md`, has a worked-out method for finding the links (its Task 1 algorithm). This design supersedes that plan's screen design and wording, but not its data method.

## Why

Farmers and staff looking at a parcel's history can see its shape change between dates, but not why. Often land left to form new parcels, or other parcels were joined in. RPA holds no record of these splits and merges. The data provider confirmed this, said areas need not balance, and confirmed that a reference can change while the shape stays the same. So we work the links out from shapes and dates, and say so on screen.

The designer wants this information **kept apart from the historical view on screen**. The dates table, Compare and the fade carry on exactly as in 1.3.1. Splits and merges get their own section.

## Goals

- A user can see, for any parcel with history, each date its land was split off, merged with other parcels, added to from another parcel, or given a new reference, with the parcels and areas involved.
- They can show any one of those changes on the map.
- They can follow land to other parcels in the same business.
- It is clear that we worked these links out ourselves and that areas are approximate.

## Non-goals

- No changes to 1.3, 1.3.1 or 1.2, on screen or in what their pages read.
- No section for parcels without history (180 of 194). They stay as they are.
- No history for parcels outside the business. They appear as a reference only.
- No totals, and no checking that areas add up.

## Anti-goals

- The dates table, Compare and fade behaving differently from 1.3.1.
- Showing other parcels' land covers or full shapes. We only draw the parts of this parcel's own versions that are now elsewhere or that came from elsewhere. The one exception is SK4062 6719 below, which the designer has approved.
- Dates that differ from the snapshot. Show VALID_FROM and VALID_TO exactly as supplied.

## The version

- **1.3.2 is a copy of 1.3.1:** `app/routes/v18/1.3.2/routes.js` and `app/views/v18/1.3.2/`, wired into `app/routes.js`. It has its own session key, `sbiV18_132`, following 1.3 and 1.3.1, and its own catch-all render route, because of the dot in the URL.
- **Pages:** everything 1.3.1 has comes across: view-land, view-land-parcel, the compare-dates page and its `_compare-single-map.html`. Only the compare-dates page and its map base change.
- **Repo docs:** update `CLAUDE.md` to describe 1.3.2.
- **Links and design history** (my call): add a link to 1.3.2 wherever 1.3.1 is linked from. There's no design history page for 1.3.2 in this piece of work.

## What the user sees

### Where it sits

There's a new section at the bottom of the **Historical** tab, under the dates table and Compare button, with the heading **Splits and merges**. It appears only when the parcel has at least one change to list. The Current tab is unchanged.

### The table

It's one table, grouped by date, oldest first. It has 2 columns: **Parcel** and **Area (ha)**.

Each change starts with a **heading row**, shaded light grey (`#f3f2f1`) and in bold, such as **1 May 2017: split into 9 parcels**. The right-hand cell of the heading row holds the map control (see Map).

Under the heading row, there's one row per other parcel, largest area first:
- **A parcel in this business** (on the API's list for the SBI): its reference links to that parcel's 1.3.2 page. If that parcel has history, the link goes to the compare-dates page; otherwise it goes to view-land-parcel, as the rest of 1.3.2 does.
- **Any other parcel:** the reference as plain text, with Not in this business on a second line in secondary text.
- **References** are written with a space, for example SK4062 2501, as elsewhere on the page.
- **Areas** are given to 4 decimal places.

After those rows comes a final row for this parcel:
- **Land leaving:** Stayed in this parcel, with the area that stayed.
- **Land arriving:** Already in this parcel, with the area this parcel already had. This is my call: the designer approved Stayed in this parcel for land leaving, and this is the matching row for land arriving.
- **This parcel is new:** no final row, because there was nothing before.

Under the table is this explanation, in secondary text:

> We worked these out by comparing parcel shapes and dates. RPA does not keep a record of them, so areas are approximate and may not add up.

There is no total row.

### Heading wording

The wording comes from what the data shows on that date. N counts parcels. The designer approved these:

| What the data shows | Heading after the date |
| --- | --- |
| Land left this parcel, and every parcel that took it is new on that date | split into N parcels (N = the new parcels + this one) |
| This parcel is new on that date, made from part of another parcel or parcels | created from SK… (one parcel) or created from N parcels |
| Land joined this parcel, and every parcel it came from ended on that date | merged with N parcels (N = the parcels that ended) |
| Land joined from a parcel that carried on | land added from SK… (one parcel) or land added from N parcels |
| Same land, new reference (see below) | reference changed |

These are my calls for cases the designer hasn't seen:
- **Mixed recipients:** land left, but not every parcel that took it is new. The heading is land moved to SK… (one parcel) or land moved to N parcels.
- **Mixed donors:** land joined, but not every parcel it came from ended. Use the land added from wording.
- **Land left and joined on the same date:** this happens, for example on SK5263 5702 on 1 January 2016. Show two groups with the same date, leaving first, then joining.

The heading starts with the date in the page's `longDate` format, then a colon and a space, then the wording in lower case.

**Definitions:**
- **New on a date:** the other parcel's earliest version in the data starts on that date or the day after.
- **Ended on a date:** the other parcel's latest version in the data has a VALID_TO equal to that date or the day before.
- **The day-either-side tolerance** is only for matching. Dates on screen are always the ones supplied.

### Reference change

The heading is **reference changed**. It has a single row with the old reference as plain text, then Old reference for this land on a second line, and this parcel's area. It has no map control, because the shape didn't change.

### Map

- **Show on map:** the right-hand cell of each heading row has a Show on map link, which works as a button.
- **Once selected:**
  - The cell says Showing on map in secondary text, with a Hide link under it.
  - Only one change can be on the map at a time. Choosing another moves Showing on map to that row.
- **Land leaving:** the map shows this parcel's version from just before the change. The land that left is hatched in grey and labelled with the reference of the parcel it went to, and the land that stayed is highlighted. Key: Land now in another parcel, with grey diagonal hatching as in 1.2.
- **Land arriving:** the map shows this parcel's version from the date of the change. The land that came in has a black dotted outline and is labelled with the reference it came from. Key: Land added from another parcel.
- **Framing:** the map frames the parcel and all the pieces.
- **Labels on pieces:** use them if the map library supports them. If not, leave them out. The table carries the references, so this is the builder's call.
- **Hide:** clears the pieces and puts the map back to what the Historical tab showed before.
- **Dates table:** ticking or unticking a date, Compare, or changing a tab all clear the change from the map, and the row goes back to Show on map.
- **Base map:** a change shown on the map survives a switch to Satellite and back.
- **Fixed list:** the section is not filtered by the dates ticked above it. It always lists every change. This is my call, and the designer didn't object.
- **The rest of the tab while a change is on the map** (my call): the ticks stay as they were. The compare heading, the single-date inset and the fade are hidden, because they describe something the map is no longer showing. Hide brings them back along with the map they belong to.
- **Phones** (my call): Show on map behaves as ticking a date already does on a narrow screen. It sets what the map will show, and the user sees it when they open the map with the existing Map view button. It doesn't open the fullscreen map itself.

### SK4062 6719 in SK4062 6919's history

SK4062 6919 is the same land as SK4062 6719. The reference changed on 1 January 2016, and the designer approved showing it as one parcel's history.

- **In 1.3.2:** SK4062 6719's version (16 December 2013 to 31 December 2015) appears as a row in SK4062 6919's dates table, like any other earlier date. It can be shown alone and compared.
- **When shown alone:** the inset says the parcel's reference at the time was SK4062 6719.
- **In 1.3 and 1.3.1:** this version is not added to the history they read.

## Accessibility

- **Heading rows:** each is a real header for its group, so screen readers announce the date and change with each parcel.
- **Map controls:** Show on map and Hide are buttons styled as links, with hidden text that names the date. Changes are announced through a status message.
- **Narrow screens:** the table fits the sidebar at its narrowest and on a phone. Long cells wrap instead of overflowing, as in the 1.3.1 dates table fix.
- **Hidden elements:** any element with a GOV.UK class that sets `display` and is toggled with `hidden` needs a `[hidden] { display: none; }` rule.

## Data

- **Built ahead of time:** work the links out in `scripts/parcel-snapshot/` when the files are generated, not in the browser. Use the method in the 1.3.1 plan's Task 1:
  - Intersect real shapes.
  - Match versions that start or end on the same day or a day apart.
  - Ignore zero-length versions.
  - Drop pieces under 0.01 ha.
  - Treat it as a reference change only when the overlap covers at least 99% of both versions.
- **Both sides:** every link must show from both parcels where both have history. If SK4062 3814 lists SK4062 2501 under its 1 May 2017 split, then SK4062 2501 shows created from SK4062 3814 on 1 May 2017. If the 1.3.1 plan's method leaves one side empty, fill it in from the other parcel's links rather than accept the gap.
- **Extra fields:** the builder adds whatever the headings need. That's whether each other parcel is new on the date, whether it ended on the date, and the area already in this parcel.
- **Kept separate:** the results go in a new `lineage` key in the manifest and in one `lineage-<ngc>.json` file per parcel for the map pieces.
  - The manifest's `sbi`, `history` and `dateVersions` stay exactly as they are, so 1.3 and 1.3.1 are unaffected.
  - SK4062 6719's version is written as an extra file and listed only under `lineage`.
- **Other parcels:** the files hold no geometry or land cover from other parcels, apart from SK4062 6719's version. Other parcels appear only as a reference, an area and flags.

## Real cases to check against

Figures are from a run on the real snapshot on 10 November 2026. Small differences are fine if the method is followed.

| Parcel | Date | Expected |
| --- | --- | --- |
| SK4062 3814 | 1 January 2016 | split into 2 parcels: SK4062 2425 4.8654; stayed 13.1932 |
| SK4062 3814 | 1 May 2017 | split into 9 parcels: SK4062 2501 3.0414, SK4062 5920 2.9817, SK4062 4821 1.6386, SK4061 1696 0.6437, SK4062 5401 0.4558 (not in business), SK4062 1602 0.3571, SK4062 3714 0.1461 (not in business), SK4061 1699 0.0574 (not in business); stayed 3.8715 |
| SK4062 2425 | 1 January 2016 | created from SK4062 3814: 4.8654 |
| SK4062 2425 | 1 May 2017 | split into 2 parcels: SK4062 1823 about 0.2609 (it starts on 2 May 2017, a day later) |
| SK4062 2501, SK4062 5920 and the other new parcels from 1 May 2017 that have history | 1 May 2017 | created from SK4062 3814, with the areas in SK4062 3814's row above |
| SK4062 4821 | 1 January 2019 | merged with 2 parcels: SK4062 5401 0.4558, SK4062 3714 0.1461; already in this parcel about 1.6386 |
| SK4061 1696 | 1 January 2019 | land added from SK4062 1602: 0.1464 |
| SK4062 6919 | 1 January 2016 | reference changed from SK4062 6719 |
| SK5263 5702 | 1 January 2016 | two groups: split into 2 parcels (SK5262 6283 0.7455), then merged with 1 parcel (SK5262 7478 3.4822, not in business) |

## Left to the builder

- Code structure, names and file layout, following the 1.3.1 patterns.
- How map pieces are styled beyond the colours and key labels above.
- Whether map labels are possible.
- How the page finds out whether a linked parcel has history.
