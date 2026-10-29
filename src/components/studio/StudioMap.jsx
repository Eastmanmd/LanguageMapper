import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const AFRICA = [
  [-19, -35.5],
  [52, 37.5],
]
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
const STREETS_STYLE = 'https://tiles.openfreemap.org/styles/positron'
// Public AWS Open Data terrain tiles; they allow cross-origin use, so maps with
// hillshade can still be exported as images.
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

// Sea, land and line colours for each base. Data layers sit on the land fill.
const BASES = {
  light: { sea: '#e6edf3', land: '#fbfbfa', line: '#c4c4c0', water: '#8fb8d8', ink: '#0b0b0b', halo: '#ffffff' },
  dark: { sea: '#0b0f14', land: '#1c1c1b', line: '#3d3d3a', water: '#2f5f80', ink: '#f0efec', halo: '#0b0b0b' },
  terrain: { sea: '#dbe6ef', land: '#f3efe6', line: '#b9b2a6', water: '#6f9fc5', ink: '#1a1a19', halo: '#ffffff' },
  streets: { sea: null, land: null, line: '#9a9a96', water: '#8fb8d8', ink: '#0b0b0b', halo: '#ffffff' },
}

function baseStyle(base) {
  if (base === 'streets') return STREETS_STYLE
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {},
    layers: [{ id: 'sea', type: 'background', paint: { 'background-color': BASES[base].sea } }],
  }
}

const EMPTY = { type: 'FeatureCollection', features: [] }

// The last data object sent to each source, so unchanged layers (the 100 KB
// of rivers) aren't re-parsed on every render.
const applied = new WeakMap()

function setSource(map, id, data) {
  const sent = applied.get(map) ?? {}
  applied.set(map, sent)
  const source = map.getSource(id)
  if (!source) map.addSource(id, { type: 'geojson', data: data ?? EMPTY })
  else if (sent[id] !== data) source.setData(data ?? EMPTY)
  sent[id] = data
}

function addLayers(map, props) {
  const { base, main, overlays, dotsData, waterData, bordersData, labelsData, country } = props
  const colors = BASES[base]
  const visible = (on) => (on ? 'visible' : 'none')

  setSource(map, 'land', bordersData)
  setSource(map, 'main', main?.data)
  setSource(map, 'water', waterData)
  setSource(map, 'overlay-dots', dotsData)
  setSource(map, 'labels', labelsData)

  if (colors.land && !map.getLayer('land-fill')) {
    map.addLayer({ id: 'land-fill', type: 'fill', source: 'land', paint: { 'fill-color': colors.land } })
  }
  if (base === 'terrain' && !map.getSource('dem')) {
    map.addSource('dem', { type: 'raster-dem', tiles: [TERRAIN_TILES], encoding: 'terrarium', tileSize: 256, maxzoom: 12 })
    map.addLayer({
      id: 'hillshade',
      type: 'hillshade',
      source: 'dem',
      paint: {
        'hillshade-exaggeration': 0.6,
        'hillshade-shadow-color': '#5c4f40',
        'hillshade-highlight-color': '#ffffff',
        'hillshade-accent-color': '#8a7b68',
      },
    })
  }
  const dataOpacity = base === 'terrain' ? 0.62 : 0.88
  if (!map.getLayer('main-fill')) {
    map.addLayer({
      id: 'main-fill',
      type: 'fill',
      source: 'main',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': dataOpacity, 'fill-outline-color': 'rgba(0,0,0,0)' },
    })
    map.addLayer({
      id: 'lakes',
      type: 'fill',
      source: 'water',
      filter: ['==', ['get', 'kind'], 'lake'],
      paint: { 'fill-color': colors.water },
    })
    map.addLayer({
      id: 'rivers',
      type: 'line',
      source: 'water',
      filter: ['==', ['get', 'kind'], 'river'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': colors.water,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, ['-', 1.6, ['*', 0.15, ['get', 'rank']]], 7, ['-', 3.2, ['*', 0.25, ['get', 'rank']]]],
      },
    })
    map.addLayer({
      id: 'borders',
      type: 'line',
      source: 'land',
      paint: { 'line-color': colors.line, 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 7, 1.2] },
    })
    map.addLayer({
      id: 'country-highlight',
      type: 'line',
      source: 'land',
      filter: ['==', ['get', 'c'], country ?? ''],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': colors.ink, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.75, 7, 3.5] },
    })
    map.addLayer({
      id: 'main-circle',
      type: 'circle',
      source: 'main',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 1.8, 6, 4, 10, 7],
        'circle-stroke-color': colors.land ?? '#ffffff',
        'circle-stroke-width': 0.5,
      },
    })
    map.addLayer({
      id: 'overlay-dots',
      type: 'circle',
      source: 'overlay-dots',
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 1.1, 6, 2.5, 10, 4.5],
        'circle-opacity': 0.75,
      },
    })
    map.addLayer({
      id: 'labels',
      type: 'symbol',
      source: 'labels',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 6, 13],
        'text-max-width': 7,
      },
      paint: { 'text-color': colors.ink, 'text-halo-color': colors.halo, 'text-halo-width': 1.4 },
    })
  }
  map.setLayoutProperty('rivers', 'visibility', visible(overlays.water))
  map.setLayoutProperty('lakes', 'visibility', visible(overlays.water))
  map.setLayoutProperty('borders', 'visibility', visible(overlays.borders))
  map.setLayoutProperty('overlay-dots', 'visibility', visible(overlays.dots))
  map.setLayoutProperty('labels', 'visibility', visible(overlays.labels))
  map.setFilter('country-highlight', ['==', ['get', 'c'], country ?? ''])
}

