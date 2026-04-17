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

Active versions: `v6`–`v11`, `v14`–`v16`, `MVP`, `MVP-integration`, `AHWP`, `AHWP-v2`, `IAHW`, `v15-DAL`

### Session Data Pattern (`_myData`)

Routes use a custom `req.session.myData` object instead of the kit's built-in `req.session.data` due to a known prototype kit bug where POST-set values aren't immediately available on re-rendered pages. The `_myData` defaults are defined at the top of `app/routes.js`.

Session defaults from `app/data/session-data-defaults.js` provide the kit's standard data (users, businesses, payments, messages, page lists) and configuration flags like `version`, `view` (ext/int), `release`, `startFrom`, and `includeValidation`.

### Key Data Files

`app/data/` contains mock data arrays (businesses, users, payments, messages, search results) that populate the prototype. These are imported and processed in `session-data-defaults.js`.

### Views & Layouts

- `app/views/layouts/` — Nunjucks layout templates (logged-in, GOV.UK start pages, RPS, vet visits, etc.)
- `app/views/_common/` — Shared partial templates (navigation bars, phase banners, sub-headers, design spec panels)
- Templates extend GOV.UK Prototype Kit layouts and use `govuk-frontend` / `hmrc-frontend` / `@ministryofjustice/frontend` component macros

### Custom Nunjucks Filters

`app/filters.js` defines `shortDate` and `toMonth` filters available in all templates.

### Query String Flags

Many pages respond to query parameters to toggle prototype states: `?r` resets session, `?business=<id>` selects a business, `?view=ext|int` switches external/internal user view, `?release=concept|b1|b2` changes release version.

## Pre-commit Hooks

A `detect-secrets` pre-commit hook runs via the Yelp/detect-secrets tool with baseline `.secrets.baseline`.
