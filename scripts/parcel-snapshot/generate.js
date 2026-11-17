// Builds the local parcel history files for v18/1.3 from the RPA snapshot:
//   node scripts/parcel-snapshot/generate.js --outputs <dir> --adjacent <dir>
// Only parcels the API lists under the SBI are converted, so neighbours' data is never written.
// Every version is read for working out splits and merges, but other parcels appear in the output
// only as a reference, an area and flags. The one exception is the renumbered predecessor below.
// The output folder is committed: the data provider cleared the data for publication.

const fs = require('node:fs')
const path = require('node:path')
const { area } = require('@turf/area')
const {
  CURRENT,
  parseVersionName,
  selectVersions,
  registrationOffset,
  toSnapshotFile,
  buildManifest,
  fileName,
  OUTPUT_URL
} = require('./convert')
const { findLineage, makeSymmetric, toLineageFile, lineageSummary } = require('./lineage')

const SBI = '112965195'
const OUTPUT_DIR = path.join(__dirname, '../../app/assets/data/snapshot-112965195')
const MAX_OUTLINE_DIFFERENCE = 0.005
// Earlier references whose versions the designer approved for writing out.
const APPROVED_EARLIER_REFS = new Set(['SK40626719'])

function argument (name) {
  const i = process.argv.indexOf(name)
  if (i === -1 || !process.argv[i + 1]) throw new Error(`Missing ${name} <dir>`)
  return process.argv[i + 1]
}

async function fetchLayer (layer) {
  const url = `https://environment.data.gov.uk/data-services/RPA/${layer}/wfs?version=2.0.0&request=GetFeature` +
    `&typeNames=RPA:${layer}&cql_filter=${encodeURIComponent('SBI=' + SBI)}&srsname=EPSG:4326&outputFormat=application/json`
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) throw new Error(`${layer} returned ${response.status}`)
  return (await response.json()).features
}

function readVersions (dirs) {
  const versions = new Map()
  dirs.forEach(dir => {
    fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
      const name = f.replace(/\.json$/, '')
      if (versions.has(name)) return
      const { features } = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
      versions.set(name, { ...parseVersionName(name), features })
    })
  })
  return [...versions.values()]
}

const refOf = (f) => f.properties.SHEET_ID + f.properties.PARCEL_ID

function checkOutline (file, label) {
  const difference = Math.abs(area(file.parcel.geometry) - file.parcel.properties.SHAPE_AREA) / file.parcel.properties.SHAPE_AREA
  if (difference > MAX_OUTLINE_DIFFERENCE) {
    throw new Error(`${label}: outline area differs from its land covers by ${(difference * 100).toFixed(2)}%`)
  }
}

async function main () {
  const [parcels, covers] = await Promise.all([fetchLayer('LandParcels'), fetchLayer('LandCovers')])
  const liveRefs = new Set(parcels.map(refOf))
  const versions = readVersions([argument('--outputs'), argument('--adjacent')])
  const selected = selectVersions(versions, liveRefs)

  const stamp = new Date().toISOString().slice(0, 19).replace(/\D/g, '')
  const url = (name) => `${OUTPUT_URL}${name}?v=${stamp}`
  const files = []
  const earlierFiles = []
  const report = []
  const offsets = new Map()
  const found = {}
  selected.forEach((list, ngc) => {
    const current = list[list.length - 1]
    const offset = registrationOffset(current.features, covers.filter(f => refOf(f) === ngc))
    offsets.set(ngc, offset)
    list.filter(v => v.validTo !== CURRENT).forEach(version => {
      const file = toSnapshotFile(version, { sbi: SBI, offset })
      checkOutline(file, `${ngc} ${version.validFrom}`)
      files.push({ name: fileName(ngc, version.validFrom), file })
    })
    found[ngc] = findLineage(ngc, versions, { liveRefs })
  })

  const lineageByNgc = makeSymmetric(found)
  const lineage = {}
  selected.forEach((list, ngc) => {
    const l = lineageByNgc[ngc]
    const offset = offsets.get(ngc)
    let file = null
    if (l.pieces.length > 0) {
      const name = `lineage-${ngc}.json`
      files.push({ name, file: toLineageFile(l, { offset }) })
      file = url(name)
    }
    const earlierVersions = l.earlierVersions.slice().reverse().map(version => {
      if (!APPROVED_EARLIER_REFS.has(version.ngc)) {
        throw new Error(`${ngc}: earlier reference ${version.ngc} is not approved for writing out`)
      }
      const converted = toSnapshotFile(version, { sbi: SBI, offset, asNgc: ngc })
      checkOutline(converted, `${ngc} (was ${version.ngc}) ${version.validFrom}`)
      const name = fileName(ngc, version.validFrom)
      earlierFiles.push({ name, file: converted })
      return { file: url(name), ref: version.ngc, validFrom: version.validFrom, validTo: version.validTo }
    })
    lineage[ngc] = { file, ...lineageSummary(l), earlierVersions }
    report.push({
      parcel: ngc,
      previousVersions: list.length - 1,
      groups: l.groups.length,
      northMetres: Number((offset.dLat * 111320).toFixed(2))
    })
  })

  // Write only once everything has converted, replacing any earlier output.
  const written = [...files, ...earlierFiles]
  const names = written.map(f => f.name)
  if (new Set(names).size !== names.length) throw new Error('Two output files have the same name')
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json')).forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)))
  written.forEach(({ name, file }) => fs.writeFileSync(path.join(OUTPUT_DIR, name), JSON.stringify(file)))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(buildManifest(selected, { sbi: SBI, stamp, lineage }), null, 2))

  const lineageFiles = files.filter(f => f.name.startsWith('lineage-')).length
  console.table(report)
  console.log(`${selected.size} parcels, ${files.length - lineageFiles} previous versions written to ${OUTPUT_DIR}`)
  console.log(`${earlierFiles.length} earlier version(s) of renumbered parcels, ${lineageFiles} lineage files`)
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
