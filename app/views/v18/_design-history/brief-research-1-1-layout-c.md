# Brief: Rebuild the round 10 research page (Land summary v1.1) as a numbered narrative

## Goal

Rebuild the design history page for user research round 10 using a "numbered narrative" layout. Use only GOV.UK Design System components, called through their Nunjucks macros (`govuk-frontend`), plus standard GOV.UK typography classes. Write no custom CSS unless a step below says so.

The current page is at `localhost:3000/v18/design-history/research-1-1`. Its problem: the "What we learned" box and the "What this means for the design" box look the same, so the findings are hard to scan. The new layout gives each finding a clear sequence: caption, heading, evidence, quotes, then design implication.

## Before you start

1. Find the template for the current page (look for `research-1-1` under the v18 / design-history views) and the layout it extends. Keep the same layout, header, service name ("Single front door") and footer.
2. Check which `govuk-frontend` version the kit uses, and import the macros below in the way the existing templates already do.
3. Don't change routes, other pages or shared layouts. If something shared has to change, stop and say why first.

## Page structure, top to bottom

Everything sits inside `govuk-grid-row` > `govuk-grid-column-two-thirds`, except the **Task outcomes** table, which goes in `govuk-grid-column-full`.

### 1. Breadcrumbs (`govukBreadcrumbs`)
- Single front door prototypes → (existing link)
- V18 → (existing link)

### 2. Heading
- Caption (`govuk-caption-l`): **User research: round 10**
- H1 (`govuk-heading-xl`): **Land summary (v1.1)**
- Lead paragraph (`govuk-body-l`): Most participants completed the tasks. The main challenge was confidence, not navigation.

### 3. Study details (`govukSummaryList`)
| Key | Value |
|---|---|
| Version tested | `v1.1` (link to the existing v1.1 page), which led to `v1.2` (link to the existing v1.2 page) |
| Participants | 7 farmers, land managers, estate managers, environmental advisers, agents and experienced GIS users |

No actions column.

### 4. Method (`govukDetails`, closed by default)
- Summary text: **How we ran this round**
- Content:
  - Moderated remote usability sessions. Participants used their own or representative land parcels and thought aloud.
  - Holdings ranged from small holdings and commercial farms to environmental organisations and large estates. One participant manages about 930 parcels.

### 5. Contents
- `h2.govuk-heading-s`: **Contents**
- `ol.govuk-list.govuk-list--number`, where each item is an anchor link to the matching section id:
  1. Users are trying to verify information, not simply view it → `#finding-1`
  2. Confidence matters more than task completion → `#finding-2`
  3. Historic mapping solves a genuine user problem → `#finding-3`
  4. Users expect mapping tools to behave like mapping tools → `#finding-4`
  5. Adviser and agent workflows differ from farmer workflows → `#finding-5`
  6. Task outcomes → `#task-outcomes`
  7. Recommended actions → `#recommended-actions`

Then a section break: `hr.govuk-section-break.govuk-section-break--l.govuk-section-break--visible`.

### 6. Findings (5 sections)

Each finding is a `<section id="finding-N">` with this exact pattern:

1. Caption (`span.govuk-caption-m`): **Finding N of 5**
2. H2 (`govuk-heading-l`): the finding
3. Intro paragraph (`govuk-body`)
4. Bullet list (`ul.govuk-list.govuk-list--bullet`)
5. **Only if the finding has quotes:**
   - `h3.govuk-heading-s`: **What participants said**
   - One `p.govuk-body` per quote. Wrap the participant reference in `<span class="govuk-hint govuk-!-display-inline">`, or another existing secondary-text utility, so it shows in secondary text colour.
   - **Quotes must be visible on the page. Do not put them in a details component.**
6. Design implication (`govukInsetText`), with `html`:
   `<strong>What this means for the design</strong><br>` followed by the implication text, or a bold first line set with `govuk-!-font-weight-bold` and `govuk-!-display-block`.

Put a visible section break between findings.

Content (use this text exactly, including curly quotes and apostrophes):

**Finding 1 — Users are trying to verify information, not simply view it**
- Intro: Users mainly used mapping to check that the RPA’s understanding of their land matched their own records. Participants described:
- Bullets: checking boundary updates · reviewing land cover classifications · challenging changes made by the RPA · validating information before applications or claims · comparing mapping against local knowledge or other systems
- Quotes:
  - “Sometimes it comes through and we think that isn’t right.” (P1)
  - “RPA are constantly tinkering with boundaries and changing shapes.” (P3)
- Implication: Users need tools that support validation and verification, not simply viewing.

**Finding 2 — Confidence matters more than task completion**
- Intro: The biggest usability challenge was confidence, not task completion. Most participants completed the tasks, but many were unsure whether they had:
- Bullets: found all the relevant information · identified all the changes · correctly interpreted the mapping information · reached the correct conclusion
- Quotes:
  - “No, not at all.” (P8, when asked how confident they were they had found all the changes)
  - “How do I know how it’s changed?” (P2)
- Implication: Future improvements should help users feel confident in their understanding, not simply let them complete tasks.

**Finding 3 — Historic mapping solves a genuine user problem**
- Intro: Historic mapping was one of the most valued parts of the prototype. Participants understood it immediately and named real uses, including:
- Bullets: auditing changes · validating mapping · challenging updates · investigating parcel history · supporting environmental applications
- Quotes:
  - “That functionality was great.” (P8)
  - “I think that’s a very good thing.” (P4)
- Implication: Historic mapping should be treated as a validated opportunity.

