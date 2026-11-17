const test = require('node:test')
const assert = require('node:assert/strict')
const { area } = require('@turf/area')
const { dayAfter, findLineage, makeSymmetric, toLineageFile, lineageSummary } = require('./lineage')

// Synthetic fixtures only. Boxes are in units of 0.001 degrees from a fixed corner.
const LAT = 53.15
const LNG = -1.4
const UNIT = 0.001

function rect (west, south, east, north) {
  return { type: 'Polygon', coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] }
}

function box (w, s, e, n) {
  return rect(LNG + w * UNIT, LAT + s * UNIT, LNG + e * UNIT, LAT + n * UNIT)
}

function cover (ref, validFrom, validTo, geometry, areaSqm, description = 'Permanent Grassland') {
  return {
    type: 'Feature',
    geometry,
    properties: {
      ID: 100,
      REFERENCE_PARCELS_ID: 200,
      PARCEL_REF: ref,
      LAND_COVER_CLASS_CODE: '130',
      LAND_COVER_CLASS_DESCRIPTION: description,
      VALID_FROM: validFrom,
      VALID_TO: validTo,
      GEOM_AREA_SQM: areaSqm
    }
  }
}

function version (ref, validFrom, validTo, features = []) {
  return { ngc: ref, validFrom, validTo, features }
}

// A version with one cover the shape of the box, its GEOM_AREA_SQM set from @turf/area.
function v (ref, validFrom, validTo, b) {
  const geometry = box(...b)
  return version(ref, validFrom, validTo, [cover(ref, validFrom, validTo, geometry, area(geometry))])
}

function ha (b) {
  return area(box(...b)) / 10000
}

