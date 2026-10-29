import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import nigeriaLanguages from '../data/languages.json'
import nigeriaGlottocodes from '../data/nigeriaGlottocodes.json'
import wordComparison from '../data/wordComparison.json'
import { lookAlikeWords, similarityBand } from '../utils/similarity'
import { countryName } from '../utils/countries'

// Glottolog's agglomerated endangerment scale, in plain words.
const ENDANGERMENT = [
  { label: 'Not endangered', tone: 'naija' },
  { label: 'Threatened', tone: 'ankara' },
  { label: 'Shifting: fewer children are learning it', tone: 'ankara' },
  { label: 'Moribund: spoken mostly by older people', tone: 'red' },
  { label: 'Nearly extinct', tone: 'red' },
  { label: 'Extinct', tone: 'gray' },
]
const TONES = {
  naija: 'bg-naija-50 text-naija-700 dark:bg-naija-500/10 dark:text-naija-300',
  ankara: 'bg-ankara-50 text-ankara-800 dark:bg-ankara-500/10 dark:text-ankara-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  gray: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
}

// Glottocode → the Nigeria profiles (several dialect profiles can share one language).
const NIGERIA_PROFILES = new Map()
for (const [appId, g] of Object.entries(nigeriaGlottocodes)) {
  if (!NIGERIA_PROFILES.has(g)) NIGERIA_PROFILES.set(g, [])
  NIGERIA_PROFILES.get(g).push(nigeriaLanguages[appId])
}

const RELATIVES_SHOWN = 8

function SectionTitle({ children }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </h3>
  )
}

