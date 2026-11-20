// Help panel for map pages (v18/ur-1 view-land and view-land-parcel).
//
// A link with [data-help-panel] in the map sidebar opens its href (a standalone help page)
// inside the sidebar instead of navigating. While the help is open the sidebar widens to half
// the screen (at least 640px) so the help gets its full layout, and the map shrinks beside it
// with all its controls still visible. Without JavaScript the link just opens the help page.
//
// The help is an <iframe> of the help page with ?embed, so its own CSS can't leak into the
// prototype. The iframe is sized to its content (same origin, so its height is readable),
// which leaves one scroller: on desktop the help panel itself, pinned full height to the top
// left of the viewport over the page header; on mobile the page. The embedded page
// posts 'help:close' (Escape) and 'help:scroll' (its contents links) back to this script.
//
// Optional data attributes on the link: data-help-title (the iframe's accessible title).
;(function () {
  const trigger = document.querySelector('[data-help-panel]')
  if (!trigger) return
  const sidebar = trigger.closest('.app-map-fullscreen__sidebar')
  if (!sidebar) return

  const root = document.documentElement
  const href = trigger.getAttribute('href')
  const src = href + (href.indexOf('?') === -1 ? '?' : '&') + 'embed'
  const HIDDEN = 'app-help-hidden'

  const style = document.createElement('style')
  style.textContent = `
    .${HIDDEN} { display: none !important; }
    html.app-help-open .app-map-fullscreen__sidebar { padding: 0; }
    @media (min-width: 641px) {
      html.app-help-open .app-map-fullscreen__sidebar {
        flex: 0 0 50%;
        max-width: none;
        width: 50%;
        min-width: 640px;
      }
    }
    /* Close help sits over the top right of the help, on the same line as its h1 (the embedded
       help page starts 8px down with a 40px / 44px-line h1, 32px / 35px-line under 601px). */
    .app-help-panel { position: relative; }
    .app-help-panel__bar { position: absolute; top: 8px; right: 16px; height: 44px; display: flex; align-items: center; z-index: 1; }
    @media (max-width: 600px) { .app-help-panel__bar { height: 35px; } }
    .app-help-panel__close { font-size: 19px; }
    .app-help-panel__frame { display: block; width: 100%; height: 80vh; border: 0; }
    /* Desktop/laptop: the help is pinned to the top left of the viewport, full height and
       over the page header, at the same width as the widened sidebar beneath it (so the map
       keeps the right-hand half). It scrolls on its own. */
    @media (min-width: 641px) {
      .app-help-panel {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 50%;
        min-width: 640px;
        box-sizing: border-box;
        overflow-y: auto;
        overscroll-behavior: contain;
        background: #ffffff;
        border-right: 1px solid #b1b4b6;
        z-index: 1000;
      }
    }
  `
  document.head.appendChild(style)

  const live = document.createElement('div')
  live.className = 'govuk-visually-hidden'
  live.setAttribute('aria-live', 'polite')
  document.body.appendChild(live)

  let panel = null
  let iframe = null
  let closeLink = null
  let saved = null   // { scrollTop, hiddenEls } while the help is open
  let resizeObs = null

  // What scrolls. With the help open on desktop, the pinned help panel; otherwise the sidebar
  // on desktop, or the page on mobile (where the sidebar is overflow:visible).
  function scroller () {
    if (isOpen() && getComputedStyle(panel).position === 'fixed') return panel
    return getComputedStyle(sidebar).overflowY === 'visible' ? document.scrollingElement : sidebar
  }
  const isOpen = () => !!saved

  function fitFrame () {
    const doc = iframe.contentDocument
    if (!doc || !doc.body) return
    iframe.style.height = Math.ceil(doc.body.getBoundingClientRect().height) + 'px'
  }

  function build () {
    panel = document.createElement('div')
    panel.className = 'app-help-panel ' + HIDDEN
    panel.innerHTML = '<div class="app-help-panel__bar"><a href="#" class="govuk-link govuk-link--no-visited-state app-help-panel__close">Close help</a></div>'
    closeLink = panel.querySelector('a')
    closeLink.addEventListener('click', (e) => { e.preventDefault(); close() })

    iframe = document.createElement('iframe')
    iframe.className = 'app-help-panel__frame'
    iframe.title = trigger.dataset.helpTitle || 'Help'
    iframe.addEventListener('load', () => {
      fitFrame()
      if (resizeObs) resizeObs.disconnect()
      const doc = iframe.contentDocument
      if (doc && doc.body && window.ResizeObserver) {
        resizeObs = new ResizeObserver(fitFrame)
        resizeObs.observe(doc.body)
      }
    })
    iframe.src = src
    panel.appendChild(iframe)
    sidebar.appendChild(panel)
  }

  // Let the map catch up with its new width (MapLibre also watches its container).
  function relayout () {
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
  }

  function open () {
    if (isOpen()) { closeLink.focus(); return }
    if (!panel) build()
    const s = scroller()
    const hiddenEls = Array.from(sidebar.children).filter(el => el !== panel && !el.classList.contains(HIDDEN))
    saved = { scrollTop: s.scrollTop, hiddenEls }
    hiddenEls.forEach(el => el.classList.add(HIDDEN))
    panel.classList.remove(HIDDEN)
    root.classList.add('app-help-open')
    s.scrollTop = 0
    panel.scrollTop = 0
    relayout()
    closeLink.focus()
    live.textContent = 'Help opened'
  }

  function close () {
    if (!isOpen()) return
    panel.classList.add(HIDDEN)
    saved.hiddenEls.forEach(el => el.classList.remove(HIDDEN))
    root.classList.remove('app-help-open')
    relayout()
    const top = saved.scrollTop
    saved = null
    requestAnimationFrame(() => { scroller().scrollTop = top })
    trigger.focus({ preventScroll: true })
    live.textContent = 'Help closed'
  }

  // Scroll the sidebar (or page) so a point inside the help is near the top.
  function scrollToHelp (topInFrame) {
    const s = scroller()
    const base = s === document.scrollingElement ? 0 : s.getBoundingClientRect().top
    const frameTop = iframe.getBoundingClientRect().top - base + s.scrollTop
    s.scrollTo({ top: Math.max(0, frameTop + topInFrame - 8) })
  }

  trigger.addEventListener('click', (e) => { e.preventDefault(); open() })

  // Escape closes the help, but only while focus is in the sidebar — Escape on the map
  // belongs to the map (e.g. cancelling a measurement).
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen() && sidebar.contains(document.activeElement)) close()
  })

  window.addEventListener('message', (e) => {
    if (!iframe || e.origin !== location.origin || e.source !== iframe.contentWindow) return
    const data = e.data || {}
    if (data.type === 'help:close') close()
    else if (data.type === 'help:scroll' && typeof data.top === 'number') scrollToHelp(data.top)
  })
})()
