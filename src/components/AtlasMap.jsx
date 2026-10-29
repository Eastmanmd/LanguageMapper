import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const SOURCE = 'atlas-languages'
const LAYER = 'atlas-languages-dots'
// Positron is a quiet greyscale basemap, so the coloured dots carry the map.
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

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

export default function AtlasMap({ data, selectedId, onSelect, view, dark }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dataRef = useRef(data)
  const darkRef = useRef(dark)
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
    map.setStyle(dark ? DARK_STYLE : LIGHT_STYLE)
    map.once('styledata', () => addLayers(map, dataRef.current, dark))
  }, [dark])

  // Bring a newly selected language into view if it's off-screen.
  useEffect(() => {
    const map = mapRef.current
    const feature = dataRef.current.features.find((f) => f.properties.g === selectedId)
    if (!map || !feature) return
    const [lon, lat] = feature.geometry.coordinates
    if (!map.getBounds().contains([lon, lat])) map.easeTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), 5) })
  }, [selectedId])

  useEffect(() => {
    if (view) mapRef.current?.fitBounds(view.bounds ?? VIEWS[view.name], { padding: 48, maxZoom: 7 })
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
