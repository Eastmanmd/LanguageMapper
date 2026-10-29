import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StudioMap from '../studio/StudioMap'
import LanguageSearch from '../LanguageSearch'
import { buildDots, buildMainLayer, CREDITS, MAIN_LAYERS } from '../studio/studioLayers'
import { paramsToState, presetState, PRESETS, stateToParams } from '../studio/presets'
import { exportMapPng, FRAMES } from '../../utils/exportMap'
import { boundsOf, countryName } from '../../utils/countries'
import { loadAtlas, loadBorders, loadStudio, loadWater } from '../../utils/loadAtlas'

const BASE_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'streets', label: 'Streets' },
]
const OVERLAY_OPTIONS = [
  { id: 'dots', label: 'Language dots' },
  { id: 'water', label: 'Rivers and lakes' },
  { id: 'borders', label: 'Country borders' },
  { id: 'labels', label: 'Country names' },
]

function Section({ title, children }) {
  return (
    <section className="border-t border-gray-200 px-4 py-4 first:border-t-0 dark:border-white/10">
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

export default function MapStudio() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState(() => paramsToState(searchParams) ?? presetState('families'))
  const [data, setData] = useState({})
  // Without a saved view, open framed on Africa with room for the title and legend.
  const [view, setView] = useState(null)
  const [frameSize, setFrameSize] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const mapRef = useRef(null)
  const areaRef = useRef(null)

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

  // Fit the chosen frame's aspect ratio inside the available space.
  useEffect(() => {
    const area = areaRef.current
    if (!area) return undefined
    const fit = () => {
      const { width, height } = FRAMES[state.frame]
      // clientWidth includes the padding (p-3, 12px a side), which the frame mustn't use.
      const scale = Math.min((area.clientWidth - 24) / width, (area.clientHeight - 24) / height)
      setFrameSize({ width: Math.floor(width * scale), height: Math.floor(height * scale) })
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(area)
    return () => observer.disconnect()
  }, [state.frame])

  const update = (changes) => setState((s) => ({ ...s, ...changes }))
  // Leave room for the title and legend so they don't sit on top of the map:
  // beside it in a wide frame, below it in square and portrait ones.
  const paddingFor = (frame) =>
    frame === 'wide'
      ? { top: 24, bottom: 36, left: state.legend ? 240 : 24, right: 24 }
      : { top: 90, bottom: state.legend ? 200 : 40, left: 24, right: 24 }
  const fitTo = (bounds, frame = state.frame) => setView({ bounds, padding: paddingFor(frame) })
  useEffect(() => {
    if (!state.view) fitTo([[-19, -35.5], [52, 37.5]])
    // Only on first load: later views come from the user panning or presets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fitToCurrent = (frame = state.frame) => {
    const bounds = state.country && data.atlas
      ? (data.atlas.countries[state.country] ?? boundsOf(data.atlas.languages.filter((l) => l.c.includes(state.country))))
      : [[-19, -35.5], [52, 37.5]]
    fitTo(bounds, frame)
  }

  const applyPreset = (id) => {
    setState(presetState(id))
    fitTo([[-19, -35.5], [52, 37.5]])
  }

  const { atlas, borders, studio, water } = data
  const ctx = useMemo(() => {
    if (!atlas) return null
    // A chosen country also narrows the language layers to its languages.
    const countryAtlas = state.country
      ? { ...atlas, languages: atlas.languages.filter((l) => l.c.includes(state.country)) }
      : atlas
    return {
      atlas: countryAtlas,
      studio,
      borders,
      theme: state.base === 'dark' ? 'dark' : 'light',
      focus: state.focus && atlas.tree.isGroup(state.focus) ? state.focus : null,
      endangeredOnly: state.endangered,
      hexSize: state.hex,
    }
  }, [atlas, studio, borders, state.base, state.focus, state.endangered, state.hex, state.country])

  const main = useMemo(() => (ctx && borders && studio ? buildMainLayer(state.layer, ctx) : null), [ctx, borders, studio, state.layer])
  const overlayDots = useMemo(
    () => (ctx && state.overlays.includes('dots') && state.layer !== 'families' ? buildDots(ctx, false) : null),
    [ctx, state.overlays, state.layer],
  )
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

  const layerDef = MAIN_LAYERS.find((l) => l.id === state.layer)
  const isLanguageLayer = layerDef?.kind === 'dots' || layerDef?.kind === 'hex' || state.overlays.includes('dots')
  const credits = [
    ...new Set([
      ...(state.base === 'terrain' ? [CREDITS.terrain] : state.base === 'streets' ? [CREDITS.streets] : []),
      ...(main?.credits ?? []),
      ...(state.overlays.includes('dots') ? [CREDITS.glottolog] : []),
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

  const selectCountry = (code) => {
    update({ country: code })
    fitTo(code ? (atlas.countries[code] ?? boundsOf(atlas.languages.filter((l) => l.c.includes(code)))) : [[-19, -35.5], [52, 37.5]])
  }

  const download = async () => {
    if (!mapRef.current) return
    setBusy(true)
    try {
      await exportMapPng({
        map: mapRef.current,
        frame: state.frame,
        title: state.title,
        subtitle: state.subtitle,
        legend: state.legend ? main?.legend : null,
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

  const panelClass = posterDark
    ? 'border-white/15 bg-black/80 text-gray-200'
    : 'border-gray-200 bg-white/92 text-gray-700'

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="order-2 w-full shrink-0 overflow-y-auto border-t border-gray-200 text-sm md:order-1 md:w-[300px] md:border-t-0 md:border-r dark:border-white/10">
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
          <select value={state.layer} onChange={(e) => update({ layer: e.target.value })} className={inputClass}>
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
          {layerDef?.kind === 'hex' && (
            <div className="mt-2.5">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Area size</p>
              <Segmented
                options={[
                  { id: 'small', label: 'Small' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'large', label: 'Large' },
                ]}
                value={state.hex}
                onChange={(hex) => update({ hex })}
              />
            </div>
          )}
        </Section>

        {isLanguageLayer && (
          <Section title="Which languages">
            <select
              value={state.focus ?? ''}
              onChange={(e) => update({ focus: e.target.value || null })}
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
                checked={state.endangered}
                onChange={(e) => update({ endangered: e.target.checked })}
              />
              Only endangered languages
            </label>
          </Section>
        )}

        <Section title="Country">
          <LanguageSearch
            key={atlas ? 'ready' : 'loading'}
            languageOptions={countryOptions}
            selectedLanguage={state.country}
            onSelect={selectCountry}
            onClear={() => selectCountry(null)}
            placeholder="All of Africa"
            browsable
            clearLabel="Show all of Africa"
          />
          {state.country && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Outlined, and language layers show only languages spoken there.
            </p>
          )}
        </Section>

        <Section title="On top">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
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

        <Section title="Look">
          <Segmented options={BASE_OPTIONS} value={state.base} onChange={(base) => update({ base })} />
          <p className="mb-1 mt-3 text-xs text-gray-500 dark:text-gray-400">Shape</p>
          <Segmented
            options={Object.entries(FRAMES).map(([id, f]) => ({ id, label: f.label }))}
            value={state.frame}
            onChange={(frame) => {
              update({ frame })
              // A new shape needs a new fit, once the map has taken its new size.
              setTimeout(() => fitToCurrent(frame), 150)
            }}
          />
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
              disabled={busy || !main}
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
            Images are {FRAMES[state.frame].width}×{FRAMES[state.frame].height} and include the title, legend and
            sources.
          </p>
        </Section>
      </aside>

      <div ref={areaRef} className="relative order-1 flex min-h-[55vh] min-w-0 flex-1 items-center justify-center overflow-hidden bg-gray-100 p-3 md:order-2 md:min-h-0 dark:bg-black">
        {frameSize && (
          <div
            className="relative overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            style={{ width: frameSize.width, height: frameSize.height }}
          >
            {borders && studio && atlas && (
              <StudioMap
                base={state.base}
                main={main}
                overlays={{
                  dots: state.overlays.includes('dots') && state.layer !== 'families',
                  water: state.overlays.includes('water'),
                  borders: state.overlays.includes('borders'),
                  labels: state.overlays.includes('labels'),
                }}
                dotsData={overlayDots}
                waterData={water}
                bordersData={borders}
                labelsData={labels}
                country={state.country}
                view={view}
                initialView={state.view}
                onViewChange={(v) => update({ view: v })}
                onReady={(map) => {
                  mapRef.current = map
                }}
              />
            )}

            {(state.title || state.subtitle) && (
              <div className={`pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-lg border px-3 py-2 backdrop-blur ${panelClass}`}>
                {state.title && (
                  <p className={`text-base font-semibold leading-tight md:text-lg ${posterDark ? 'text-white' : 'text-gray-900'}`}>
                    {state.title}
                  </p>
                )}
                {state.subtitle && <p className="mt-0.5 text-xs leading-snug">{state.subtitle}</p>}
              </div>
            )}

            {state.legend && main?.legend && (
              <div className={`absolute bottom-9 left-3 max-h-[55%] w-56 overflow-y-auto rounded-lg border px-3 py-2 text-xs backdrop-blur ${panelClass}`}>
                <p className={`mb-1.5 font-semibold ${posterDark ? 'text-white' : 'text-gray-900'}`}>{main.legend.title}</p>
                <ul className="space-y-1">
                  {main.legend.items.map((item) => (
                    <li key={item.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="flex-1">{item.label}</span>
                      {item.value != null && <span className="tabular-nums opacity-70">{item.value.toLocaleString('en-US')}</span>}
                    </li>
                  ))}
                </ul>
                {main.legend.note && <p className="mt-1.5 leading-snug opacity-70">{main.legend.note}</p>}
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
