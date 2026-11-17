// Works out where a parcel's land went to and came from, using the versions in the RPA parcel
// snapshot. Dates are matched with a one-day tolerance but kept exactly as supplied.
// Other parcels appear only as a reference, an area and flags. Map pieces are intersections with
// this parcel's own versions.

const { area } = require('@turf/area')
const { intersect } = require('@turf/intersect')
const { union } = require('@turf/union')
const { CURRENT, shift } = require('./convert')

const REFERENCE_SHARE = 0.99
const DIRECTION_ORDER = { out: 0, reference: 1, in: 2 }

function dayAfter (yyyymmdd) {
  const date = new Date(Date.UTC(
    Number(yyyymmdd.slice(0, 4)),
    Number(yyyymmdd.slice(4, 6)) - 1,
    Number(yyyymmdd.slice(6, 8)) + 1
  ))
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

// True when b is the same day as a or the day after it.
function sameOrDayAfter (a, b) {
  return a === b || dayAfter(a) === b
}

function withinADay (a, b) {
  return sameOrDayAfter(a, b) || sameOrDayAfter(b, a)
}

const outlines = new WeakMap()

function outline (version) {
  if (!outlines.has(version)) {
    const features = version.features.map(f => ({ type: 'Feature', geometry: f.geometry, properties: {} }))
    const geometry = features.length > 1
      ? union({ type: 'FeatureCollection', features }).geometry
      : features[0].geometry
    const sqm = version.features.reduce((total, f) => total + f.properties.GEOM_AREA_SQM, 0)
    outlines.set(version, { geometry, ha: sqm / 10000, sqm: area(geometry) })
  }
  return outlines.get(version)
}

// The part of `from` that is also in `other`, with its area scaled to `from`'s recorded area.
function cut (from, other) {
  const a = outline(from)
  const b = outline(other)
  const feature = intersect({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: a.geometry, properties: {} },
      { type: 'Feature', geometry: b.geometry, properties: {} }
    ]
  })
  if (!feature || a.sqm === 0) return { ha: 0, geometry: null }
  return { ha: area(feature) / a.sqm * a.ha, geometry: feature.geometry }
}

function byRef (versions) {
  const map = new Map()
  versions.forEach(v => {
    if (v.validFrom === v.validTo) return
    if (!map.has(v.ngc)) map.set(v.ngc, [])
    map.get(v.ngc).push(v)
  })
  map.forEach(list => list.sort((a, b) => a.validFrom.localeCompare(b.validFrom)))
  return map
}

function sortLinks (links) {
  return links.sort((a, b) => b.ha - a.ha || a.ref.localeCompare(b.ref))
}

function sortGroups (groups) {
  return groups.sort((a, b) => a.date.localeCompare(b.date) || DIRECTION_ORDER[a.direction] - DIRECTION_ORDER[b.direction])
}

function findLineage (ngc, versions, { liveRefs, minHa = 0.01 }) {
  const refs = byRef(versions)
  const own = refs.get(ngc) || []
  const others = []
  const facts = {}
  refs.forEach((list, ref) => {
    facts[ref] = {
      first: list[0].validFrom,
      last: list[list.length - 1].validTo,
      spans: list.map(w => [w.validFrom, w.validTo])
    }
    if (ref !== ngc) list.forEach((w, i) => others.push({ w, first: i === 0, latest: i === list.length - 1 }))
  })
  const inBusiness = (ref) => liveRefs.has(ref)

  const groups = []
  const pieces = []
  let earlierVersions = []

  // Links whose `ha` is under minHa are dropped, and so is a group left with no links.
  function keep (group, linkPieces, stayed) {
    const kept = group.links.map((link, i) => ({ link, piece: linkPieces[i] })).filter(({ link }) => link.ha >= minHa)
    if (kept.length === 0) return
    group.links = sortLinks(kept.map(({ link }) => link))
    groups.push(group)
    kept.forEach(({ piece }) => pieces.push(piece))
    if (stayed) pieces.push(stayed)
  }

  own.forEach((current, k) => {
    if (k > 0) {
      const before = own[k - 1]
      const candidates = others.filter(({ w }) => sameOrDayAfter(before.validTo, w.validFrom))
      const links = []
      const linkPieces = []
      let split = true
      candidates.forEach(({ w, first }) => {
        const piece = cut(before, w)
        if (piece.ha < minHa) return
        if (!first) split = false
        links.push({ ref: w.ngc, ha: piece.ha, inBusiness: inBusiness(w.ngc) })
        linkPieces.push({ date: current.validFrom, direction: 'out', ref: w.ngc, ha: piece.ha, geometry: piece.geometry })
      })
      const stayed = cut(before, current)
      keep({
        date: current.validFrom,
        direction: 'out',
        kind: split ? 'split' : 'moved',
        links,
        ownHa: stayed.ha,
        mapDate: before.validFrom
      }, linkPieces, stayed.geometry && { date: current.validFrom, direction: 'stayed', ha: stayed.ha, geometry: stayed.geometry })
    }

    const candidates = others.filter(({ w }) => sameOrDayAfter(w.validTo, current.validFrom))
    const links = []
    const linkPieces = []
    let merged = true
    const ownArea = outline(current).ha
    candidates.forEach(({ w, latest }) => {
      const piece = cut(current, w)
      if (piece.ha < minHa) return
      if (k === 0 && earlierVersions.length === 0 &&
          piece.ha >= REFERENCE_SHARE * ownArea && piece.ha >= REFERENCE_SHARE * outline(w).ha) {
        groups.push({
          date: current.validFrom,
          direction: 'reference',
          kind: 'reference',
          links: [{ ref: w.ngc, ha: ownArea, inBusiness: inBusiness(w.ngc) }],
          mapDate: current.validFrom
        })
        earlierVersions = refs.get(w.ngc).slice()
        return
      }
      if (!latest || w.validTo === CURRENT) merged = false
      links.push({ ref: w.ngc, ha: piece.ha, inBusiness: inBusiness(w.ngc) })
      linkPieces.push({ date: current.validFrom, direction: 'in', ref: w.ngc, ha: piece.ha, geometry: piece.geometry })
    })
    const group = { date: current.validFrom, direction: 'in', links, mapDate: current.validFrom }
    if (k === 0) {
      group.kind = 'created'
    } else {
      group.kind = merged ? 'merged' : 'added'
      group.ownHa = cut(current, own[k - 1]).ha
    }
    keep(group, linkPieces)
  })

  return { groups: sortGroups(groups), pieces, earlierVersions, facts }
}

