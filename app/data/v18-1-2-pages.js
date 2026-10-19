// The v18/1.2 land summary pages, in one place. The 1.2 index's What's new table and the
// 1.2 design history both read this list (exposed as `v18_12` by app/routes/v18/1.2/routes.js),
// so parking or adding a page here updates every list of pages at once.
//
//   id             stable handle the design history uses to look a page up
//   name           row label in the What's new table
//   url            path and query string, relative to /v18/1.2/
//   status         'live' (listed) or 'parked' (kept in the prototype, but not listed anywhere;
//                  the design history link checker flags any link to a parked page)
//   linkText       What's new link text (defaults to url)
//   extraLinks     further links shown after the main one in What's new, as [{ text, url }]
//   designHistory  true to include the page in the design history's link list

const BASE = '/v18/1.2/'

const pages = [
  { id: 'view-land', name: 'View land', url: 'view-land', status: 'live' },
  { id: 'historical-view', name: 'Historical view', url: 'view-land-parcel?parcel=SX39647821', status: 'live', designHistory: true },
  { id: 'compare-side-by-side', name: 'Compare versions (side by side)', url: 'view-land-parcel-compare-side-by-side?parcel=SX39647821', status: 'live', designHistory: true },
  { id: 'compare-stacked', name: 'Compare versions (stacked)', url: 'view-land-parcel-compare-stacked?parcel=SX39647821', status: 'live', designHistory: true },
  { id: 'compare-overlay', name: 'Compare versions (single map: overlay radios)', url: 'view-land-parcel-compare-overlay?parcel=SX39647821', status: 'live', designHistory: true },
  { id: 'compare-fade', name: 'Compare versions (single map: fade slider)', url: 'view-land-parcel-compare-fade?parcel=SX39647821', status: 'live', designHistory: true },
  { id: 'dates-list', name: 'Dates list (copy of single map: overlay radios)', url: 'view-land-parcel-dates-list?parcel=SX39647821', status: 'live', designHistory: true },
  {
    id: 'dates-list-merges',
    name: 'Dates list with merges (mocked)',
    url: 'view-land-parcel-dates-list-splits-and-merge?parcel=SX39646918',
    linkText: 'SX39646918 (SX3964 6418 + SX3964 7821)',
    extraLinks: [{ text: 'Grouped list (splitView=grouped)', url: 'view-land-parcel-dates-list-splits-and-merge?parcel=SX39646918&splitView=grouped' }],
    status: 'parked',
    designHistory: true
  },
  { id: 'compare-layers', name: 'Compare versions (single map: layers panel)', url: 'view-land-parcel-compare-layers?parcel=SX39647821', status: 'parked' },
  { id: 'compare-changes', name: 'Compare versions (single map: changes outlined)', url: 'view-land-parcel-compare-changes?parcel=SX39647821', status: 'parked' },
  { id: 'demo-start', name: 'Demo start', url: 'demo-start', linkText: 'Enter SBI and business name', status: 'live' }
]

pages.forEach(p => {
  p.href = BASE + p.url
  p.path = p.url.split('?')[0]
  p.linkText = p.linkText || p.url
  ;(p.extraLinks || []).forEach(l => { l.href = BASE + l.url })
})

module.exports = {
  base: BASE,
  pages,
  live: pages.filter(p => p.status === 'live'),
  parked: pages.filter(p => p.status === 'parked'),
  byId: Object.fromEntries(pages.map(p => [p.id, p]))
}
