// Builds the local parcel history files for v18/1.3 from the RPA snapshot:
//   node scripts/parcel-snapshot/generate.js --outputs <dir> --adjacent <dir>
// Only parcels the API lists under the SBI are converted, so neighbours' data is never written.
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
  fileName
} = require('./convert')

const SBI = '112965195'
const OUTPUT_DIR = path.join(__dirname, '../../app/assets/data/snapshot-112965195')
const MAX_OUTLINE_DIFFERENCE = 0.005

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

async function main () {
  const [parcels, covers] = await Promise.all([fetchLayer('LandParcels'), fetchLayer('LandCovers')])
  const selected = selectVersions(
    readVersions([argument('--outputs'), argument('--adjacent')]),
    new Set(parcels.map(refOf))
  )

  const stamp = new Date().toISOString().slice(0, 19).replace(/\D/g, '')
  const files = []
  const report = []
  selected.forEach((list, ngc) => {
    const current = list[list.length - 1]
    const offset = registrationOffset(current.features, covers.filter(f => refOf(f) === ngc))
    list.filter(v => v.validTo !== CURRENT).forEach(version => {
      const file = toSnapshotFile(version, { sbi: SBI, offset })
      const difference = Math.abs(area(file.parcel.geometry) - file.parcel.properties.SHAPE_AREA) / file.parcel.properties.SHAPE_AREA
      if (difference > MAX_OUTLINE_DIFFERENCE) {
        throw new Error(`${ngc} ${version.validFrom}: outline area differs from its land covers by ${(difference * 100).toFixed(2)}%`)
      }
      files.push({ name: fileName(ngc, version.validFrom), file })
    })
    report.push({
      parcel: ngc,
      previousVersions: list.length - 1,
      northMetres: Number((offset.dLat * 111320).toFixed(2))
    })
  })

  // Write only once everything has converted, replacing any earlier output.
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json')).forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)))
  files.forEach(({ name, file }) => fs.writeFileSync(path.join(OUTPUT_DIR, name), JSON.stringify(file)))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(buildManifest(selected, { sbi: SBI, stamp }), null, 2))

  console.table(report)
  console.log(`${selected.size} parcels, ${files.length} previous versions written to ${OUTPUT_DIR}`)
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
