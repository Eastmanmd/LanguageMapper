import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const SOURCE = 'atlas-languages'
const LAYER = 'atlas-languages-dots'
const BORDER_SOURCE = 'atlas-borders'
const BORDER_LAYER = 'atlas-border-selected'
const SPOKEN_LAYER = 'atlas-countries-spoken'
// Positron is a quiet greyscale basemap, so the coloured dots carry the map.
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

const LEGEND_CLEARANCE = 292
const MIN_WIDTH_BESIDE_LEGEND = 700

const VIEWS = {
  africa: [
    [-19, -35.5],
    [52, 37.5],
  ],
}

// Feature properties set by the page: `color`, `emph` (0 faded, 1 normal,
// 2 selected) and `label` (the group shown in the hover tooltip).
function radiusExpr() {
  return [
    'interpolate', ['linear'], ['zoom'],
    2, ['match', ['get', 'emph'], 2, 7, 1, 3, 1.8],
    6, ['match', ['get', 'emph'], 2, 10, 1, 5.5, 3],
    10, ['match', ['get', 'emph'], 2, 14, 1, 9, 5],
  ]
}

// Country outlines load the first time someone picks a country or colours them.
let bordersPromise = null
function loadBorders() {
  bordersPromise ??= fetch(`${import.meta.env.BASE_URL}data/africa/borders.geojson`).then((res) => res.json())
  return bordersPromise
}

const borderFilter = (country) => ['==', ['get', 'c'], country ?? '']
const spokenFilter = (spokenIn) => ['in', ['get', 'c'], ['literal', spokenIn?.countries ?? []]]

// The selected country's outline, drawn under the dots so they stay clickable,
// and the tint on countries where a language or family is spoken, drawn under
// the place names so they stay readable.
function addBorderLayers(map, borders, country, spokenIn, dark) {
  if (!borders || !map.getLayer(LAYER)) return
  if (!map.getSource(BORDER_SOURCE)) map.addSource(BORDER_SOURCE, { type: 'geojson', data: borders })
  if (!map.getLayer(SPOKEN_LAYER)) {
    map.addLayer(
      {
        id: SPOKEN_LAYER,
        type: 'fill',
        source: BORDER_SOURCE,
        filter: spokenFilter(spokenIn),
        paint: { 'fill-color': spokenIn?.color ?? '#000000', 'fill-opacity': 0.4 },
      },
      map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id ?? LAYER,
    )
  }
  if (map.getLayer(BORDER_LAYER)) return
  map.addLayer(
    {
      id: BORDER_LAYER,
      type: 'line',
      source: BORDER_SOURCE,
      filter: borderFilter(country),
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': dark ? '#ffffff' : '#242e57',
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.75, 7, 3.5],
      },
    },
    LAYER,
  )
}

function addLayers(map, data, dark) {
  if (!map.getSource(SOURCE)) map.addSource(SOURCE, { type: 'geojson', data })
  if (map.getLayer(LAYER)) return
  map.addLayer({
    id: LAYER,
    type: 'circle',
    source: SOURCE,
    layout: { 'circle-sort-key': ['get', 'emph'] },
    paint: {
      'circle-radius': radiusExpr(),
      'circle-color': ['get', 'color'],
      'circle-opacity': ['match', ['get', 'emph'], 0, 0.45, 1],
      // A surface-coloured ring keeps overlapping dots distinct; the selected
      // dot gets an ink ring instead.
      'circle-stroke-color': [
        'match', ['get', 'emph'], 2, dark ? '#ffffff' : '#0b0b0b', dark ? '#0a0a0a' : '#ffffff',
      ],
      'circle-stroke-width': ['match', ['get', 'emph'], 2, 2.5, 0, 0, 1],
    },
  })
}

