const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { loadParcelHistory } = require('../../app/data/v18-1-3-parcel-history')

const EMPTY = { history: {}, dateVersions: {} }

function writeManifest (contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parcel-history-'))
  const file = path.join(dir, 'manifest.json')
  fs.writeFileSync(file, JSON.stringify(contents))
  return file
}

test('a missing manifest gives no history and does not throw', () => {
  assert.deepEqual(loadParcelHistory('112965195', '/no/such/manifest.json'), EMPTY)
})

test('a manifest for another SBI gives no history', () => {
  const file = writeManifest({ sbi: '112965195', history: { AA00001234: {} }, dateVersions: { AA00001234: [] } })
  assert.deepEqual(loadParcelHistory('106332870', file), EMPTY)
})

test('a matching manifest gives its history and date versions', () => {
  const history = { AA00001234: { beforeFile: '/a.json', dateLabel: 'x' } }
  const dateVersions = { AA00001234: [{ file: null }] }
  const file = writeManifest({ sbi: '112965195', generatedAt: 'abc', history, dateVersions })
  assert.deepEqual(loadParcelHistory('112965195', file), { history, dateVersions })
})

test('an unreadable manifest gives no history and does not throw', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parcel-history-'))
  const file = path.join(dir, 'manifest.json')
  fs.writeFileSync(file, '{ not json')
  assert.deepEqual(loadParcelHistory('112965195', file), EMPTY)
})
