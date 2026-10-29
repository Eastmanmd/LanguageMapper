import { useMemo, useState } from 'react'
import { CATEGORICAL, OTHER } from '../utils/atlasColors'
import { countryName } from '../utils/countries'

// Africa's bounding box; languages outside it (a few islands far offshore) are skipped.
const WEST = -19
const EAST = 52
const NORTH = 38
const SOUTH = -35
const SCALE = 4
const WIDTH = (EAST - WEST) * SCALE
const HEIGHT = (NORTH - SOUTH) * SCALE

const project = (lon, lat) => [(lon - WEST) * SCALE, (NORTH - lat) * SCALE]

const ringPath = (ring) =>
  `M${ring.map(([lon, lat]) => project(lon, lat).map((n) => n.toFixed(1)).join(' ')).join('L')}Z`

function countryPath(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.map((rings) => rings.map(ringPath).join('')).join('')
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A static picture of the atlas: one dot per language, coloured by its
 * traditional group exactly as the atlas legend's top level colours it.
 * `highlight` fades every group but one; `spotlight` rings one language.
 */
export default function AfricaDotMap({ atlas, borders, theme, onSelect, highlight, spotlight }) {
  const [hovered, setHovered] = useState(null)

  // The 2,000+ dots and country shapes only change with the data, theme or
  // highlight, not on every hover, so they're built once per change.
  const layers = useMemo(() => {
    if (!atlas) return null
    const { tree } = atlas
    const slot = new Map(tree.branches(null).map((b, i) => [b.id, i]))
    const colorOf = (lang) => CATEGORICAL[theme][slot.get(tree.lineage(lang.p)[0])] ?? OTHER[theme]
    const shapes = borders?.features.map((f) => (
      <path
        key={f.properties.c}
        d={countryPath(f.geometry)}
        className="fill-gray-100 stroke-white dark:fill-white/5 dark:stroke-[#0a0a0a]"
        strokeWidth="0.6"
      />
    ))
    const dots = atlas.languages
      .filter((l) => l.lon >= WEST && l.lon <= EAST && l.lat >= SOUTH && l.lat <= NORTH)
      .map((lang) => {
        const [x, y] = project(lang.lon, lang.lat)
        const faded = highlight && tree.lineage(lang.p)[0] !== highlight
        return (
          <circle
            key={lang.g}
            data-g={lang.g}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r="1.6"
            fill={colorOf(lang)}
            opacity={faded ? 0.12 : 1}
            className="transition-[r,opacity] duration-200 hover:[r:3.5px]"
          />
        )
      })
    return { colorOf, shapes, dots }
  }, [atlas, borders, theme, highlight])

  if (!atlas) {
    return <div style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }} className="w-full" aria-hidden="true" />
  }

  const { tree } = atlas
  const { colorOf } = layers
  const spot = spotlight ? tree.byId.get(spotlight) : null
  const [spotX, spotY] = spot ? project(spot.lon, spot.lat) : []

  const hoveredLang = hovered ? tree.byId.get(hovered) : null
  const hoveredFamily = hoveredLang && tree.lineage(hoveredLang.p)
  const [tipX, tipY] = hoveredLang ? project(hoveredLang.lon, hoveredLang.lat) : []

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full cursor-pointer"
        role="img"
        aria-label={`Map of Africa with ${atlas.languages.length.toLocaleString('en-US')} languages, coloured by family`}
        onClick={(e) => {
          const g = e.target.dataset?.g
          if (g) onSelect(g)
        }}
        onMouseOver={(e) => setHovered(e.target.dataset?.g ?? null)}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Faint country shapes so the continent reads even where dots are sparse (the Sahara). */}
        {layers.shapes}
        {layers.dots}
        {spot && (
          <g pointerEvents="none">
            {!reducedMotion() && (
              <circle cx={spotX} cy={spotY} r="4" fill="none" stroke={colorOf(spot)} strokeWidth="1.5">
                <animate attributeName="r" from="4" to="18" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.9" to="0" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={spotX}
              cy={spotY}
              r="4"
              fill={colorOf(spot)}
              className="stroke-gray-900 dark:stroke-white"
              strokeWidth="1.2"
            />
          </g>
        )}
      </svg>

      {hoveredLang && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/15 dark:bg-[#141414]"
          style={{ left: `${(tipX / WIDTH) * 100}%`, top: `calc(${(tipY / HEIGHT) * 100}% - 8px)` }}
        >
          <p className="font-medium text-gray-900 dark:text-white">{hoveredLang.n}</p>
          <p className="text-gray-500 dark:text-gray-400">
            {tree.name(hoveredFamily[1] ?? hoveredFamily[0])}
          </p>
          {hoveredLang.c.length > 0 && (
            <p className="text-gray-500 dark:text-gray-400">
              {hoveredLang.c.slice(0, 3).map(countryName).join(', ')}
              {hoveredLang.c.length > 3 && ` +${hoveredLang.c.length - 3}`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
