// Full-screen map layout behaviour (mapping pattern library: /patterns/mapping/full-screen-layout).
// Loaded by layouts/map-fullscreen.html after the DEFRA interactive-map scripts.
//
//   AppMap.fullscreen.isMobile()               true at ≤640px (the map is a "Map view" button)
//   AppMap.fullscreen.init({ interactiveMap }) wire an InteractiveMap into the layout
//   AppMap.fullscreen.hideLoading()            fade out the #map-loading overlay
window.AppMap = window.AppMap || {}

;(function () {
  const MOBILE_QUERY = '(max-width: 640px)'
  const mobileMql = window.matchMedia(MOBILE_QUERY)

  // Reveal the page immediately rather than waiting for the DEFRA library to remove its
  // `.im-is-loading { visibility:hidden }` body hide on map mount. The #map-loading overlay
  // covers the map area, so the sidebar can show straight away and we don't depend on map
  // timing to un-blank the page.
  document.body.classList.remove('im-is-loading')

  // A page decides at load whether it's on mobile (e.g. whether to build the interact plugin),
  // so crossing the 640px breakpoint live (e.g. toggling DevTools device mode) leaves the map
  // built for the previous viewport. Reload on a breakpoint cross to re-sync. (No-op for real
  // users, whose viewport doesn't cross 640px mid-session.)
  mobileMql.addEventListener('change', () => window.location.reload())

  function isMobile () {
    return mobileMql.matches
  }

  // Fade out the "Loading map" overlay. Call once the map is framed on its data and the tiles
  // have rendered (or on a fetch error), so the overlay is never left stuck on screen.
  function hideLoading () {
    const el = document.getElementById('map-loading')
    if (el) el.classList.add('app-map-loading--hidden')
  }

  // Move DEFRA's "Map view" button (rendered on mobile) into the sidebar's #map-button-slot.
  function moveMapButton () {
    const btn = document.querySelector('.im-c-open-map-button')
    const slot = document.getElementById('map-button-slot')
    if (btn && slot && !slot.contains(btn)) {
      slot.appendChild(btn)
      return true
    }
    return false
  }

  function init ({ interactiveMap }) {
    // The InteractiveMap has no public accessor for the MapLibre map; it arrives on map:ready.
    let map = null
    interactiveMap.on('map:ready', (e) => { map = e.map })

    // Try immediately, then observe for late insertion
    if (!moveMapButton()) {
      const observer = new MutationObserver(() => {
        if (moveMapButton()) observer.disconnect()
      })
      observer.observe(document.getElementById('main-content'), { childList: true, subtree: true })
    }

    // Keep the map sized correctly when the viewport resizes
    window.addEventListener('resize', () => {
      if (map) map.resize()
    })
  }

  window.AppMap.fullscreen = { init, isMobile, hideLoading }
})()
