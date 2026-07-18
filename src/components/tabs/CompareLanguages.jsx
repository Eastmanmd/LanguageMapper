import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import wordData from '../../data/wordComparison.json'
import PhylogeneticTree from './PhylogeneticTree'
import MultiLanguagePicker from '../MultiLanguagePicker'
import FlagWordModal from '../contribute/FlagWordModal'
import { FlagIcon } from '../icons'
import { languageSimilarity, buildTree } from '../../utils/phylogenetics'

const LANGUAGE_OPTIONS = Object.entries(wordData.languages)
  .map(([id, lang]) => ({ id, name: lang.name }))
  .sort((a, b) => a.name.localeCompare(b.name))
const WORD_IDS = wordData.words.map((w) => w.id)

// Classification levels get progressively deeper; used both to label the
// "color by" selector and to pick which segment of the path drives grouping.
const LEVEL_NAMES = ['Family', 'Subfamily', 'Branch', 'Sub-branch', 'Group', 'Subgroup']

// Distinguishable palette that reads on both light and dark backgrounds.
const GROUP_COLORS = [
  '#2563eb',
  '#f97316',
  '#16a34a',
  '#9333ea',
  '#dc2626',
  '#0d9488',
  '#db2777',
  '#ca8a04',
]

const classificationPath = (id) =>
  wordData.languages[id]?.classification?.split(' > ').map((s) => s.trim()) ?? []

// The grouping value for a language at a given depth. If the language's
// classification is shallower than the chosen level, fall back to its
// deepest segment so it still groups sensibly rather than dropping out.
const groupAtLevel = (id, level) => {
  const path = classificationPath(id)
  if (path.length === 0) return null
  return path[Math.min(level, path.length - 1)]
}

export default function CompareLanguages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [colorLevel, setColorLevel] = useState(0)
  const [flagTarget, setFlagTarget] = useState(null)

  const selected = useMemo(() => {
    const raw = searchParams.get('langs')
    if (!raw) return []
    return raw.split(',').filter((id) => wordData.languages[id])
  }, [searchParams])

  const updateSelected = (next) => {
    const params = new URLSearchParams(searchParams)
    if (next.length > 0) params.set('langs', next.join(','))
    else params.delete('langs')
    setSearchParams(params)
  }

  const handleAdd = (id) => updateSelected([...selected, id])
  const handleRemove = (id) => updateSelected(selected.filter((x) => x !== id))

  const tree = useMemo(() => {
    if (selected.length < 2) return null
    const distanceCache = new Map()
    const distance = (a, b) => {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`
      if (distanceCache.has(key)) return distanceCache.get(key)
      const sim = languageSimilarity(
        wordData.languages[a].words,
        wordData.languages[b].words,
        WORD_IDS,
      )
      const d = sim === null ? 1 : 1 - sim
      distanceCache.set(key, d)
      return d
    }
    return buildTree(selected, distance)
  }, [selected])

  const labelOf = (id) => wordData.languages[id]?.name ?? id

  // The deepest classification among selected languages bounds how many
  // levels the "color by" selector can offer.
  const maxLevels = useMemo(
    () => Math.max(1, ...selected.map((id) => classificationPath(id).length)),
    [selected],
  )
  const effectiveLevel = Math.min(colorLevel, maxLevels - 1)

  // Map each distinct classification group (at the chosen level) to a color,
  // assigning palette entries in the order groups first appear.
  const colorByGroup = useMemo(() => {
    const map = new Map()
    for (const id of selected) {
      const group = groupAtLevel(id, effectiveLevel)
      if (group && !map.has(group)) {
        map.set(group, GROUP_COLORS[map.size % GROUP_COLORS.length])
      }
    }
    return map
  }, [selected, effectiveLevel])

  const colorOf = (id) => colorByGroup.get(groupAtLevel(id, effectiveLevel)) ?? null
  const annotationOf = (id) => groupAtLevel(id, effectiveLevel)

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 md:px-10">
      <h1 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-white">
        Compare languages
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        Search and add two or more languages to compare 20+ basic words (numbers
        one to ten, plus everyday words) side by side, and see a tree built from
        how similar those words are across the languages you pick.
      </p>

      <div className="mt-6">
        <MultiLanguagePicker
          languageOptions={LANGUAGE_OPTIONS}
          selectedIds={selected}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>

      {selected.length < 2 ? (
        <p className="mt-10 text-sm text-gray-400 dark:text-gray-500">
          Select two or more languages above to see the comparison.
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Similarity tree
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Built by comparing the spelling of these words across your
                  selected languages (closer word forms cluster together first).
                  Annotations on the right show each language's classification;
                  this is a simple lexical-similarity illustration, not a
                  rigorous historical-linguistic classification.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                Color by
                <select
                  value={effectiveLevel}
                  onChange={(e) => setColorLevel(Number(e.target.value))}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-white/15 dark:bg-white/5 dark:text-white"
                >
                  {Array.from({ length: maxLevels }, (_, level) => (
                    <option key={level} value={level}>
                      {LEVEL_NAMES[level] ?? `Level ${level + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6">
              <PhylogeneticTree
                tree={tree}
                labelOf={labelOf}
                colorOf={colorOf}
                annotationOf={annotationOf}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-500 dark:border-white/10 dark:text-gray-400">
                    English
                  </th>
                  {selected.map((id) => (
                    <th
                      key={id}
                      className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-900 dark:border-white/10 dark:text-white"
                    >
                      {labelOf(id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wordData.words.map((word) => (
                  <tr key={word.id} className="odd:bg-gray-50/60 dark:odd:bg-white/[0.03]">
                    <td className="px-3 py-2 capitalize text-gray-500 dark:text-gray-400">
                      {word.en}
                    </td>
                    {selected.map((id) => {
                      const value = wordData.languages[id].words[word.id]
                      return (
                        <td
                          key={id}
                          className={`group px-3 py-2 ${
                            value
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {value ?? '—'}
                            <button
                              onClick={() =>
                                setFlagTarget({
                                  languageId: id,
                                  languageName: labelOf(id),
                                  wordId: word.id,
                                  wordEn: word.en,
                                  currentValue: value ?? null,
                                })
                              }
                              title={value ? 'Suggest a correction' : 'Suggest this word'}
                              className="text-gray-300 opacity-0 transition-opacity hover:text-blue-600 focus:opacity-100 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-blue-400"
                            >
                              <FlagIcon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Spot a mistake or a missing word? Hover over a cell and click the
              flag to suggest a change — suggestions are reviewed before going
              live.
            </p>
          </div>
        </div>
      )}

      {flagTarget && (
        <FlagWordModal target={flagTarget} onClose={() => setFlagTarget(null)} />
      )}
    </div>
  )
}
