const test = require('node:test')
const assert = require('node:assert/strict')
const {
  parseVersionName,
  selectVersions,
  registrationOffset,
  toSnapshotFile,
  buildManifest
} = require('./convert')

// Synthetic fixtures only: the real snapshot must not be committed.
const LAT = 53.15

function rect (west, south, east, north) {
  return { type: 'Polygon', coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] }
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

test('parseVersionName returns the parts of a file name', () => {
  assert.deepEqual(parseVersionName('AA00001234_20170501_99991231'), {
    ngc: 'AA00001234', validFrom: '20170501', validTo: '99991231'
  })
})

test('selectVersions keeps only live parcels with a current and an earlier version', () => {
  const selected = selectVersions([
    version('AA00001234', '20190101', '99991231'),
    version('AA00001234', '20170501', '20190101'),
    version('AA00001234', '20170501', '20170501'), // zero-length
    version('AA00005678', '20100101', '99991231'), // one version only
    version('BB00001111', '20100101', '20190101'), // a neighbour, not in liveRefs
    version('BB00001111', '20190101', '99991231'),
    version('AA00009999', '20100101', '20150101'), // retired: no current version
    version('AA00009999', '20150101', '20160101')
  ], new Set(['AA00001234', 'AA00005678', 'AA00009999']))

  assert.deepEqual([...selected.keys()], ['AA00001234'])
  assert.deepEqual(selected.get('AA00001234').map(v => v.validFrom), ['20170501', '20190101'])
})

test('registrationOffset measures how far the snapshot sits from the API', () => {
  const live = [{ geometry: rect(-1.4, LAT, -1.399, LAT + 0.001) }]
  const snapshot = [{ geometry: rect(-1.4, LAT + 0.00002, -1.399, LAT + 0.00102) }]
  const { dLng, dLat } = registrationOffset(snapshot, live)
  assert.ok(Math.abs(dLng) < 1e-9)
  assert.ok(Math.abs(dLat - 0.00002) < 1e-9)
})

test('registrationOffset refuses an offset over 5m', () => {
  const live = [{ geometry: rect(-1.4, LAT, -1.399, LAT + 0.001) }]
  const snapshot = [{ geometry: rect(-1.4, LAT + 0.0001, -1.399, LAT + 0.0011) }] // about 11m
  assert.throws(() => registrationOffset(snapshot, live), /5m/)
})

test('toSnapshotFile keeps the dates exactly and gives the page\'s field names', () => {
  const file = toSnapshotFile(
    version('AA00001234', '20170501', '20190101', [
      cover('AA00001234', '20170501', '20190101', rect(-1.4, LAT, -1.399, LAT + 0.001), 5000)
    ]),
    { sbi: '112965195', offset: { dLng: 0, dLat: 0 } }
  )
  const p = file.features[0].properties
  assert.equal(p.SHEET_ID, 'AA0000')
  assert.equal(p.PARCEL_ID, '1234')
  assert.equal(p.DESCRIPTION, 'Permanent Grassland')
  assert.equal(p.LAND_COVER_CLASS_CODE, '130')
  assert.equal(p.AREA_HA, '0.5')
  assert.equal(p.SHAPE_AREA, 5000)
  assert.equal(p.VALID_FROM, '20170501')
  assert.equal(p.VALID_TO, '20190101')
  assert.equal(p.SBI, '112965195')
  assert.equal('CREATED_ON' in p, false)
  assert.equal(file.parcel.properties.VALID_FROM, '20170501')
  assert.equal(file.parcel.properties.VALID_TO, '20190101')
  assert.equal('CREATED_ON' in file.parcel.properties, false)
})

test('toSnapshotFile moves coordinates by minus the offset', () => {
  const file = toSnapshotFile(
    version('AA00001234', '20170501', '20190101', [
      cover('AA00001234', '20170501', '20190101', rect(-1.4, LAT, -1.399, LAT + 0.001), 5000)
    ]),
    { sbi: '112965195', offset: { dLng: 0.00001, dLat: 0.00002 } }
  )
  const [lng, lat] = file.features[0].geometry.coordinates[0][0]
  assert.ok(Math.abs(lng - (-1.40001)) < 1e-9)
  assert.ok(Math.abs(lat - (LAT - 0.00002)) < 1e-9)
})

test('toSnapshotFile joins touching covers into one parcel and flags the hedgerows', () => {
  const file = toSnapshotFile(
    version('AA00001234', '20170501', '20190101', [
      cover('AA00001234', '20170501', '20190101', rect(-1.4, LAT, -1.399, LAT + 0.001), 5000),
      cover('AA00001234', '20170501', '20190101', rect(-1.399, LAT, -1.398, LAT + 0.001), 5000, 'Arable Land')
    ]),
    { sbi: '112965195', offset: { dLng: 0, dLat: 0 } }
  )
  assert.equal(file.features.length, 2)
  assert.equal(file.parcel.geometry.type, 'Polygon')
  assert.equal(file.parcel.properties.AREA_HA, '1')
  assert.equal(file.parcel.properties.SHEET_ID, 'AA0000')
  assert.equal(file.parcel.properties.PARCEL_ID, '1234')
  assert.equal(file.hedgesUnavailable, true)
})

test('buildManifest lists previous versions newest first and never the current one', () => {
  const selected = new Map([['AA00001234', [
    version('AA00001234', '20100101', '20170501'),
    version('AA00001234', '20170501', '20190101'),
    version('AA00001234', '20190101', '99991231')
  ]]])
  const manifest = buildManifest(selected, { sbi: '112965195', stamp: 'abc' })
  const base = '/public/data/snapshot-112965195/AA00001234-'

  assert.equal(manifest.sbi, '112965195')
  assert.equal(manifest.generatedAt, 'abc')
  assert.equal(manifest.history.AA00001234.beforeFile, base + '20170501.json?v=abc')
  assert.equal(manifest.history.AA00001234.dateLabel, '1 May 2017 to 1 January 2019')
  assert.deepEqual(manifest.dateVersions.AA00001234, [
    { file: null },
    { file: base + '20100101.json?v=abc' }
  ])
})
