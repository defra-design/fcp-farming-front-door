# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GOV.UK Prototype Kit project for **DEFRA's FCP (Future Farming and Countryside Programme) Single Front Door** service. It is a design prototype (not production code) used for user research and testing of farming grant/payment service journeys.

The service name is "Single front door" — a unified portal for farmers to manage business details, payments, claims, and applications across multiple DEFRA schemes.

## Commands

- **Run dev server:** `npm run dev` (starts on localhost:3000 with live reload)
- **Start server:** `npm start`

There are no test suites, linters, or build steps — this is a GOV.UK Prototype Kit project.

## Architecture

### Versioned Prototypes

The prototype uses a versioning pattern where each design iteration lives in its own folder:

- **Routes:** `app/routes/<version>/routes.js` — each version exports a function `(router, _myData)` that registers Express routes under a `/<version>/` URL prefix
- **Views:** `app/views/<version>/` — Nunjucks templates for that version
- Main router (`app/routes.js`) wires all versions together, passing a deep-cloned `_myData` object to each

Active versions (as wired up in `app/routes.js`): `v6`–`v11`, `v14`, `v15-DAL`, `v16`, `v18/1.0`, `v18/1.1`, `MVP`, `MVP-integration`, `AHWP`, `AHWP-v2`, `IAHW`

`v18` nests its iterations one level deeper (`app/routes/v18/1.0/routes.js`, views in `app/views/v18/1.0/`), so its URL prefix is `/v18/1.0/`. Because the kit's auto-routing 404s on URLs containing a dot, each `v18` sub-version registers a catch-all render route in its own `routes.js`.

Not wired into the router: `app/routes/V15/` (note the capital V) and the `app/views/v1/` and `app/views/to-be/` view folders.

### Session Data Pattern (`_myData`)

Routes use a custom `req.session.myData` object instead of the kit's built-in `req.session.data` due to a known prototype kit bug where POST-set values aren't immediately available on re-rendered pages. The `_myData` defaults are defined at the top of `app/routes.js`.

Session defaults from `app/data/session-data-defaults.js` provide the kit's standard data (users, businesses, payments, messages, page lists) and configuration flags like `version`, `view` (ext/int), `release`, `startFrom`, and `includeValidation`.

### Key Data Files

`app/data/` contains mock data arrays (businesses, users, payments, messages, search results) that populate the prototype. These are imported and processed in `session-data-defaults.js`.

### Views & Layouts

- `app/views/layouts/` — Nunjucks layout templates (logged-in, GOV.UK start pages, RPS, vet visits, etc.)
- `app/views/_common/` — Shared partial templates (navigation bars, phase banners, sub-headers, design spec panels)
- Templates extend GOV.UK Prototype Kit layouts and use `govuk-frontend` / `hmrc-frontend` / `@ministryofjustice/frontend` component macros

### Page IDs (`ba05`, `int-bv01`, `ba05a`, `pd01-DAL`)

Every page carries a design-spec page ID — a stable handle for designers, developers and researchers to refer to a screen independently of its URL or file name. This is why the same ID recurs across version folders (`int-bv01` appears in 14 of them: same conceptual page, redesigned).

Anatomy:

```
int-  ba  05  a
 │    │   │   │
 │    │   │   └─ variant letter: same page, different content state
 │    │   └───── sequence number within that journey (01, 02, 03…)
 │    └───────── two-letter journey/section code
 └────────────── audience prefix: internal (Defra staff) view
```

- **`int-` prefix** — the internal/staff version of a page; no prefix means external (farmer). Maps directly to the `?view=ext|int` flag: templates set the ID conditionally (e.g. `app/views/v9/business-details-bank-check-uk-business.html` uses `ba05` under `data.view == "ext"` and `int-ba05` under `"int"`). Internal pages are usually mirrors of their external twin with staff-only additions such as the CRN field.
- **Section code** — the journey: `bd` business details, `du` document upload, `pd` personal details, `ba` bank account details, `sr` search (internal only), `mp` misc pages (cookies, accessibility, privacy), `se` service error pages (503/500/404), `bp` business pages (businesses list, business home), `bv` business overview, `cv` customer overview, `ma` my account home, `x` test page.
- **Number** — the step within that journey, often in change/check pairs (`pd02` full name change → `pd03` full name check; `ba02` country → `ba03` account type → `ba04` enter details → `ba05` check details).
- **Trailing letter** — a variant of the *same* design page, listed in the spec panel's `variants` array so you can jump between them. `ba05a`–`ba05d` are the four check-your-answers permutations (UK/business, UK/personal, European/business, European/personal), each a separate HTML file. `int-sr01a/b/c` are search by SBI / CRN / business name.
- **`-DAL` suffix** — alternative designs from the `v15-DAL` workstream (DAL interruptor + API redesign), e.g. `pd01-DAL`, `bd26-DAL`, `bd01-view-DAL` / `bd01-amend-DAL`.

Where they live:

- `app/data/page-list.js` is the canonical page inventory — each entry has `pageid`, `pagename`, `pageurl`, `pagedesc`.
- Each template sets a `_designSpecData` object (with `id`, `name`, `release`, `url`, `variants`, `errormessages`, `notes`) and `_showDesignSpec`.
- `app/views/_common/design-spec.html` and `design-spec-2.html` render the panel. If a template omits `pagedesc`/`pageurl`, the partial falls back to looking them up in the page list by matching `item.pageid == _designSpecData.id` — so keep IDs in sync with `page-list.js`.

### Custom Nunjucks Filters

`app/filters.js` defines `shortDate` and `toMonth` filters available in all templates.

### Query String Flags

Many pages respond to query parameters to toggle prototype states: `?r` resets session, `?business=<id>` selects a business, `?view=ext|int` switches external/internal user view, `?release=concept|b1|b2` changes release version.

## Pre-commit Hooks

A `detect-secrets` pre-commit hook runs via the Yelp/detect-secrets tool with baseline `.secrets.baseline`.
