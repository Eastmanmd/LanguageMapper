import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AtlasMap from '../AtlasMap'
import AtlasLegend from '../AtlasLegend'
import AtlasPanel from '../AtlasPanel'
import LanguageSearch from '../LanguageSearch'
import { buildTree } from '../../utils/atlasTree'
import { lexicalSimilarity, prepareWordList, SIMILARITY_BANDS } from '../../utils/similarity'
import { CATEGORICAL, FADED, OTHER, SIMILARITY } from '../../utils/atlasColors'
import { boundsOf, countryName } from '../../utils/countries'
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
  const countryParam = searchParams.get('country')
  const country = atlas && countryParam in atlas.countries ? countryParam : null
  const inCountry = (lang) => !country || lang.c.includes(country)

  // Natural Earth's box where there is one; Réunion and Mayotte frame their dots.
  const countryBounds = (code) =>
    atlas.countries[code] ?? boundsOf(atlas.languages.filter((l) => l.c.includes(code)))

  const selectCountry = (code) => {
    updateParams({ country: code })
    setView(code ? { bounds: countryBounds(code) } : { name: 'africa' })
  }

  // Drilling into a group also frames its languages on the map (within the
  // chosen country, when it has any there).
  const focusGroup = (id) => {
    updateParams({ focus: id, color: null })
    if (!id) {
      setView(country ? { bounds: countryBounds(country) } : { name: 'africa' })
      return
    }
    const members = atlas.languages.filter((l) => tree.lineage(l.p).includes(id))
    const local = members.filter(inCountry)
    if (members.length) setView({ bounds: boundsOf(local.length ? local : members) })
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

  // A shared ?country= link opens framed on that country.
  useEffect(() => {
    if (country) setView({ bounds: countryBounds(country) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas])

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

  // Colour slots come from the Africa-wide ranking so a family keeps its colour
  // when the country changes; counts (and which groups are listed) follow the country.
  const branches = useMemo(() => {
    if (!tree) return []
    const all = tree.branches(focus && tree.isGroup(focus) ? focus : null).map((branch, i) => ({
      ...branch,
      slot: i < MAX_COLORED_BRANCHES ? i : null,
    }))
    if (!country) return all
    const counts = new Map()
    for (const lang of atlas.languages) {
      if (!lang.c.includes(country)) continue
      for (const id of [...tree.lineage(lang.p), lang.g]) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    return all
      .map((branch) => ({ ...branch, count: counts.get(branch.id) ?? 0 }))
      .filter((branch) => branch.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [atlas, tree, focus, country])

  const showSimilarity = colorBy === 'similar' && scores
  const mapData = useMemo(() => {
    if (!atlas) return { type: 'FeatureCollection', features: [] }
    const branchIds = new Set(branches.map((b) => b.id))
    const branchById = new Map(branches.map((b) => [b.id, b]))
    const features = atlas.languages.map((lang) => {
      let color
      let label
      let emph = 1
      if (!inCountry(lang)) {
        color = FADED[theme]
        label = `Not listed for ${countryName(country)}`
        emph = 0
      } else if (showSimilarity) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas, tree, branches, showSimilarity, scores, selected, selectedId, theme, country])

  const languageOptions = useMemo(
    () =>
      (atlas?.languages ?? [])
        .map((l) => ({ id: l.g, name: l.n }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [atlas],
  )

  const countryOptions = useMemo(() => {
    if (!atlas) return []
    return Object.keys(atlas.countries)
      .map((code) => {
        const count = atlas.languages.filter((l) => l.c.includes(code)).length
        return { id: code, name: countryName(code), detail: `${count} language${count === 1 ? '' : 's'}` }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [atlas])

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
          <div className="pointer-events-auto w-full max-w-[13rem]">
            <LanguageSearch
              key={atlas ? 'ready' : 'loading'}
              languageOptions={countryOptions}
              selectedLanguage={country}
              onSelect={selectCountry}
              onClear={() => selectCountry(null)}
              placeholder="All countries"
              browsable
              clearLabel="Show all countries"
            />
          </div>
        </div>

        <AtlasMap
          data={mapData}
          selectedId={selectedId}
          onSelect={(id) => updateParams({ lang: id, vs: null })}
          view={view}
          dark={dark}
          country={country}
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
          country={country}
          theme={theme}
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
