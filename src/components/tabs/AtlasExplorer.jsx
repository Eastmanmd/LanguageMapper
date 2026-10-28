import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AtlasMap from '../AtlasMap'
import AtlasLegend from '../AtlasLegend'
import AtlasPanel from '../AtlasPanel'
import LanguageSearch from '../LanguageSearch'
import { buildTree } from '../../utils/atlasTree'
import { lexicalSimilarity, prepareWordList, SIMILARITY_BANDS } from '../../utils/similarity'
import { CATEGORICAL, FADED, OTHER, SIMILARITY } from '../../utils/atlasColors'
import { useTheme } from '../../context/ThemeContext'

const DATA_URL = `${import.meta.env.BASE_URL}data/africa/`
const MAX_COLORED_BRANCHES = CATEGORICAL.light.length

let wordsPromise = null
function loadWords() {
  wordsPromise ??= fetch(`${DATA_URL}words.json`).then((res) => res.json())
  return wordsPromise
}

export default function AtlasExplorer() {
  const { dark } = useTheme()
  const theme = dark ? 'dark' : 'light'
  const [searchParams, setSearchParams] = useSearchParams()
  const [atlas, setAtlas] = useState(null)
  const [words, setWords] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [view, setView] = useState(null)

  const selectedId = searchParams.get('lang')
  const focus = searchParams.get('focus')
  const compareId = searchParams.get('vs')
  const colorBy = searchParams.get('color') === 'similar' ? 'similar' : 'family'

  // Drilling into a group also frames its languages on the map.
  const focusGroup = (id) => {
    updateParams({ focus: id, color: null })
    if (!id) {
      setView({ name: 'africa' })
      return
    }
    const members = atlas.languages.filter((l) => tree.lineage(l.p).includes(id))
    if (!members.length) return
    const lons = members.map((l) => l.lon)
    const lats = members.map((l) => l.lat)
    setView({
      bounds: [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
    })
  }

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value == null) next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next)
  }

  useEffect(() => {
    fetch(`${DATA_URL}languages.json`)
      .then((res) => res.json())
      .then((data) => setAtlas({ ...data, tree: buildTree(data) }))
      .catch(() => setLoadError(true))
  }, [])

  // The word lists are ~1 MB, so they load once someone picks a language.
  useEffect(() => {
    if (selectedId && !words) loadWords().then(setWords).catch(() => setLoadError(true))
  }, [selectedId, words])

  const tree = atlas?.tree
  const selected = selectedId ? tree?.byId.get(selectedId) : null

  const prepared = useMemo(() => {
    if (!words) return null
    const out = new Map()
    for (const [g, list] of Object.entries(words.words)) out.set(g, prepareWordList(list.a))
    return out
  }, [words])

  // Similarity of every language to the selected one (null when there's no basis).
  const scores = useMemo(() => {
    const base = selected && prepared?.get(selected.g)
    if (!base) return null
    const out = new Map()
    for (const [g, list] of prepared) if (g !== selected.g) out.set(g, lexicalSimilarity(base, list))
    return out
  }, [selected, prepared])

  const branches = useMemo(() => {
    if (!tree) return []
    return tree.branches(focus && tree.isGroup(focus) ? focus : null).map((branch, i) => ({
      ...branch,
      slot: i < MAX_COLORED_BRANCHES ? i : null,
    }))
  }, [tree, focus])

  const showSimilarity = colorBy === 'similar' && scores
  const mapData = useMemo(() => {
    if (!atlas) return { type: 'FeatureCollection', features: [] }
    const branchIds = new Set(branches.map((b) => b.id))
    const branchById = new Map(branches.map((b) => [b.id, b]))
    const features = atlas.languages.map((lang) => {
      let color
      let label
      let emph = 1
      if (showSimilarity) {
        const score = lang.g === selected.g ? 1 : scores.get(lang.g)
        if (score == null) {
          color = FADED[theme]
          label = 'No word list to compare'
          emph = 0
        } else {
          const band = SIMILARITY_BANDS.findIndex((b) => score >= b.min)
          color = SIMILARITY[theme][band] ?? FADED[theme]
          label = lang.g === selected.g ? 'Selected language' : SIMILARITY_BANDS[band].label
          if (band === SIMILARITY_BANDS.length - 1) emph = 0
        }
      } else {
        const branch = branchById.get(tree.branchOf(lang, branchIds))
        if (!branch) {
          color = FADED[theme]
          label = tree.name(tree.lineage(lang.p)[0])
          emph = 0
        } else {
          color = branch.slot == null ? OTHER[theme] : CATEGORICAL[theme][branch.slot]
          label = branch.name
        }
      }
      if (lang.g === selectedId) emph = 2
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lang.lon, lang.lat] },
        properties: { g: lang.g, name: lang.n, color, label, emph },
      }
    })
    return { type: 'FeatureCollection', features }
  }, [atlas, tree, branches, showSimilarity, scores, selected, selectedId, theme])

  const languageOptions = useMemo(
    () =>
      (atlas?.languages ?? [])
        .map((l) => ({ id: l.g, name: l.n }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [atlas],
  )

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-gray-500 dark:text-gray-400">
        The atlas data couldn't be loaded. Check your connection and refresh.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <div className="relative min-h-[50vh] flex-1 md:min-h-0">
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-wrap items-start gap-2 md:right-auto">
          <div className="pointer-events-auto w-full max-w-sm">
            {/* Keyed on load so a ?lang= link fills the box once the names arrive. */}
            <LanguageSearch
              key={atlas ? 'ready' : 'loading'}
              languageOptions={languageOptions}
              selectedLanguage={selectedId}
              onSelect={(id) => updateParams({ lang: id, vs: null })}
              onClear={() => updateParams({ lang: null, vs: null, color: null })}
            />
          </div>
          <div className="pointer-events-auto flex rounded-lg border border-gray-200 bg-white/95 p-0.5 text-xs font-medium shadow-sm backdrop-blur dark:border-white/15 dark:bg-black/80">
            {['africa', 'nigeria'].map((name) => (
              <button
                key={name}
                onClick={() => setView({ name })}
                className="rounded-md px-2.5 py-1.5 capitalize text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <AtlasMap
          data={mapData}
          selectedId={selectedId}
          onSelect={(id) => updateParams({ lang: id, vs: null })}
          view={view}
          dark={dark}
        />

        {tree && (
          <AtlasLegend
            tree={tree}
            theme={theme}
            focus={focus && tree.isGroup(focus) ? focus : null}
            branches={branches}
            colorBy={showSimilarity ? 'similar' : 'family'}
            selected={selected}
            canShowSimilarity={Boolean(scores)}
            onFocus={focusGroup}
            onColorBy={(mode) => updateParams({ color: mode === 'similar' ? 'similar' : null })}
          />
        )}
      </div>

      <aside className="w-full shrink-0 overflow-y-auto border-t border-gray-200 bg-white md:w-[380px] md:border-t-0 md:border-l dark:border-white/10 dark:bg-[#0a0a0a]">
        <AtlasPanel
          atlas={atlas}
          selected={selected}
          words={words}
          prepared={prepared}
          scores={scores}
          compareId={compareId}
          showingSimilarity={Boolean(showSimilarity)}
          onSelect={(id) => updateParams({ lang: id, vs: null })}
          onCompare={(id) => updateParams({ vs: id })}
          onFocus={focusGroup}
          onShowSimilarity={() => updateParams({ color: 'similar' })}
        />
      </aside>
    </div>
  )
}