function near (actual, expected, tolerance = 0.0001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`)
}

const A1 = v('A', '20100101', '20160101', [0, 0, 2, 1])
const A2 = v('A', '20160101', '99991231', [0, 0, 1, 1])
const LIVE = { liveRefs: new Set(['A', 'B', 'C', 'U']) }

test('dayAfter rolls over months and years', () => {
  assert.equal(dayAfter('20151231'), '20160101')
  assert.equal(dayAfter('20170501'), '20170502')
  assert.equal(dayAfter('20240228'), '20240229')
})

test('land leaving to a new parcel is a split', () => {
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const lineage = findLineage('A', [A1, A2, B], LIVE)

  assert.equal(lineage.groups.length, 1)
  const [group] = lineage.groups
  assert.equal(group.date, '20160101')
  assert.equal(group.direction, 'out')
  assert.equal(group.kind, 'split')
  assert.equal(group.mapDate, '20100101')
  assert.equal(group.links.length, 1)
  assert.equal(group.links[0].ref, 'B')
  near(group.links[0].ha, ha([0, 0, 2, 1]) / 2)
  near(group.ownHa, ha([0, 0, 2, 1]) / 2)

  assert.deepEqual(lineage.pieces.map(p => [p.direction, p.ref]).sort(), [['out', 'B'], ['stayed', undefined]])
  assert.deepEqual(lineage.earlierVersions, [])
})

test('land leaving to an existing parcel is moved', () => {
  const Bold = v('B', '20100101', '20160101', [1, 1, 2, 2])
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const lineage = findLineage('A', [A1, A2, Bold, B], LIVE)
  const out = lineage.groups.filter(g => g.direction === 'out')
  assert.equal(out.length, 1)
  assert.equal(out[0].kind, 'moved')
})

test('a parcel that starts a day later still counts', () => {
  const late = findLineage('A', [A1, A2, v('B', '20160102', '99991231', [1, 0, 2, 1])], LIVE)
  assert.equal(late.groups.length, 1)
  assert.equal(late.groups[0].date, '20160101')
  assert.equal(late.groups[0].links[0].ref, 'B')

  const tooLate = findLineage('A', [A1, A2, v('B', '20160103', '99991231', [1, 0, 2, 1])], LIVE)
  assert.deepEqual(tooLate.groups, [])
})

test('a version ending on 31 December links to one starting on 1 January', () => {
  const A1dec = v('A', '20100101', '20151231', [0, 0, 2, 1])
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const lineage = findLineage('A', [A1dec, A2, B], LIVE)
  assert.equal(lineage.groups.length, 1)
  assert.equal(lineage.groups[0].date, '20160101')
  assert.deepEqual(lineage.groups[0].links.map(l => l.ref), ['B'])
})

test('a new parcel made from another is created', () => {
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const lineage = findLineage('B', [A1, A2, B], LIVE)
  assert.equal(lineage.groups.length, 1)
  const [group] = lineage.groups
  assert.equal(group.date, '20160101')
  assert.equal(group.direction, 'in')
  assert.equal(group.kind, 'created')
  assert.equal(group.mapDate, '20160101')
  assert.deepEqual(group.links.map(l => l.ref), ['A'])
  near(group.links[0].ha, ha([1, 0, 2, 1]))
  assert.equal('ownHa' in group, false)
  assert.deepEqual(lineage.pieces.map(p => [p.direction, p.ref]), [['in', 'A']])
})

const AM1 = v('A', '20160101', '20190101', [0, 0, 2, 1])
const AM2 = v('A', '20190101', '99991231', [0, 0, 3, 1])
const C1 = v('C', '20100101', '20190101', [2, 0, 3, 1])

test('parcels that ended and joined are merged', () => {
  const lineage = findLineage('A', [AM1, AM2, C1], LIVE)
  assert.equal(lineage.groups.length, 1)
  const [group] = lineage.groups
  assert.equal(group.date, '20190101')
  assert.equal(group.direction, 'in')
  assert.equal(group.kind, 'merged')
  assert.equal(group.mapDate, '20190101')
  assert.deepEqual(group.links.map(l => l.ref), ['C'])
  near(group.links[0].ha, ha([2, 0, 3, 1]))
  near(group.ownHa, ha([0, 0, 2, 1]))
})

test('land from a parcel that carries on is added', () => {
  const C2 = v('C', '20190101', '99991231', [2.5, 0, 3, 1])
  const lineage = findLineage('A', [AM1, AM2, C1, C2], LIVE)
  const inGroups = lineage.groups.filter(g => g.direction === 'in')
  assert.equal(inGroups.length, 1)
  assert.equal(inGroups[0].kind, 'added')
  near(inGroups[0].ownHa, ha([0, 0, 2, 1]))
})

test('slivers under 0.01 ha are dropped', () => {
  // About 0.007 units by 1 unit: roughly 52 square metres inside A's first version.
  const B = v('B', '20160101', '99991231', [1.993, 0, 3, 1])
  const lineage = findLineage('A', [A1, A2, B], LIVE)
  assert.deepEqual(lineage.groups, [])
  assert.deepEqual(lineage.pieces, [])
})

test('zero-length versions are ignored', () => {
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const zero = v('B', '20160101', '20160101', [1, 0, 2, 1])
  assert.deepEqual(findLineage('A', [A1, A2, B, zero], LIVE), findLineage('A', [A1, A2, B], LIVE))
  assert.equal(findLineage('A', [A1, A2, zero, B], LIVE).groups[0].kind, 'split')
})

test('inBusiness follows liveRefs', () => {
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  assert.equal(findLineage('A', [A1, A2, B], { liveRefs: new Set(['A', 'B']) }).groups[0].links[0].inBusiness, true)
  assert.equal(findLineage('A', [A1, A2, B], { liveRefs: new Set(['A']) }).groups[0].links[0].inBusiness, false)
})

test('a reference change is its own group', () => {
  const U = v('U', '20131216', '20151231', [0, 0, 1, 1])
  const A = v('A', '20160101', '99991231', [0, 0, 1, 1])
  const lineage = findLineage('A', [U, A], LIVE)
  assert.equal(lineage.groups.length, 1)
  const [group] = lineage.groups
  assert.equal(group.direction, 'reference')
  assert.equal(group.kind, 'reference')
  assert.equal(group.date, '20160101')
  assert.equal(group.mapDate, '20160101')
  assert.deepEqual(group.links.map(l => l.ref), ['U'])
  near(group.links[0].ha, ha([0, 0, 1, 1]))
  assert.equal(group.links[0].inBusiness, true)
  assert.deepEqual(lineage.earlierVersions, [U])
})

test('half an overlap is not a reference change', () => {
  const U = v('U', '20131216', '20151231', [0, 0, 1, 1])
  const A = v('A', '20160101', '99991231', [0, 0, 2, 1])
  const lineage = findLineage('A', [U, A], LIVE)
  assert.equal(lineage.groups.length, 1)
  assert.equal(lineage.groups[0].kind, 'created')
  assert.deepEqual(lineage.groups[0].links.map(l => l.ref), ['U'])
  assert.deepEqual(lineage.earlierVersions, [])
})

test('findLineage records the first and last date of every reference', () => {
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const { facts } = findLineage('A', [A1, A2, B], LIVE)
  assert.deepEqual(facts.A.first, '20100101')
  assert.deepEqual(facts.A.last, '99991231')
  assert.deepEqual(facts.B.first, '20160101')
  assert.deepEqual(facts.B.last, '99991231')
})

function lineageWithOut () {
  return {
    A: {
      groups: [{ date: '20160101', direction: 'out', kind: 'split', links: [{ ref: 'B', ha: 1.5, inBusiness: true }], ownHa: 2, mapDate: '20100101' }],
      pieces: [],
      earlierVersions: [],
      facts: { A: { first: '20100101', last: '99991231' }, B: { first: '20160101', last: '99991231' } }
    },
    B: {
      groups: [],
      pieces: [],
      earlierVersions: [],
      facts: { A: { first: '20100101', last: '99991231' }, B: { first: '20160101', last: '99991231' } }
    }
  }
}

test('makeSymmetric fills the missing side', () => {
  const input = lineageWithOut()
  const before = JSON.parse(JSON.stringify(input))
  const result = makeSymmetric(input)

  assert.deepEqual(input, before)
  assert.equal(result.B.groups.length, 1)
  const [group] = result.B.groups
  assert.equal(group.date, '20160101')
  assert.equal(group.direction, 'in')
  assert.equal(group.kind, 'created')
  assert.deepEqual(group.links, [{ ref: 'A', ha: 1.5, inBusiness: true }])
  assert.deepEqual(result.B.pieces, [])
  assert.deepEqual(result.A, input.A)
})

test('makeSymmetric fills a missing out side for a parcel that ended', () => {
  const facts = { A: { first: '20160101', last: '99991231' }, C: { first: '20100101', last: '20190101' } }
  const result = makeSymmetric({
    A: {
      groups: [{ date: '20190101', direction: 'in', kind: 'merged', links: [{ ref: 'C', ha: 0.7, inBusiness: true }], ownHa: 1.4, mapDate: '20190101' }],
      pieces: [],
      earlierVersions: [],
      facts
    },
    C: { groups: [], pieces: [], earlierVersions: [], facts }
  })
  assert.equal(result.C.groups.length, 1)
  assert.equal(result.C.groups[0].direction, 'out')
  assert.equal(result.C.groups[0].kind, 'moved')
  assert.deepEqual(result.C.groups[0].links, [{ ref: 'A', ha: 0.7, inBusiness: true }])
})

test('makeSymmetric leaves complete pairs alone', () => {
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const versions = [A1, A2, B]
  const input = { A: findLineage('A', versions, LIVE), B: findLineage('B', versions, LIVE) }
  const result = makeSymmetric(input)
  assert.deepEqual(result, input)
  assert.notEqual(result.A, input.A)
})

test('toLineageFile shifts pieces and labels them', () => {
  const B = v('B', '20160101', '99991231', [1, 0, 2, 1])
  const lineage = findLineage('A', [A1, A2, B], LIVE)
  const file = toLineageFile(lineage, { offset: { dLng: 0.0001, dLat: 0.00002 } })

  assert.equal(file.type, 'FeatureCollection')
  assert.equal(file.features.length, lineage.pieces.length)
  file.features.forEach((feature, i) => {
    const piece = lineage.pieces[i]
    assert.equal(feature.type, 'Feature')
    assert.deepEqual(Object.keys(feature.properties).sort(), ['date', 'direction', 'ha', 'ref'])
    assert.equal(feature.properties.date, piece.date)
    assert.equal(feature.properties.direction, piece.direction)
    assert.equal(feature.properties.ref, piece.ref || null)
    near(feature.properties.ha, piece.ha)
    const [lng, lat] = feature.geometry.coordinates[0][0]
    const [pLng, pLat] = piece.geometry.coordinates[0][0]
    assert.ok(Math.abs(lng - (pLng - 0.0001)) < 1e-9)
    assert.ok(Math.abs(lat - (pLat - 0.00002)) < 1e-9)
  })
})

test('lineageSummary rounds to 4 places and drops pieces', () => {
  const summary = lineageSummary({
    groups: [{ date: '20160101', direction: 'out', kind: 'split', links: [{ ref: 'B', ha: 1.234567, inBusiness: true }], ownHa: 0.987654, mapDate: '20100101' }],
    pieces: [{ date: '20160101', direction: 'out', ref: 'B', ha: 1.234567, geometry: box(0, 0, 1, 1) }],
    earlierVersions: [],
    facts: { B: { first: '20160101', last: '99991231' } }
  })
  assert.deepEqual(summary, {
    groups: [{ date: '20160101', direction: 'out', kind: 'split', links: [{ ref: 'B', ha: 1.2346, inBusiness: true }], ownHa: 0.9877, mapDate: '20100101' }]
  })
})
