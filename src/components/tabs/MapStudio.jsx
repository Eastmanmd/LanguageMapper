import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StudioPanel from '../studio/StudioPanel'
import LanguageSearch from '../LanguageSearch'
import { buildDots, buildMainLayer, CREDITS, MAIN_LAYERS, sharedBreaks } from '../studio/studioLayers'
import { paramsToState, presetOnMap, presetState, PRESETS, stateToParams } from '../studio/presets'
import { exportMapPng, FRAMES, TITLE_BAND } from '../../utils/exportMap'
import { boundsOf, countryName } from '../../utils/countries'
import { loadAtlas, loadBorders, loadStudio, loadWater } from '../../utils/loadAtlas'

const AFRICA = [
  [-19, -35.5],
  [52, 37.5],
]
const MAP_LETTERS = { a: 'A', b: 'B' }
// Below this, two maps side by side are too small to read, so they stack.
const STACK_BELOW = 480

const BASE_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'streets', label: 'Streets' },
]
const OVERLAY_OPTIONS = [
  { id: 'water', label: 'Rivers and lakes' },
  { id: 'borders', label: 'Country borders' },
  { id: 'labels', label: 'Country names' },
]

function Section({ title, className = '', children }) {
  return (
    <section className={`border-t border-gray-200 px-4 py-4 first:border-t-0 dark:border-white/10 ${className}`}>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
      {children}
    </section>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs font-medium dark:border-white/15">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`flex-1 rounded-md px-2 py-1.5 transition-colors ${
            value === o.id
              ? 'bg-naija-50 text-naija-700 dark:bg-naija-500/15 dark:text-naija-300'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-naija-400 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white'

// Families people are likely to want on their own: the four big groups, their
// families of 15+ languages, and large branches deeper down (Bantu, Chadic…).
function focusOptions(tree) {
  const out = []
  const walk = (id, depth) => {
    for (const branch of tree.branches(id)) {
      if (!tree.isGroup(branch.id)) continue
      const keep = depth === 0 || (depth === 1 && branch.count >= 15) || branch.count >= 60
      if (keep) out.push({ id: branch.id, name: branch.name, count: branch.count, depth })
      if (depth < 4 && branch.count >= 60) walk(branch.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

const usesLanguages = (map) => {
  const kind = MAIN_LAYERS.find((l) => l.id === map.layer)?.kind
  return kind === 'dots' || kind === 'hex' || map.dots
}

// Families first, largest down, so a search for "Bantu" or "Arabic" finds the
// group before the many languages named after it. Glottolog's single-child
// chains would list the same group several times, so each appears once.
function spokenOptions(atlas) {
  const { tree } = atlas
  const seen = new Set()
  const families = Object.keys(tree.nodes)
    .map((id) => ({ id, name: tree.name(id), count: tree.count(id) }))
    .filter((f) => f.count >= 2)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .filter((f) => {
      const key = `${f.name}|${f.count}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((f) => ({ id: f.id, name: f.name, detail: `Family · ${f.count.toLocaleString('en-US')}` }))
  const languages = atlas.languages
    .map((l) => ({ id: l.g, name: l.n, detail: 'Language' }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return [...families, ...languages]
}

// Says what one of two compared maps shows, since the shared title can't.
function captionFor(id, map, atlas) {
  const def = MAIN_LAYERS.find((l) => l.id === map.layer)
  const showsLanguages = usesLanguages(map)
  return [
    MAP_LETTERS[id],
    map.layer === 'spokenIn' && map.spoken
      ? `Where ${atlas.tree.name(map.spoken)} is spoken`
      : def?.kind
        ? def.label.replace(/\s*\(.*\)$/, '')
        : 'Base map',
    map.dots && map.layer !== 'families' && 'Language dots',
    showsLanguages && map.focus && atlas.tree.isGroup(map.focus) && atlas.tree.name(map.focus),
    showsLanguages && map.endangered && 'Endangered only',
    map.country && countryName(map.country),
  ]
    .filter(Boolean)
    .join(' · ')
}

// What one map's layers are built from. A chosen country also narrows the
// language layers to its languages.
function useLayerContext(map, { atlas, studio, borders }, base) {
  const exists = Boolean(map)
  const { focus, endangered, hex, country, spoken } = map ?? {}
  return useMemo(() => {
    if (!exists || !atlas) return null
    const countryAtlas = country
      ? { ...atlas, languages: atlas.languages.filter((l) => l.c.includes(country)) }
      : atlas
    return {
      atlas: countryAtlas,
      studio,
      borders,
      theme: base === 'dark' ? 'dark' : 'light',
      focus: focus && atlas.tree.isGroup(focus) ? focus : null,
      endangeredOnly: endangered,
      hexSize: hex,
      // Where a language is spoken doesn't narrow to the chosen country.
      allLanguages: atlas.languages,
      spoken: spoken && (atlas.tree.isGroup(spoken) || atlas.tree.byId.has(spoken)) ? spoken : null,
    }
  }, [exists, atlas, studio, borders, base, focus, endangered, hex, country, spoken])
}

function useMapLayers(map, ctx, breaks) {
  const layer = map?.layer
  const dots = Boolean(map?.dots) && layer !== 'families'
  const main = useMemo(
    () => (ctx?.borders && ctx.studio ? buildMainLayer(layer, breaks ? { ...ctx, breaks } : ctx) : null),
    [ctx, layer, breaks],
  )
  const overlayDots = useMemo(() => (ctx && dots ? buildDots(ctx, false) : null), [ctx, dots])
  return { main, overlayDots, dots }
}

export default function MapStudio() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState(() => paramsToState(searchParams) ?? presetState('families'))
  const [data, setData] = useState({})
  // Without a saved view, open framed on Africa with room for the title and legend.
  const [view, setView] = useState(null)
  const [areaSize, setAreaSize] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  // Which map the sidebar edits while comparing.
  const [selected, setSelected] = useState('a')
  const [maps, setMaps] = useState({ a: null, b: null })
  const areaRef = useRef(null)

  const compare = Boolean(state.b)
  const activeId = compare ? selected : 'a'
  const active = state[activeId]

  useEffect(() => {
    Promise.all([loadAtlas(), loadBorders(), loadStudio()])
      .then(([atlas, borders, studio]) => setData((d) => ({ ...d, atlas, borders, studio })))
      .catch(() => setData((d) => ({ ...d, error: true })))
  }, [])

  useEffect(() => {
    if (state.overlays.includes('water') && !data.water) loadWater().then((water) => setData((d) => ({ ...d, water })))
  }, [state.overlays, data.water])

  // Keep the URL in step so any map can be shared or bookmarked.
  useEffect(() => {
    setSearchParams(stateToParams(state), { replace: true })
  }, [state, setSearchParams])

  // Track the available space; clientWidth includes the padding (p-3, 12px a
  // side), which the frame mustn't use.
  useEffect(() => {
    const area = areaRef.current
    if (!area) return undefined
    const measure = () => setAreaSize({ width: area.clientWidth - 24, height: area.clientHeight - 24 })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    return () => observer.disconnect()
  }, [])

  // Two maps move as one. A linked move is marked so it isn't passed straight
  // back, and so only the map being moved reports the new view.
  useEffect(() => {
    const { a, b } = maps
    if (!a || !b) return undefined
    const follow = (from, to) => (e) => {
      if (!e.linked) to.jumpTo({ center: from.getCenter(), zoom: from.getZoom() }, { linked: true })
    }
    const followA = follow(a, b)
    const followB = follow(b, a)
    b.jumpTo({ center: a.getCenter(), zoom: a.getZoom() }, { linked: true })
    a.on('move', followA)
    b.on('move', followB)
    return () => {
      a.off('move', followA)
      b.off('move', followB)
    }
  }, [maps])

  // Fit the frame's aspect ratio inside the available space.
  const frameId = compare && areaSize && areaSize.width < STACK_BELOW ? 'portrait' : state.frame
  const frame = FRAMES[frameId]
  const stacked = compare && frameId === 'portrait'
  const frameScale = areaSize && Math.min(areaSize.width / frame.width, areaSize.height / frame.height)
  const frameSize = areaSize && { width: Math.floor(frame.width * frameScale), height: Math.floor(frame.height * frameScale) }

  const update = (changes) => setState((s) => ({ ...s, ...changes }))
  const updateActive = (changes) => setState((s) => ({ ...s, [activeId]: { ...s[activeId], ...changes } }))
  // Leave room for the title and legend so they don't sit on top of the map:
  // beside it in a wide frame, below it in square and portrait ones. Compared
  // maps have the title above them, and Africa sits right of centre to leave
  // the legend the empty sea off its south-west coast.
  const paddingFor = (shape, comparing) => {
    if (comparing) return { top: 40, bottom: 28, left: state.legend ? 72 : 16, right: state.legend ? 8 : 16 }
    return shape === 'wide'
      ? { top: 24, bottom: 36, left: state.legend ? 240 : 24, right: 24 }
      : { top: 90, bottom: state.legend ? 200 : 40, left: 24, right: 24 }
  }
  const fitTo = (bounds, shape = state.frame, comparing = compare) => setView({ bounds, padding: paddingFor(shape, comparing) })
  useEffect(() => {
    if (!state.view) fitTo(AFRICA)
    // Only on first load: later views come from the user panning or presets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const countryBounds = (code) =>
    code && data.atlas
      ? (data.atlas.countries[code] ?? boundsOf(data.atlas.languages.filter((l) => l.c.includes(code))))
      : AFRICA

  const applyPreset = (id) => {
    setState((s) => (s.b ? presetOnMap(s, id, activeId) : presetState(id)))
    // Don't pull the view away from a country the other map is showing.
    const other = compare ? state[activeId === 'a' ? 'b' : 'a'] : null
    if (!other?.country) fitTo(AFRICA)
  }

  const setCompare = (on) => {
    setState((s) => ({ ...s, b: on ? { ...s.a } : null }))
    setSelected(on ? 'b' : 'a')
    // A new shape needs a new fit, once the maps have taken their new size.
    setTimeout(() => fitTo(countryBounds(state.a.country), state.frame, on), 150)
  }

  const { atlas, borders, studio, water } = data
  const ctxA = useLayerContext(state.a, data, state.base)
  const ctxB = useLayerContext(state.b, data, state.base)
  const sharedLayer = state.a.layer === state.b?.layer ? state.a.layer : null
  const breaks = useMemo(
    () => (sharedLayer && ctxA && ctxB ? sharedBreaks(sharedLayer, ctxA, ctxB) : null),
    [sharedLayer, ctxA, ctxB],
  )
  const layersA = useMapLayers(state.a, ctxA, breaks)
  const layersB = useMapLayers(state.b, ctxB, breaks)
  const panels = [
    { id: 'a', map: state.a, ...layersA },
    ...(state.b ? [{ id: 'b', map: state.b, ...layersB }] : []),
  ]
  const labels = useMemo(() => {
    if (!studio) return null
    return {
      type: 'FeatureCollection',
      features: Object.entries(studio.countries)
        .filter(([, c]) => c.label)
        .map(([code, c]) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: c.label },
          properties: { name: countryName(code) },
        })),
    }
  }, [studio])

  const layerDef = MAIN_LAYERS.find((l) => l.id === active.layer)
  const isLanguageLayer = usesLanguages(active)
  const credits = [
    ...new Set([
      ...(state.base === 'terrain' ? [CREDITS.terrain] : state.base === 'streets' ? [CREDITS.streets] : []),
      ...panels.flatMap((p) => p.main?.credits ?? []),
      ...(panels.some((p) => p.map.dots) ? [CREDITS.glottolog] : []),
      CREDITS.borders,
    ]),
  ]
  const posterDark = state.base === 'dark'

  const countryOptions = useMemo(
    () =>
      atlas
        ? Object.keys(atlas.countries)
            .map((code) => ({ id: code, name: countryName(code) }))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [atlas],
  )
  const families = useMemo(() => (atlas ? focusOptions(atlas.tree) : []), [atlas])
  const spokenChoices = useMemo(() => (atlas ? spokenOptions(atlas) : []), [atlas])

  const selectCountry = (code) => {
    updateActive({ country: code })
    fitTo(countryBounds(code))
  }

  const download = async () => {
    if (panels.some((p) => !maps[p.id])) return
    setBusy(true)
    try {
      await exportMapPng({
        panels: panels.map((p) => ({
          map: maps[p.id],
          legend: state.legend ? p.main?.legend : null,
          caption: compare ? captionFor(p.id, p.map, atlas) : null,
        })),
        frame: frameId,
        title: state.title,
        subtitle: state.subtitle,
        credits,
        dark: posterDark,
      })
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the address bar already holds the link.
    }
  }

  if (data.error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-gray-500 dark:text-gray-400">
        The map data couldn&rsquo;t be loaded. Check your connection and refresh.
      </div>
    )
  }

  const hasTitle = Boolean(state.title || state.subtitle)
  const panelClass = posterDark
    ? 'border-white/15 bg-black/80 text-gray-200'
    : 'border-gray-200 bg-white/92 text-gray-700'

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="order-2 w-full shrink-0 overflow-y-auto border-t border-gray-200 text-sm md:order-1 md:w-[300px] md:border-t-0 md:border-r dark:border-white/10">
        <Section title="Compare" className="sticky top-0 z-10 bg-white dark:bg-[#0a0a0a]">
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
            Compare two maps
          </label>
          {compare && (
            <div className="mt-2.5">
              <Segmented
                options={[
                  { id: 'a', label: 'Edit map A' },
                  { id: 'b', label: 'Edit map B' },
                ]}
                value={activeId}
                onChange={setSelected}
              />
            </div>
          )}
        </Section>

        <Section title="Start from a story">
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                title={preset.blurb}
                className="rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition-colors hover:border-naija-300 hover:bg-naija-50 dark:border-white/10 dark:text-gray-200 dark:hover:border-naija-400/40 dark:hover:bg-naija-500/10"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Colour the map by">
          <select value={active.layer} onChange={(e) => updateActive({ layer: e.target.value })} className={inputClass}>
            {['Languages', 'Countries', 'Base'].map((group) => (
              <optgroup key={group} label={group}>
                {MAIN_LAYERS.filter((l) => l.group === group).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {active.layer === 'spokenIn' && (
            <div className="mt-2.5">
              <LanguageSearch
                key={atlas ? 'ready' : 'loading'}
                languageOptions={spokenChoices}
                selectedLanguage={active.spoken}
                onSelect={(spoken) => updateActive({ spoken })}
                onClear={() => updateActive({ spoken: null })}
                placeholder="Search a language or family…"
                clearLabel="Clear language or family"
              />
            </div>
          )}
          {layerDef?.kind === 'hex' && (
            <div className="mt-2.5">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Area size</p>
              <Segmented
                options={[
                  { id: 'small', label: 'Small' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'large', label: 'Large' },
                ]}
                value={active.hex}
                onChange={(hex) => updateActive({ hex })}
              />
            </div>
          )}
        </Section>

        {isLanguageLayer && (
          <Section title="Which languages">
            <select
              value={active.focus ?? ''}
              onChange={(e) => updateActive({ focus: e.target.value || null })}
              className={inputClass}
              aria-label="Language family"
            >
              <option value="">All families</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {`${'  '.repeat(f.depth)}${f.name} (${f.count})`}
                </option>
              ))}
            </select>
            <label className="mt-2.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={active.endangered}
                onChange={(e) => updateActive({ endangered: e.target.checked })}
              />
              Only endangered languages
            </label>
          </Section>
        )}

        <Section title="Country">
          <LanguageSearch
            key={atlas ? 'ready' : 'loading'}
            languageOptions={countryOptions}
            selectedLanguage={active.country}
            onSelect={selectCountry}
            onClear={() => selectCountry(null)}
            placeholder="All of Africa"
            browsable
            clearLabel="Show all of Africa"
          />
          {active.country && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Outlined, and language layers show only languages spoken there.
            </p>
          )}
        </Section>

        <Section title="On top">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={active.dots} onChange={(e) => updateActive({ dots: e.target.checked })} />
              {compare ? `Language dots (map ${MAP_LETTERS[activeId]})` : 'Language dots'}
            </label>
            {OVERLAY_OPTIONS.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={state.overlays.includes(o.id)}
                  onChange={(e) =>
                    update({
                      overlays: e.target.checked ? [...state.overlays, o.id] : state.overlays.filter((x) => x !== o.id),
                    })
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
        </Section>

        <Section title={compare ? 'Look (both maps)' : 'Look'}>
          <Segmented options={BASE_OPTIONS} value={state.base} onChange={(base) => update({ base })} />
          <p className="mb-1 mt-3 text-xs text-gray-500 dark:text-gray-400">Shape</p>
          <Segmented
            options={Object.entries(FRAMES).map(([id, f]) => ({ id, label: f.label }))}
            value={state.frame}
            onChange={(shape) => {
              update({ frame: shape })
              // A new shape needs a new fit, once the map has taken its new size.
              setTimeout(() => fitTo(countryBounds(active.country), shape), 150)
            }}
          />
          {frameId !== state.frame && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              On a screen this small, compared maps are stacked in portrait.
            </p>
          )}
        </Section>

        <Section title="Title and legend">
          <input
            value={state.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Title"
            className={inputClass}
            aria-label="Title"
          />
          <textarea
            value={state.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
            placeholder="Subtitle"
            rows={2}
            className={`${inputClass} mt-2 resize-none`}
            aria-label="Subtitle"
          />
          <label className="mt-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={state.legend} onChange={(e) => update({ legend: e.target.checked })} />
            Show legend
          </label>
        </Section>

        <Section title="Share">
          <div className="flex gap-2">
            <button
              onClick={download}
              disabled={busy || !layersA.main}
              className="flex-1 rounded-lg bg-naija-600 px-3 py-2 text-sm font-medium text-white hover:bg-naija-700 disabled:opacity-60"
            >
              {busy ? 'Preparing…' : 'Download PNG'}
            </button>
            <button
              onClick={copyLink}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5"
            >
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Images are {frame.width}×{frame.height} and include the title, legend and
            sources.
          </p>
        </Section>
      </aside>

      <div ref={areaRef} className="relative order-1 flex min-h-[55vh] min-w-0 flex-1 items-center justify-center overflow-hidden bg-gray-100 p-3 md:order-2 md:min-h-0 dark:bg-black">
        {frameSize && (
          <div
            className="relative flex flex-col overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            style={{ width: frameSize.width, height: frameSize.height }}
          >
            {compare && hasTitle && (
              <div
                className={`flex shrink-0 flex-col justify-center overflow-hidden px-3 ${posterDark ? 'bg-[#121211] text-gray-200' : 'bg-white text-gray-700'}`}
                style={{ height: frameSize.height * TITLE_BAND[frameId] }}
              >
                {state.title && (
                  <p className={`truncate text-base font-semibold leading-tight md:text-lg ${posterDark ? 'text-white' : 'text-gray-900'}`}>
                    {state.title}
                  </p>
                )}
                {state.subtitle && <p className="truncate text-xs leading-snug">{state.subtitle}</p>}
              </div>
            )}

            <div className={`grid min-h-0 flex-1 ${!compare ? 'grid-cols-1 grid-rows-1' : stacked ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-1'}`}>
              {borders && studio && atlas && panels.map((p) => (
                <StudioPanel
                  key={p.id}
                  caption={compare ? captionFor(p.id, p.map, atlas) : null}
                  legend={state.legend ? p.main?.legend : null}
                  compact={compare}
                  divider={p.id === 'b' ? (stacked ? 'inset-x-0 top-0 h-px' : 'inset-y-0 left-0 w-px') : null}
                  selected={compare && p.id === activeId}
                  dark={posterDark}
                  panelClass={panelClass}
                  onSelect={compare ? () => setSelected(p.id) : undefined}
                  base={state.base}
                  main={p.main}
                  overlays={{
                    dots: p.dots,
                    water: state.overlays.includes('water'),
                    borders: state.overlays.includes('borders'),
                    labels: state.overlays.includes('labels'),
                  }}
                  dotsData={p.overlayDots}
                  waterData={water}
                  bordersData={borders}
                  labelsData={labels}
                  country={p.map.country}
                  // Fits go to map A alone; map B follows it.
                  view={p.id === 'a' ? view : null}
                  initialView={state.view}
                  onViewChange={(v) => update({ view: v })}
                  onReady={(map) => setMaps((all) => ({ ...all, [p.id]: map }))}
                />
              ))}
            </div>

            {!compare && hasTitle && (
              <div className={`pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-lg border px-3 py-2 backdrop-blur ${panelClass}`}>
                {state.title && (
                  <p className={`text-base font-semibold leading-tight md:text-lg ${posterDark ? 'text-white' : 'text-gray-900'}`}>
                    {state.title}
                  </p>
                )}
                {state.subtitle && <p className="mt-0.5 text-xs leading-snug">{state.subtitle}</p>}
              </div>
            )}

            <p className={`pointer-events-none absolute inset-x-0 bottom-0 truncate px-3 py-1 text-[10px] ${panelClass} border-t`}>
              {credits.join(' · ')}
            </p>

            {!atlas && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">Loading map data…</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
