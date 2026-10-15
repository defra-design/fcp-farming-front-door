// Land data panel (mapping pattern library: /patterns/mapping/data-panel).
// Fills in the markup from _common/map/land-data-panel.html. It doesn't touch the map: the
// page calls select()/clear() from its own map selection handling.
//
//   AppMap.landDataPanel.init({ parcelUrl })     parcelUrl(ngc) -> the parcel page link
//   AppMap.landDataPanel.render(parcels, covers) RPA LandParcels + LandCovers FeatureCollections
//   AppMap.landDataPanel.renderError()
//   AppMap.landDataPanel.select(ngc) / .clear()
//
// ngc is a parcel's SHEET_ID + PARCEL_ID (e.g. "SX39647821").
window.AppMap = window.AppMap || {}

;(function () {
  const SELECTED_CLASS = 'app-data-panel__row--selected'
  let options = { parcelUrl: (ngc) => '#' }
  let filterInput = null
  let filterStatus = null

  const el = (id) => document.getElementById(id)
  const rows = () => Array.from(document.querySelectorAll('#parcel-table-body tr'))
  const ngcOf = (props) => props.ngc || (props.SHEET_ID + props.PARCEL_ID)

  function normaliseTerm (s) {
    return (s || '').toUpperCase().replace(/\s+/g, '')
  }

  // Narrows the list (not the map) by parcel ID substring
  function filter (term) {
    const needle = normaliseTerm(term)
    const all = rows()
    let visible = 0
    all.forEach(tr => {
      if (!tr.dataset.ngc) return
      const match = needle === '' || tr.dataset.ngc.toUpperCase().includes(needle)
      tr.hidden = !match
      if (match) visible++
    })
    filterStatus.textContent = (all.length && visible === 0)
      ? 'No parcels found'
      : ''
  }

  function init (opts) {
    options = { ...options, ...opts }
    filterInput = el('parcel-filter')
    filterStatus = el('parcel-filter-status')
    filterInput.addEventListener('input', e => filter(e.target.value))
  }

  function render (parcelsData, landCoversData) {
    const features = parcelsData.features || []

    // Every land cover per parcel, keyed on ngc. Repeated cover types (same DESCRIPTION) are
    // merged and their areas summed, so each parcel maps to { description: totalArea }.
    const parcelCovers = {}
    if (landCoversData && landCoversData.features) {
      landCoversData.features.forEach(f => {
        const key = ngcOf(f.properties)
        const area = parseFloat(f.properties.AREA_HA || 0)
        const byDesc = parcelCovers[key] || (parcelCovers[key] = {})
        byDesc[f.properties.DESCRIPTION] = (byDesc[f.properties.DESCRIPTION] || 0) + area
      })
    }

    // Summary
    const totalArea = features.reduce((sum, f) => sum + parseFloat(f.properties.AREA_HA || 0), 0)
    el('summary-parcel-count').textContent = features.length
    el('summary-total-area').textContent = totalArea.toFixed(4)

    const tableBody = el('parcel-table-body')
    tableBody.innerHTML = ''

    if (features.length === 0) {
      const tr = document.createElement('tr')
      tr.className = 'govuk-table__row'
      tr.innerHTML = '<td class="govuk-table__cell" colspan="3">No land parcels found.</td>'
      tableBody.appendChild(tr)
    }

    // Build all rows as one HTML string and insert in a single pass (one reflow) rather than
    // appendChild per row. data-ngc drives the filter and selection.
    const rowsHtml = features.map(f => {
      const { SHEET_ID, PARCEL_ID, AREA_HA } = f.properties
      const ngc = ngcOf(f.properties)
      // All cover descriptions for this parcel, largest area first.
      const covers = Object.entries(parcelCovers[ngc] || {})
        .sort((a, b) => b[1] - a[1])
        .map(([description]) => description)
      const coversHtml = covers.length
        ? `<ul class="govuk-list govuk-!-margin-bottom-0">${covers.map(d => `<li>${d}</li>`).join('')}</ul>`
        : '–'
      const area = parseFloat(AREA_HA)
      return `<tr class="govuk-table__row" data-ngc="${ngc}">
        <td class="govuk-table__cell" style="white-space:nowrap"><a class="govuk-link" href="${options.parcelUrl(ngc)}">${SHEET_ID} ${PARCEL_ID}</a></td>
        <td class="govuk-table__cell">${coversHtml}</td>
        <td class="govuk-table__cell govuk-table__cell--numeric" style="white-space:nowrap" data-sort-value="${area}">${area.toFixed(4)}</td>
      </tr>`
    })
    tableBody.insertAdjacentHTML('beforeend', rowsHtml.join(''))

    // Initial filter pass populates the status line
    filter(filterInput.value)
  }

  function renderError () {
    el('summary-parcel-count').textContent = '–'
    el('summary-total-area').textContent = '–'
  }

  // Highlight a parcel's row and copy it into the selected-parcel table.
  function select (ngc) {
    const all = rows()
    // If the selected parcel's row is hidden by the active filter, clear the filter to show it.
    if (all.some(tr => tr.dataset.ngc === ngc && tr.hidden) && filterInput.value) {
      filterInput.value = ''
      filter('')
    }
    all.forEach(tr => tr.classList.toggle(SELECTED_CLASS, tr.dataset.ngc === ngc))

    const row = all.find(tr => tr.dataset.ngc === ngc)
    const panel = el('selected-parcel-panel')
    if (row) {
      const anchor = row.querySelector('a')
      const cells = row.querySelectorAll('td')
      el('selected-parcel-link').href = anchor ? anchor.getAttribute('href') : '#'
      el('selected-parcel-link').textContent = anchor ? anchor.textContent : ''
      // Copy the cover cell's markup (a govuk-list of all covers) so the panel mirrors the row.
      el('selected-parcel-cover').innerHTML = cells[1] ? cells[1].innerHTML : ''
      el('selected-parcel-area').textContent = cells[2] ? cells[2].textContent.trim() : ''
      panel.hidden = false
    } else if (panel) {
      panel.hidden = true
    }
  }

  function clear () {
    rows().forEach(tr => tr.classList.remove(SELECTED_CLASS))
    const panel = el('selected-parcel-panel')
    if (panel) panel.hidden = true
  }

  window.AppMap.landDataPanel = { init, render, renderError, select, clear, filter }
})()
