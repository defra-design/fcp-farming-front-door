#!/usr/bin/env node
// Checks the links on design history pages against the running dev server.
//
//   npm run check-links                                   all app/views/**/_design-history pages
//   npm run check-links -- /v18/_design-history/design-history-1-2   just these pages
//
// For each page it fetches every internal link and reports:
//   broken  – the link does not return 200 (or the href is empty, e.g. an unknown page id)
//   parked  – the link points at a page marked status: 'parked' in an app/data/*-pages.js list
//   redirect – the link redirects (reported, not a failure)
// External links are skipped. Exits 1 if anything is broken or parked.
//
// Needs `npm run dev` running (not `npm start`, which redirects everything to https).
// Set BASE_URL to check another server.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const VIEWS = path.join(ROOT, 'app', 'views')
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

function designHistoryPages (dir = VIEWS, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) designHistoryPages(full, found)
    else if (entry.name.endsWith('.html') && full.includes(`${path.sep}_design-history${path.sep}`)) {
      found.push('/' + path.relative(VIEWS, full).split(path.sep).join('/').replace(/\.html$/, ''))
    }
  }
  return found
}

// Paths of parked pages, from every app/data/*-pages.js page list.
function parkedPaths () {
  const dataDir = path.join(ROOT, 'app', 'data')
  const parked = new Map()
  for (const file of fs.readdirSync(dataDir).filter(f => f.endsWith('-pages.js'))) {
    const list = require(path.join(dataDir, file))
    for (const p of list.parked || []) parked.set(list.base + p.path, `${p.name} (${file})`)
  }
  return parked
}

const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

function linksIn (html) {
  // Drop HTML comments first: commented-out links are not on the page.
  const visible = html.replace(/<!--[\s\S]*?-->/g, '')
  return [...visible.matchAll(/<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1/gi)].map(m => decode(m[2]).trim())
}

async function status (url) {
  try {
    const res = await fetch(url, { redirect: 'manual' })
    return { code: res.status, location: res.headers.get('location') }
  } catch (err) {
    return { code: 0, error: err.message }
  }
}

async function checkPage (pagePath, parked, cache) {
  const pageUrl = BASE_URL + pagePath
  const page = await status(pageUrl)
  if (page.code !== 200) return [{ kind: 'broken', href: pagePath, detail: `page itself returned ${page.code || page.error}` }]

  const html = await (await fetch(pageUrl)).text()
  const problems = []
  const seen = new Set()

  for (const href of linksIn(html)) {
    if (seen.has(href)) continue
    seen.add(href)
    if (href === '') { problems.push({ kind: 'broken', href: '(empty href)', detail: 'check the page id or data lookup' }); continue }
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue

    const url = new URL(href, pageUrl)
    if (url.origin !== BASE_URL) continue

    const parkedName = parked.get(url.pathname)
    if (parkedName) problems.push({ kind: 'parked', href, detail: parkedName })

    const key = url.pathname + url.search
    if (!cache.has(key)) cache.set(key, status(url.href))
    const res = await cache.get(key)
    if (res.code >= 300 && res.code < 400) problems.push({ kind: 'redirect', href, detail: `→ ${res.location}` })
    else if (res.code !== 200) problems.push({ kind: 'broken', href, detail: String(res.code || res.error) })
  }
  return problems
}

async function main () {
  const pages = process.argv.slice(2).length ? process.argv.slice(2) : designHistoryPages()
  const parked = parkedPaths()
  const cache = new Map()

  const ping = await status(BASE_URL + '/')
  if (ping.code === 0) {
    console.error(`Nothing answering at ${BASE_URL}. Start the prototype with \`npm run dev\`.`)
    process.exit(2)
  }

  let failures = 0
  for (const pagePath of pages) {
    const problems = await checkPage(pagePath, parked, cache)
    failures += problems.filter(p => p.kind !== 'redirect').length
    if (!problems.length) { console.log(`ok      ${pagePath}`); continue }
    console.log(`        ${pagePath}`)
    for (const p of problems) console.log(`  ${p.kind.padEnd(8)} ${p.href}  ${p.detail}`)
  }

  console.log(failures ? `\n${failures} problem(s) found.` : '\nAll links fine.')
  process.exit(failures ? 1 : 0)
}

main()