// The version of `ref` in force just before `date`, from the facts, if the facts have its spans.
function fromBefore (fact, date) {
  const span = fact && fact.spans && fact.spans.find(([, to]) => sameOrDayAfter(to, date))
  return span ? span[0] : date
}

// The kind rules again, from facts alone, for a group makeSymmetric changed.
function reKind (group, owner, facts) {
  const fact = (ref) => facts[ref] || {}
  if (group.direction === 'out') {
    group.kind = group.links.every(l => withinADay(fact(l.ref).first || '', group.date)) ? 'split' : 'moved'
    return
  }
  if (fact(owner).first === group.date) {
    group.kind = 'created'
    delete group.ownHa
    return
  }
  const ended = (l) => {
    const last = fact(l.ref).last
    return last && last !== CURRENT && sameOrDayAfter(last, group.date)
  }
  group.kind = group.links.every(ended) ? 'merged' : 'added'
}

function makeSymmetric (lineageByNgc) {
  const facts = {}
  Object.values(lineageByNgc).forEach(l => Object.assign(facts, l.facts))
  const result = {}
  Object.entries(lineageByNgc).forEach(([ngc, l]) => {
    result[ngc] = {
      ...l,
      groups: l.groups.map(g => ({ ...g, links: g.links.map(link => ({ ...link })) })),
      pieces: l.pieces.slice(),
      earlierVersions: l.earlierVersions.slice()
    }
  })

  const additions = []
  Object.entries(lineageByNgc).forEach(([a, l]) => {
    l.groups.forEach(g => {
      if (g.direction === 'reference') return
      const opposite = g.direction === 'out' ? 'in' : 'out'
      g.links.forEach(link => {
        const b = link.ref
        if (!result[b] || b === a) return
        const matched = lineageByNgc[b].groups.some(other =>
          other.direction === opposite && withinADay(other.date, g.date) && other.links.some(x => x.ref === a))
        if (!matched) additions.push({ b, a, date: g.date, direction: opposite, ha: link.ha })
      })
    })
  })

  additions.forEach(({ b, a, date, direction, ha }) => {
    const target = result[b]
    let group = target.groups.find(g => g.direction === direction && g.date === date)
    if (!group) {
      group = {
        date,
        direction,
        links: [],
        mapDate: direction === 'out' ? fromBefore(facts[b], date) : date
      }
      target.groups.push(group)
    }
    group.links.push({ ref: a, ha, inBusiness: true })
    sortLinks(group.links)
    reKind(group, b, facts)
  })
  Object.values(result).forEach(l => sortGroups(l.groups))
  return result
}

const round = (n) => Math.round(n * 10000) / 10000

function toLineageFile (lineage, { offset }) {
  return {
    type: 'FeatureCollection',
    features: lineage.pieces.map(p => ({
      type: 'Feature',
      geometry: shift(p.geometry, offset),
      properties: { date: p.date, direction: p.direction, ref: p.ref || null, ha: round(p.ha) }
    }))
  }
}

function lineageSummary (lineage) {
  return {
    groups: lineage.groups.map(g => {
      const group = { ...g, links: g.links.map(l => ({ ...l, ha: round(l.ha) })) }
      if ('ownHa' in g) group.ownHa = round(g.ownHa)
      return group
    })
  }
}

module.exports = { dayAfter, findLineage, makeSymmetric, toLineageFile, lineageSummary }