export default function AtlasMap({ data, selectedId, onSelect, view, dark, country, spokenIn }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dataRef = useRef(data)
  const darkRef = useRef(dark)
  const countryRef = useRef(country)
  const spokenRef = useRef(spokenIn)
  const bordersRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const isFirstStyleRun = useRef(true)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    dataRef.current = data
    mapRef.current?.getSource(SOURCE)?.setData(data)
  }, [data])

  useEffect(() => {
    darkRef.current = dark
    if (isFirstStyleRun.current) {
      isFirstStyleRun.current = false
      return
    }
    const map = mapRef.current
    if (!map) return
    // A full reload, not a diff: updating the tint in the same render would fire
    // 'styledata' on the old style, and the diff would then drop the re-added layers.
    map.setStyle(dark ? DARK_STYLE : LIGHT_STYLE, { diff: false })
    map.once('style.load', () => {
      addLayers(map, dataRef.current, dark)
      addBorderLayers(map, bordersRef.current, countryRef.current, spokenRef.current, dark)
    })
  }, [dark])

  useEffect(() => {
    countryRef.current = country
    spokenRef.current = spokenIn
    const map = mapRef.current
    if (map?.getLayer(BORDER_LAYER)) map.setFilter(BORDER_LAYER, borderFilter(country))
    if (map?.getLayer(SPOKEN_LAYER)) {
      map.setFilter(SPOKEN_LAYER, spokenFilter(spokenIn))
      if (spokenIn) map.setPaintProperty(SPOKEN_LAYER, 'fill-color', spokenIn.color)
    }
    if ((country || spokenIn) && !bordersRef.current) {
      loadBorders()
        .then((borders) => {
          bordersRef.current = borders
          if (mapRef.current) {
            addBorderLayers(mapRef.current, borders, countryRef.current, spokenRef.current, darkRef.current)
          }
        })
        .catch(() => {})
    }
  }, [country, spokenIn])

  // Bring a newly selected language into view if it's off-screen.
  useEffect(() => {
    const map = mapRef.current
    const feature = dataRef.current.features.find((f) => f.properties.g === selectedId)
    if (!map || !feature) return
    const [lon, lat] = feature.geometry.coordinates
    if (!map.getBounds().contains([lon, lat])) map.easeTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), 5) })
  }, [selectedId])

  useEffect(() => {
    if (!view) return
    // The open legend is tall on the Countries tab, so wide maps frame beside it.
    const besideLegend = view.besideLegend && containerRef.current.clientWidth >= MIN_WIDTH_BESIDE_LEGEND
    const padding = besideLegend ? { top: 48, right: 48, bottom: 48, left: LEGEND_CLEARANCE } : 48
    mapRef.current?.fitBounds(view.bounds ?? VIEWS[view.name], { padding, maxZoom: 7 })
  }, [view])

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: darkRef.current ? DARK_STYLE : LIGHT_STYLE,
      bounds: VIEWS.africa,
      fitBoundsOptions: { padding: 16 },
      minZoom: 1.5,
      maxZoom: 11,
      maxBounds: [
        [-60, -50],
        [95, 55],
      ],
      renderWorldCopies: false,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })

    map.on('load', () => {
      addLayers(map, dataRef.current, darkRef.current)
      addBorderLayers(map, bordersRef.current, countryRef.current, spokenRef.current, darkRef.current)

      map.on('click', LAYER, (e) => {
        const feature = e.features?.[0]
        if (feature) onSelectRef.current(feature.properties.g)
      })
      map.on('mousemove', LAYER, (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        map.getCanvas().style.cursor = 'pointer'
        const el = document.createElement('div')
        el.className = 'text-xs'
        const strong = document.createElement('div')
        strong.className = 'font-medium text-gray-900'
        strong.textContent = feature.properties.name
        const sub = document.createElement('div')
        sub.className = 'text-gray-600'
        sub.textContent = feature.properties.label
        el.append(strong, sub)
        popup.setLngLat(feature.geometry.coordinates).setDOMContent(el).addTo(map)
      })
      map.on('mouseleave', LAYER, () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
