// Turns versions from the RPA parcel snapshot into the land cover file format the 1.3 dates list
// reads. VALID_FROM and VALID_TO are kept exactly as the snapshot has them.

const { union } = require('@turf/union')

const CURRENT = '99991231'
const MAX_OFFSET_METRES = 5
const METRES_PER_DEGREE = 111320
const OUTPUT_URL = '/public/data/snapshot-112965195/'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function parseVersionName (name) {
  const [ngc, validFrom, validTo] = name.split('_')
  return { ngc, validFrom, validTo }
}

// Previous versions plus the current one, oldest first, for parcels the API lists under this SBI.
// Zero-length versions are left out, and so is any parcel with no current or no earlier version.
function selectVersions (versions, liveRefs) {
  const byParcel = new Map()
  versions.forEach(v => {
    if (!liveRefs.has(v.ngc) || v.validFrom === v.validTo) return
    if (!byParcel.has(v.ngc)) byParcel.set(v.ngc, [])
    byParcel.get(v.ngc).push(v)
  })
  const selected = new Map()
  byParcel.forEach((list, ngc) => {
    list.sort((a, b) => a.validFrom.localeCompare(b.validFrom))
    if (list.length > 1 && list[list.length - 1].validTo === CURRENT) selected.set(ngc, list)
  })
  return selected
}

function eachPosition (geometry, fn) {
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  polygons.forEach(rings => rings.forEach(ring => ring.forEach(fn)))
}

function meanPosition (features) {
  let lng = 0
  let lat = 0
  let count = 0
  features.forEach(f => eachPosition(f.geometry, ([x, y]) => {
    lng += x
    lat += y
    count++
  }))
  return { lng: lng / count, lat: lat / count }
}

// How far the snapshot's shapes sit from the API's: snapshot minus API, in degrees.
function registrationOffset (snapshotFeatures, liveFeatures) {
  const snapshot = meanPosition(snapshotFeatures)
  const live = meanPosition(liveFeatures)
  const dLng = snapshot.lng - live.lng
  const dLat = snapshot.lat - live.lat
  const metres = Math.hypot(
    dLng * METRES_PER_DEGREE * Math.cos(live.lat * Math.PI / 180),
    dLat * METRES_PER_DEGREE
  )
  if (metres > MAX_OFFSET_METRES) {
    throw new Error(`Offset of ${metres.toFixed(1)}m is over the 5m limit`)
  }
  return { dLng, dLat }
}

function shift (geometry, { dLng, dLat }) {
  const move = (value) => typeof value[0] === 'number'
    ? [value[0] - dLng, value[1] - dLat]
    : value.map(move)
  return { type: geometry.type, coordinates: move(geometry.coordinates) }
}

function toSnapshotFile (version, { sbi, offset }) {
  const sheetId = version.ngc.substring(0, 6)
  const parcelId = version.ngc.substring(6)
  const features = version.features.map(f => {
    const p = f.properties
    return {
      type: 'Feature',
      geometry: shift(f.geometry, offset),
      properties: {
        ID: String(p.ID),
        SHEET_ID: sheetId,
        PARCEL_ID: parcelId,
        REFERENCE_PARCELS_ID: String(p.REFERENCE_PARCELS_ID),
        LAND_COVER_CLASS_CODE: p.LAND_COVER_CLASS_CODE,
        DESCRIPTION: p.LAND_COVER_CLASS_DESCRIPTION,
        AREA_HA: String(p.GEOM_AREA_SQM / 10000),
        SHAPE_AREA: p.GEOM_AREA_SQM,
        VALID_FROM: p.VALID_FROM,
        VALID_TO: p.VALID_TO,
        SBI: sbi
      }
    }
  })
  const areaSqm = version.features.reduce((total, f) => total + f.properties.GEOM_AREA_SQM, 0)
  const outline = features.length > 1
    ? union({ type: 'FeatureCollection', features }).geometry
    : features[0].geometry
  return {
    type: 'FeatureCollection',
    features,
    parcel: {
      type: 'Feature',
      geometry: outline,
      properties: {
        ID: String(version.features[0].properties.REFERENCE_PARCELS_ID),
        SHEET_ID: sheetId,
        PARCEL_ID: parcelId,
        VALID_FROM: version.validFrom,
        VALID_TO: version.validTo,
        AREA_HA: String(areaSqm / 10000),
        SBI: sbi,
        SHAPE_AREA: areaSqm
      }
    },
    hedgesUnavailable: true
  }
}

function displayDate (yyyymmdd) {
  const day = Number(yyyymmdd.slice(6, 8))
  const month = MONTHS[Number(yyyymmdd.slice(4, 6)) - 1]
  return `${day} ${month} ${yyyymmdd.slice(0, 4)}`
}

function fileName (ngc, validFrom) {
  return `${ngc}-${validFrom}.json`
}

function buildManifest (selected, { sbi, stamp }) {
  const history = {}
  const dateVersions = {}
  selected.forEach((list, ngc) => {
    const previous = list.filter(v => v.validTo !== CURRENT).reverse()
    const url = (v) => `${OUTPUT_URL}${fileName(ngc, v.validFrom)}?v=${stamp}`
    history[ngc] = {
      beforeFile: url(previous[0]),
      dateLabel: `${displayDate(previous[0].validFrom)} to ${displayDate(previous[0].validTo)}`
    }
    dateVersions[ngc] = [{ file: null }, ...previous.slice(1).map(v => ({ file: url(v) }))]
  })
  return { sbi, generatedAt: stamp, history, dateVersions }
}

module.exports = {
  CURRENT,
  parseVersionName,
  selectVersions,
  registrationOffset,
  toSnapshotFile,
  buildManifest,
  fileName
}