function Intro({ atlas, country }) {
  const shown = atlas ? atlas.languages.filter((l) => !country || l.c.includes(country)) : []
  const withWords = shown.filter((l) => l.w).length
  return (
    <div className="space-y-5 p-5 text-sm text-gray-700 dark:text-gray-300">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Languages of {country ? countryName(country) : 'Africa'}
        </h2>
        {country ? (
          <p className="mt-1 leading-relaxed">
            Every highlighted dot is a language spoken in {countryName(country)}. Each language has one
            dot, at the centre of the whole area where it's spoken, so a language that crosses a border
            can sit just outside it.
          </p>
        ) : (
          <p className="mt-1 leading-relaxed">
            Every dot is a language, placed where it is spoken. Africa is home to around a third of the
            world's languages.
          </p>
        )}
      </div>

      {atlas && (
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
            <dt className="text-xs text-gray-500 dark:text-gray-400">Languages mapped</dt>
            <dd className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {shown.length.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-white/10">
            <dt className="text-xs text-gray-500 dark:text-gray-400">With word lists</dt>
            <dd className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {withWords.toLocaleString()}
            </dd>
          </div>
        </dl>
      )}

      <div>
        <SectionTitle>How to explore</SectionTitle>
        <ol className="list-decimal space-y-1.5 pl-4 leading-relaxed">
          <li>The colours show language families. Click a family in the legend to see its branches.</li>
          <li>Pick a country next to the search box to zoom in and fade out languages spoken elsewhere.</li>
          <li>Click a dot, or search, to open a language.</li>
          <li>
            Switch the legend to <strong>Similarity</strong> to colour every language by how much its basic
            words resemble the one you picked.
          </li>
        </ol>
      </div>

      <div>
        <SectionTitle>About the families</SectionTitle>
        <p className="leading-relaxed">
          The top level uses the four groups most people learn: Niger-Congo, Afro-Asiatic, Nilo-Saharan
          and Khoisan. Linguists agree Afro-Asiatic is one family. The other three are older proposals
          that bring together families whose relationship hasn't been proven. Below the top level,
          every grouping follows Glottolog.
        </p>
      </div>

      <Sources atlas={atlas} />
    </div>
  )
}

function Sources({ atlas }) {
  if (!atlas) return null
  return (
    <div className="border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-500 dark:border-white/10 dark:text-gray-400">
      <SectionTitle>Data</SectionTitle>
      <ul className="space-y-1">
        {atlas.sources.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  )
}

function WordComparison({ concepts, a, b, nameA, nameB, alike }) {
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-gray-500 dark:text-gray-400">
        <tr>
          <th className="py-1 pr-2 font-medium">Meaning</th>
          <th className="py-1 pr-2 font-medium">{nameA}</th>
          <th className="py-1 font-medium">{nameB}</th>
        </tr>
      </thead>
      <tbody>
        {concepts.map((c, i) =>
          a.i[i] || b.i[i] ? (
            <tr
              key={c.id}
              className={`border-t border-gray-100 dark:border-white/5 ${alike[i] ? 'bg-naija-50/70 dark:bg-naija-500/10' : ''}`}
            >
              <td className="py-1 pr-2 text-gray-500 dark:text-gray-400">{c.en}</td>
              <td className="py-1 pr-2 font-mono text-gray-900 dark:text-white">{a.i[i] || '—'}</td>
              <td className="py-1 font-mono text-gray-900 dark:text-white">{b.i[i] || '—'}</td>
            </tr>
          ) : null,
        )}
      </tbody>
    </table>
  )
}

export default function AtlasPanel({
  atlas,
  country,
  selected,
  words,
  prepared,
  scores,
  compareId,
  showingSimilarity,
  onSelect,
  onCompare,
  onFocus,
  onShowSimilarity,
}) {
  const tree = atlas?.tree

  const relatives = useMemo(() => {
    if (!scores) return []
    return [...scores]
      .filter(([, s]) => s != null)
      .sort((x, y) => y[1] - x[1])
      .slice(0, RELATIVES_SHOWN)
      .map(([g, score]) => ({ lang: tree.byId.get(g), score }))
  }, [scores, tree])

  if (!selected) return <Intro atlas={atlas} country={country} />

  const lineage = tree.displayLineage(selected)
  // The profile named like the language leads; dialect profiles follow.
  const profiles = [...(NIGERIA_PROFILES.get(selected.g) ?? [])].sort(
    (a, b) => (b.name === selected.n) - (a.name === selected.n),
  )
  const comparable = profiles.filter((p) => wordComparison.languages[p.id])
  const ownWords = words?.words[selected.g]
  const compareLang = compareId ? tree.byId.get(compareId) : null
  const compareWords = compareLang && words?.words[compareLang.g]
  const compareScore = compareLang ? scores?.get(compareLang.g) : null
  const endangerment = ENDANGERMENT[selected.e]

  return (
    <div className="space-y-6 p-5 text-sm text-gray-700 dark:text-gray-300">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selected.n}</h2>
        {selected.c.length > 0 && (
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Spoken in {selected.c.map(countryName).join(', ')}
          </p>
        )}
        {endangerment && (
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[endangerment.tone]}`}>
            {endangerment.label}
          </span>
        )}
      </div>

      <div>
        <SectionTitle>Family tree</SectionTitle>
        <ol className="space-y-0.5">
          {lineage.map((id, depth) => (
            <li key={id} style={{ paddingLeft: `${Math.min(depth, 8) * 10}px` }}>
              <button
                onClick={() => onFocus(id)}
                title={`Show ${tree.name(id)} on the map`}
                className="text-left text-naija-700 hover:underline dark:text-naija-400"
              >
                {tree.name(id)}
              </button>
              <span className="ml-1.5 text-xs tabular-nums text-gray-400 dark:text-gray-500">{tree.count(id)}</span>
            </li>
          ))}
          <li
            style={{ paddingLeft: `${Math.min(lineage.length, 8) * 10}px` }}
            className="font-medium text-gray-900 dark:text-white"
          >
            {selected.n}
          </li>
        </ol>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Numbers show how many languages are in each group. Click a group to highlight it on the map.
        </p>
      </div>

      {profiles.length > 0 && (
        <div className="rounded-lg border border-naija-200 bg-naija-50/50 p-4 dark:border-naija-400/20 dark:bg-naija-500/5">
          <SectionTitle>From our Nigeria profiles</SectionTitle>
          {profiles.map((p) => (
            <div key={p.id} className="mb-3 last:mb-0">
              {profiles.length > 1 && <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>}
              <p className="leading-relaxed">{p.description}</p>
              {p.ethnicGroups.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Associated people: {p.ethnicGroups.join(', ')}
                </p>
              )}
            </div>
          ))}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <Link
              to={`/map?lang=${profiles[0].id}`}
              className="rounded-full bg-white px-3 py-1 text-naija-700 ring-1 ring-naija-200 hover:bg-naija-100 dark:bg-transparent dark:text-naija-300 dark:ring-naija-400/30"
            >
              See its Nigerian states
            </Link>
            {comparable.length > 0 && (
              <Link
                to={`/compare?langs=${comparable.map((p) => p.id).join(',')}`}
                className="rounded-full bg-white px-3 py-1 text-naija-700 ring-1 ring-naija-200 hover:bg-naija-100 dark:bg-transparent dark:text-naija-300 dark:ring-naija-400/30"
              >
                Compare words with other Nigerian languages
              </Link>
            )}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Closest relatives by basic words</SectionTitle>
        {!selected.w ? (
          <p className="text-gray-500 dark:text-gray-400">
            There's no basic word list for {selected.n} yet, so it can't be compared.
          </p>
        ) : !prepared ? (
          <p className="text-gray-500 dark:text-gray-400">Loading word lists…</p>
        ) : (
          <>
            {!showingSimilarity && (
              <button
                onClick={onShowSimilarity}
                className="mb-3 w-full rounded-lg bg-naija-600 px-3 py-2 text-sm font-medium text-white hover:bg-naija-700"
              >
                Colour the map by similarity to {selected.n}
              </button>
            )}
            <ul className="space-y-1">
              {relatives.map(({ lang, score }) => (
                <li key={lang.g}>
                  <button
                    onClick={() => onCompare(lang.g)}
                    className={`w-full rounded-md px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-white/5 ${
                      compareId === lang.g ? 'bg-gray-100 dark:bg-white/10' : ''
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium text-gray-900 dark:text-white">{lang.n}</span>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {similarityBand(score).label}
                      </span>
                    </span>
                    <span className="mt-1 block h-1 rounded-full bg-gray-100 dark:bg-white/10">
                      <span
                        className="block h-1 rounded-full bg-[#2a78d6] dark:bg-[#6da7ec]"
                        style={{ width: `${Math.round(score * 100)}%` }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Click a language to compare words side by side.
            </p>
          </>
        )}
      </div>

      {compareLang && ownWords && compareWords && (
        <div>
          <div className="mb-2 flex items-start justify-between gap-2">
            <SectionTitle>
              {selected.n} and {compareLang.n}
            </SectionTitle>
            <button
              onClick={() => onSelect(compareLang.g)}
              className="shrink-0 text-xs text-naija-700 hover:underline dark:text-naija-400"
            >
              Open {compareLang.n} →
            </button>
          </div>
          {compareScore != null && (
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{similarityBand(compareScore).label}.</strong>{' '}
              {similarityBand(compareScore).note}. Highlighted rows are words that look alike.
            </p>
          )}
          <WordComparison
            concepts={words.concepts}
            a={ownWords}
            b={compareWords}
            nameA={selected.n}
            nameB={compareLang.n}
            alike={lookAlikeWords(prepared.get(selected.g), prepared.get(compareLang.g))}
          />
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Words are written in the International Phonetic Alphabet, without tone marks.
          </p>
        </div>
      )}

      <p className="border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
        More about {selected.n} on{' '}
        <a
          href={`https://glottolog.org/resource/languoid/id/${selected.g}`}
          target="_blank"
          rel="noreferrer"
          className="text-naija-700 hover:underline dark:text-naija-400"
        >
          Glottolog
        </a>
        {selected.iso && (
          <>
            {' '}
            and{' '}
            <a
              href={`https://www.ethnologue.com/language/${selected.iso}/`}
              target="_blank"
              rel="noreferrer"
              className="text-naija-700 hover:underline dark:text-naija-400"
            >
              Ethnologue
            </a>
          </>
        )}
        .
      </p>
    </div>
  )
}
