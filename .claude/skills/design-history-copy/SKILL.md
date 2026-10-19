---
name: design-history-copy
description: Edit design history pages in this prototype (app/views/*/_design-history/*.html) so the copy is concise, scannable and in GOV.UK style, without losing facts. Use whenever the user asks to tighten, shorten, simplify, tidy, proofread or "make more concise" any design history copy, or when writing a new design history section — even if they don't say "concise".
---

# Design history copy

Design history pages record what changed in a prototype iteration and why, for designers, developers, researchers and product owners skimming between versions. Readers want the decision and its reason fast; detail is there for the few who need it. Long paragraphs bury the decision, so the job is to surface it and trim everything that doesn't help a reader understand or reuse the design.

## Rules

1. **Lead with the decision.** Open each section with what changed and why, in 1–2 sentences. Put the "why" next to the "what" — a reader skimming only first sentences should still get the story.
2. **One idea per paragraph.** Aim for sentences under about 25 words and paragraphs of no more than 3 sentences. Split rather than chain clauses with "and", "which", "so that".
3. **Move implementation detail out of the narrative.** Workarounds, plugin bugs, matching algorithms and data sources matter to developers, not to most readers. Put them in a GOV.UK Details component (`govuk-details`, summary "Technical notes") at the end of the section, kept short.
4. **Say it once.** If a research finding, figure or caveat is stated elsewhere on the page, refer to it briefly ("see the research on v1.1") instead of repeating the numbers. Keep one finding sentence per change section at most.
5. **GOV.UK style.** Plain English, active voice, "we" for the team, numerals ("6 of 7"), bullet items lower case with no full stop, no "simply", "just", "in order to", "currently", "note that", "please". Don't use bold for emphasis in body text. Don't put quotation marks round UI labels: write Current details and Previous details radios, not "Current details" and "Previous details" radios. Research design implications sit in GOV.UK notification banners titled "What this means for the design"; keep them there.
6. **Prefer components to prose** — only GOV.UK Design System components. A comparison of options or variants → a table or summary list. Three or more parallel items → a bullet list.
7. **Keep the meaning.** Never drop a figure, participant quote, caveat ("would need to be raised with the interactive map team", "prototype workaround", "not tested yet"), link or URL. If a sentence is ambiguous, keep it and flag it rather than guess. Don't change headings' order or IDs that other pages link to.
8. **Don't touch markup you don't need to.** Keep existing classes, links and `?parcel=` query strings exactly.

## Workflow

For a new design history page, start from `app/views/_templates/design-history.html` (preview at `/_templates/design-history`): copy it to `app/views/<version>/_design-history/design-history-<x-y>.html`, replace the [square bracket] placeholders and delete the blocks the iteration doesn't need. It is organised around decisions: each problem keeps its finding, hypothesis, options, accessibility and technical notes together. Research findings go on their own page, from `app/views/_templates/research-round.html`, filed with the version tested (e.g. `research-1-1.html`); design histories link to it rather than repeating it. The template comments explain the page list, screenshots and link check.

1. Read the whole file first, so you know what is said where (rule 4 depends on it).
2. Note the word count of the visible copy per `h2` section (strip tags; a quick Python script is fine).
3. Edit one `h2` section at a time.
4. Check the page renders by `curl`ing it on the user's already-running dev server (e.g. `http://localhost:3000/v18/_design-history/design-history-1-2`) and confirm a 200 and that the edited headings are present. Don't start or stop the server yourself: a broad `pkill` kills the user's own server. If nothing is running on port 3000, ask the user to run `npm run dev` (not `npm start`, which forces https).
5. Report a before/after word count table per section, and list anything you moved into technical notes or flagged as ambiguous.

## Example

Before:
> In v1.1 a user could click a hedgerow on the map to highlight the matching row in the data column, but land covers were not clickable. We extended the same behaviour to land covers.

After:
> Land covers are now clickable, like hedgerows were in v1.1. Clicking one highlights its row in the Land covers table.
