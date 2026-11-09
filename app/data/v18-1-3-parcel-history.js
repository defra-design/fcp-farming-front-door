// The parcels with snapshot history on v18/1.3. The manifest comes from
// scripts/parcel-snapshot/generate.js and is gitignored until the data is cleared for
// publication, so a copy without it, or another SBI, gets no history: every parcel then uses
// the API-only page. Read on each request, so regenerating needs no restart.

const fs = require('node:fs')
const path = require('node:path')

const MANIFEST = path.join(__dirname, '../assets/data/snapshot-112965195/manifest.json')

function loadParcelHistory (sbi, manifestPath = MANIFEST) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (manifest.sbi === sbi) {
      return { history: manifest.history, dateVersions: manifest.dateVersions }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Could not read the parcel history manifest:', err.message)
  }
  return { history: {}, dateVersions: {} }
}

module.exports = { loadParcelHistory }