**Finding 4 — Users expect mapping tools to behave like mapping tools** (no quotes)
- Intro: Many usability issues came from missing behaviours participants expected from tools they already use: RPA mapping, GIS software such as ArcGIS and Cadcorp, Gatekeeper, Land App and other professional mapping tools. They expected:
- Bullets: click to highlight · hover to highlight · measurement tools · layer controls · transparency controls · data linked to the map
- Implication: The prototype should align more closely with established mapping interaction patterns where possible.

**Finding 5 — Adviser and agent workflows differ from farmer workflows** (no quotes)
- Intro: Advisers, estate managers and environmental professionals often had different needs. They were more likely to talk about:
- Bullets: multiple parcels · exports · grouping parcels · bulk workflows · auditing history · GIS integration
- Implication: Future design work should consider whether different user groups need different workflows or capabilities.

### 7. Task outcomes (`<section id="task-outcomes">`)

- H2 (`govuk-heading-l`): **Task outcomes**
- Paragraph: Task 1: participants located one of their own parcels, reviewed its information and judged whether the mapping looked accurate. Task 2: participants located a given parcel, opened previous versions of its mapping, and explained what had changed.

**One combined table (`govukTable`)** in a full-width column, with columns **Task | Outcome | Result**. The Task cell is a row header (`<th scope="row">`) spanning its rows. `govukTable` can't do `rowspan`, so write this table as plain HTML using the `govuk-table` classes (`govuk-table`, `govuk-table__head`, `govuk-table__row`, `govuk-table__header`, `govuk-table__cell`). That is the one allowed exception to using macros.

| Task | Outcome | Result |
|---|---|---|
| 1. Review one of your own parcels (rowspan 2) | Users can find parcels, navigate the map and review parcel information | Tag: **Yes** (`govuk-tag--green`) |
| | Users can confidently interpret all the information about a parcel | Tag: **Not always** (`govuk-tag--yellow`) |
| 2. Find out what has changed on a parcel (rowspan 4) | Users can identify changes | Tag: **Yes** (green) |
| | Users can easily compare versions | Tag: **Not yet** (yellow) |
| | Users are confident they have found all the changes | Tag: **Not yet** (yellow) |
| | Users understand what changed and why | Tag: **Not yet** (yellow) |

Use `govukTag` for the result tags.

Under the table, two `govukDetails` components, closed by default, each containing a `govukTable` with a numeric second column (`format: "numeric"`):

**What we observed in task 1**
| Observation | Participants |
|---|---|
| Completed the task without assistance | 7 of 7 |
| Expected stronger links between map features and information panels | 6 of 7 |
| Relied on satellite imagery to validate mapping | 6 of 7 |
| Struggled to interpret some land cover information | 4 of 7 |
| Expected measurement tools | 4 of 7 |

**What we observed in task 2**
| Observation | Participants |
|---|---|
| Found historic mapping without assistance | 5 of 7 |
| Needed assistance to find historic mapping | 2 of 7 |
| Identified at least one change once historic mapping was open | 7 of 7 |
| Were not confident they had identified all the changes | 5 of 7 |

### 8. Recommended actions (`<section id="recommended-actions">`)

- H2 (`govuk-heading-l`): **Recommended actions**
- A `govuk-grid-row` with two `govuk-grid-column-one-half` columns. Each has an `h3.govuk-heading-m` and an `ol.govuk-list.govuk-list--number`:

**Immediate priorities**
1. Strengthen the interactions between the map and the information panel.
2. Improve confidence identifying changes.
3. Make historic mapping easier to find.
4. Improve how mapping changes are explained.

**Next iteration**
1. Test side by side comparison concepts.
2. Explore transparency controls for imagery.
3. Make land cover information easier to interpret.
4. Review layer terminology and descriptions.

### 9. Pagination (`govukPagination`)
- `next` only: label text **Land summary (v1.2)**, linking to the existing v1.2 design history page. No `previous` unless a round 9 page exists; if one does, add it and say so in your summary.

## Remove from the current page

- The right-hand "Page details" sidebar. Its content is now in the study details summary list.
- The blue-header "What we learned" boxes and grey-header "What this means for the design" boxes, along with any custom CSS used only by them. Check the CSS isn't used anywhere else before deleting it.
- The separate per-task "Results" and "Outcomes" tables. They are replaced by the combined table and the observation details.

## Acceptance criteria

- [ ] Only GOV.UK Frontend macros and classes are used. The only hand-written HTML is the combined outcomes table, which uses `govuk-table` classes.
- [ ] Heading order is correct: one H1; H2 for Contents, each finding, Task outcomes and Recommended actions; H3 for "What participants said" and the two action lists.
- [ ] Participant quotes are visible without any interaction.
- [ ] Every link in Contents jumps to its section.
- [ ] Details components: exactly three ("How we ran this round" and the two observation tables), all closed by default.
- [ ] The page works at 320px wide with no horizontal page scroll. The combined table may scroll inside its own container.
- [ ] Prototype Kit starts without errors and the page renders at `/v18/design-history/research-1-1`.
- [ ] No other pages change, apart from P11 → P3 fixes for this round.
- [ ] No participant ID higher than P7 appears on the page.

## Content correction

The current page attributes “RPA are constantly tinkering with boundaries and changing shapes.” to **P11**. That's wrong — the round had 7 participants. It should be **P3**, as written above. Search the whole prototype for any other “P11” reference to this round and fix it too.

## When you finish

Summarise the files you changed, any CSS you removed, and anything you couldn't do with the standard components.
