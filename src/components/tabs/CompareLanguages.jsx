import { useMemo, useState } from 'react'
import wordData from '../../data/wordComparison.json'
import PhylogeneticTree from './PhylogeneticTree'
import { languageSimilarity, buildTree } from '../../utils/phylogenetics'

const AVAILABLE = ['hausa', 'igbo', 'yoruba', 'fulfulde', 'edo', 'idoma']
const WORD_IDS = wordData.words.map((w) => w.id)

export default function CompareLanguages() {
  const [selected, setSelected] = useState([])

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

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

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 md:px-10">
      <h1 className="text-2xl font-medium tracking-tight text-gray-900">
        Compare languages
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
        Select two or more languages to compare 12 basic words side by side,
        and see a tree built from how similar those words are across the
        languages you pick.
      </p>

      <div className="language-chip-group mt-6 flex flex-wrap gap-2">
        {AVAILABLE.map((id) => {
          const active = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {labelOf(id)}
            </button>
          )
        })}
      </div>

      {selected.length < 2 ? (
        <p className="mt-10 text-sm text-gray-400">
          Select two or more languages above to see the comparison.
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-500">
                    English
                  </th>
                  {selected.map((id) => (
                    <th
                      key={id}
                      className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-900"
                    >
                      {labelOf(id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wordData.words.map((word) => (
                  <tr key={word.id} className="odd:bg-gray-50/60">
                    <td className="px-3 py-2 capitalize text-gray-500">
                      {word.en}
                    </td>
                    {selected.map((id) => {
                      const value = wordData.languages[id].words[word.id]
                      return (
                        <td
                          key={id}
                          className={`px-3 py-2 ${
                            value ? 'text-gray-900' : 'text-gray-300'
                          }`}
                        >
                          {value ?? '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Similarity tree
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Built by comparing the spelling of these 12 words across your
              selected languages (closer word forms cluster together first).
              This is a simple lexical-similarity illustration, not a
              rigorous historical-linguistic classification.
            </p>
            <div className="mt-6">
              <PhylogeneticTree tree={tree} labelOf={labelOf} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
