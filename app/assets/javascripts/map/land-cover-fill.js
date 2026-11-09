// Land cover fill mode for the v18/1.3.1 map pages: solid colour fills (the default) or
// pattern fills, where a coloured pattern on a transparent background shows the base map
// through each land cover (as in https://defra.github.io/interactive-map/examples/add-polygons).
//
// ?fill=pattern turns pattern fills on and ?fill=solid turns them off. The choice is kept in
// sessionStorage, so it follows the user from page to page without the query string.
//
// Usage:
//   AppMap.landCoverFill.isPattern            -> true in pattern mode
//   AppMap.landCoverFill.patternColour(type)  -> the pattern colour, keyed by base map style id
//   AppMap.landCoverFill.patternStyle(type, colour, { previous }) -> dataset style for a type

window.AppMap = window.AppMap || {}

window.AppMap.landCoverFill = (function () {
  const STORAGE_KEY = 'v18-131-land-cover-fill'

  function resolveMode () {
    const fromUrl = new URLSearchParams(window.location.search).get('fill')
    if (fromUrl === 'pattern' || fromUrl === 'solid') {
      try { sessionStorage.setItem(STORAGE_KEY, fromUrl) } catch (e) { /* private mode */ }
      return fromUrl
    }
    try { return sessionStorage.getItem(STORAGE_KEY) === 'pattern' ? 'pattern' : 'solid' } catch (e) { return 'solid' }
  }

  // The pattern and colours for each common land cover. Names are the RPA DESCRIPTION values.
  // Each has two colours, because a thin line that shows on one base map vanishes on another:
  // `satellite` is bright, to show over dark aerial imagery, and `light` is dark, for the
  // Outdoor and Light maps. The map picks the colour for the base map on screen.
  // Built-in patterns: cross-hatch, diagonal-cross-hatch, forward-diagonal-hatch,
  // backward-diagonal-hatch, horizontal-hatch, vertical-hatch, dot, diamond.
  const PATTERN_STYLES = {
    'Arable Land': { pattern: 'horizontal-hatch', satellite: '#ffdd00', light: '#8a6d00' },
    'Permanent Grassland': { pattern: 'vertical-hatch', satellite: '#8cf26b', light: '#00703c' },
    'Temporary Grass': { pattern: 'forward-diagonal-hatch', satellite: '#d9f27a', light: '#4f7a28' },
    'Land Lying Fallow': { pattern: 'backward-diagonal-hatch', satellite: '#f2c98a', light: '#7a5c2e' },
    'Permanent Crops': { pattern: 'diamond', satellite: '#eaa8ff', light: '#7b2d8e' },
    'Woodland': { pattern: 'dot', satellite: '#ffffff', light: '#1e5020' },
    'Scrub - Ungrazeable': { pattern: 'diamond', satellite: '#ffa070', light: '#a2421b' },
    'Farm Building': { pattern: 'cross-hatch', satellite: '#c9b8ff', light: '#4c2c92' },
    'Farmyards': { pattern: 'diagonal-cross-hatch', satellite: '#e8d4b0', light: '#5f4b3a' },
    'Hard Standings': { pattern: 'diagonal-cross-hatch', satellite: '#e0e0e0', light: '#505a5f' },
    'Residential dwelling, House': { pattern: 'cross-hatch', satellite: '#ff7b6b', light: '#b3261e' },
    'Residential Gardens': { pattern: 'dot', satellite: '#b4f07a', light: '#4f8a10' },
    'Drain/Ditch/Dyke': { pattern: 'horizontal-hatch', satellite: '#5ecbff', light: '#1d70b8' },
    'Rivers and streams type 2': { pattern: 'horizontal-hatch', satellite: '#9fdcff', light: '#12436d' },
    'Rivers and streams type 3': { pattern: 'forward-diagonal-hatch', satellite: '#9fdcff', light: '#12436d' },
    'Pond': { pattern: 'dot', satellite: '#5ecbff', light: '#1d70b8' },
    'Roads': { pattern: 'backward-diagonal-hatch', satellite: '#ffffff', light: '#0b0c0c' },
    'Metalled track': { pattern: 'forward-diagonal-hatch', satellite: '#d0d0d0', light: '#383f43' },
    'Track - Natural Surface': { pattern: 'dot', satellite: '#ffc266', light: '#8a5a00' }
  }

  // Other land covers get a pattern picked from their name (so it is the same on every page
  // and every load), their LSM colour on Satellite and that colour darkened on the light maps.
  const FALLBACK_PATTERNS = ['forward-diagonal-hatch', 'backward-diagonal-hatch', 'horizontal-hatch',
    'vertical-hatch', 'cross-hatch', 'diagonal-cross-hatch', 'dot', 'diamond']

  function hashName (name) {
    let h = 0
    for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0
    return h
  }

  function darken (hex, amount) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
    if (!m) return '#505a5f'
    const n = parseInt(m[1], 16)
    const ch = (shift) => Math.round(((n >> shift) & 255) * (1 - amount)).toString(16).padStart(2, '0')
    return '#' + ch(16) + ch(8) + ch(0)
  }

  function lsmColour (type) {
    const entry = (window.AppMap.LSM_LAND_COVERS || []).find(c => c.name === type)
    return entry ? entry.colour : null
  }

  function patternFor (type) {
    if (PATTERN_STYLES[type]) return PATTERN_STYLES[type]
    const lsm = lsmColour(type) || '#b1b4b6'
    return {
      pattern: FALLBACK_PATTERNS[hashName(type) % FALLBACK_PATTERNS.length],
      satellite: lsm,
      light: darken(lsm, 0.5)
    }
  }

  // A colour keyed by base map style id (the ids in the pages' mapStylesPlugin config), which
  // the map resolves for whichever base map is on screen.
  function patternColour (type) {
    const p = patternFor(type)
    return { satellite: p.satellite, outdoor: p.light, positron: p.light }
  }

  // The previous (earlier date) version on the compare page draws the same patterns faded.
  // The map names each pattern image by its pattern and colours, and two datasets with the
  // same pattern style race to add the same image (one error per pattern in the console).
  // A different spelling of a transparent background gives the previous version its own
  // images without changing how they look.
  function patternStyle (type, colour, { previous = false } = {}) {
    return {
      fill: 'transparent',
      stroke: colour,
      strokeWidth: 2,
      fillPattern: patternFor(type).pattern,
      fillPatternForegroundColor: colour,
      fillPatternBackgroundColor: previous ? 'rgba(0,0,0,0)' : 'transparent'
    }
  }

  const mode = resolveMode()

  return {
    mode,
    isPattern: mode === 'pattern',
    patternFor,
    patternColour,
    patternStyle
  }
})()