/**
 * Map Studio's map. A plain style built from our own data (so exports stay
 * clean and need no third-party tiles), or OpenFreeMap streets, or terrain
 * hillshade, with the chosen layer and overlays on top.
 */
export default function StudioMap({ onReady, onViewChange, view, initialView, ...props }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const propsRef = useRef(props)
  const baseRef = useRef(props.base)
  const onViewChangeRef = useRef(onViewChange)

  useEffect(() => {
    onViewChangeRef.current = onViewChange
  }, [onViewChange])

  // Data or overlay changes: refresh sources and layer visibility in place.
  useEffect(() => {
    propsRef.current = props
    const map = mapRef.current
    if (!map || !map.getLayer('main-fill') || baseRef.current !== props.base) return
    addLayers(map, props)
  })

  // A different base means a different style; layers are re-added once it loads.
  useEffect(() => {
    const map = mapRef.current
    if (!map || baseRef.current === props.base) return
    baseRef.current = props.base
    // The 'style.load' handler set up below re-adds the layers.
    map.setStyle(baseStyle(props.base))
  }, [props.base])

  useEffect(() => {
    if (view?.bounds) mapRef.current?.fitBounds(view.bounds, { padding: view.padding ?? 32, maxZoom: 7 })
  }, [view])

  useEffect(() => {
    const initial = propsRef.current
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle(initial.base),
      // A saved view wins; otherwise the first fit request (or all of Africa).
      ...(initialView?.center
        ? { center: initialView.center, zoom: initialView.zoom }
        : { bounds: view?.bounds ?? AFRICA, fitBoundsOptions: { padding: view?.padding ?? 16, maxZoom: 7 } }),
      minZoom: 1.5,
      maxZoom: 10,
      renderWorldCopies: false,
      attributionControl: false,
      // Lets the export read the canvas back after it has been drawn.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, maxWidth: '240px' })
    const showTip = (e) => {
      const tip = e.features?.[0]?.properties?.tip
      if (!tip) return
      map.getCanvas().style.cursor = 'default'
      const el = document.createElement('div')
      el.className = 'text-xs leading-snug text-gray-700'
      tip.split('\n').forEach((line, i) => {
        const p = document.createElement('div')
        if (i === 0) p.className = 'font-medium text-gray-900'
        p.textContent = line
        el.append(p)
      })
      popup.setLngLat(e.lngLat).setDOMContent(el).addTo(map)
    }

    // An inline style can finish loading before this listener exists, so the
    // first 'load' adds the layers too; both are no-ops once they're there.
    const ensureLayers = () => {
      if (!map.getLayer('main-fill')) addLayers(map, propsRef.current)
    }
    map.on('style.load', ensureLayers)
    map.once('load', ensureLayers)
    for (const layer of ['main-fill', 'main-circle', 'overlay-dots']) {
      map.on('mousemove', layer, showTip)
      map.on('mouseleave', layer, () => popup.remove())
    }
    map.on('moveend', () => {
      const c = map.getCenter()
      onViewChangeRef.current?.({ center: [c.lng, c.lat], zoom: map.getZoom() })
    })
    onReady?.(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
