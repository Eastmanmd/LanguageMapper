import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapLegend from './MapLegend'

const STATES_SOURCE = 'nigeria-states'
const FILL_LAYER = 'nigeria-states-fill'
const LINE_LAYER = 'nigeria-states-line'
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

function fillColorExpr(selectedId, highlightedIds) {
  return [
    'case',
    ['==', ['get', 'state_id'], selectedId ?? ''],
    '#3a4d8f',
    ['in', ['get', 'state_id'], ['literal', highlightedIds ?? []]],
    '#f5a623',
    '#008751',
  ]
}

function fillOpacityExpr(selectedId, highlightedIds, hovering) {
  return [
    'case',
    ['==', ['get', 'state_id'], selectedId ?? ''],
    0.55,
    ['in', ['get', 'state_id'], ['literal', highlightedIds ?? []]],
    0.5,
    hovering ? 0.35 : 0.25,
  ]
}

function addStatesLayers(map, selectedId, highlightedIds) {
  if (!map.getSource(STATES_SOURCE)) {
    map.addSource(STATES_SOURCE, {
      type: 'geojson',
      data: '/data/nigeria-states.geojson',
    })
  }
  if (!map.getLayer(FILL_LAYER)) {
    map.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: STATES_SOURCE,
      paint: {
        'fill-color': fillColorExpr(selectedId, highlightedIds),
        'fill-opacity': fillOpacityExpr(selectedId, highlightedIds, false),
      },
    })
  }
  if (!map.getLayer(LINE_LAYER)) {
    map.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: STATES_SOURCE,
      paint: {
        'line-color': '#242e57',
        'line-width': 1,
      },
    })
  }
}

export default function MapView({ selectedStateId, onSelectState, highlightedStateIds, dark }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const selectedRef = useRef(selectedStateId)
  const highlightedRef = useRef(highlightedStateIds ?? [])
  const darkRef = useRef(dark)
  const isFirstStyleRun = useRef(true)

  useEffect(() => {
    selectedRef.current = selectedStateId
    highlightedRef.current = highlightedStateIds ?? []
    const map = mapRef.current
    if (map && map.getLayer(FILL_LAYER)) {
      map.setPaintProperty(FILL_LAYER, 'fill-color', fillColorExpr(selectedStateId, highlightedStateIds))
      map.setPaintProperty(FILL_LAYER, 'fill-opacity', fillOpacityExpr(selectedStateId, highlightedStateIds, false))
    }
  }, [selectedStateId, highlightedStateIds])

  useEffect(() => {
    darkRef.current = dark
    if (isFirstStyleRun.current) {
      isFirstStyleRun.current = false
      return
    }
    const map = mapRef.current
    if (!map) return
    map.setStyle(dark ? DARK_STYLE : LIGHT_STYLE)
    map.once('styledata', () => {
      addStatesLayers(map, selectedRef.current, highlightedRef.current)
    })
  }, [dark])

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: darkRef.current ? DARK_STYLE : LIGHT_STYLE,
      center: [8.0, 9.1],
      zoom: 5.4,
      minZoom: 5,
      maxZoom: 10,
      // Keep the view on Nigeria. The margin has to clear the country on every
      // side at minZoom — tighter bounds make MapLibre zoom in to satisfy them,
      // which crops Sokoto and Borno out of the default view.
      maxBounds: [
        [0.5, 2.0],
        [16.8, 16.0],
      ],
    })
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      addStatesLayers(map, selectedRef.current, highlightedRef.current)

      map.fitBounds(
        [
          [2.6, 4.2],
          [14.7, 13.9],
        ],
        { padding: 24, duration: 0 },
      )

      map.on('click', FILL_LAYER, (e) => {
        const feature = e.features?.[0]
        if (feature) {
          onSelectState(feature.properties.state_id, feature.properties.name)
        }
      })

      map.on('mouseenter', FILL_LAYER, () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty(
          FILL_LAYER,
          'fill-opacity',
          fillOpacityExpr(selectedRef.current, highlightedRef.current, true),
        )
      })

      map.on('mouseleave', FILL_LAYER, () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty(
          FILL_LAYER,
          'fill-opacity',
          fillOpacityExpr(selectedRef.current, highlightedRef.current, false),
        )
      })
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapLegend />
    </div>
  )
}
