import { useState } from 'react'
import { CATEGORICAL, FADED, OTHER, SIMILARITY } from '../utils/atlasColors'
import { SIMILARITY_BANDS } from '../utils/similarity'
import { SPOKEN_NOTE } from '../utils/atlasTree'
import LanguageSearch from './LanguageSearch'

function Swatch({ color }) {
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

export default function AtlasLegend({
  tree,
  theme,
  focus,
  branches,
  colorBy,
  selected,
  canShowSimilarity,
  spoken,
  spokenChoices,
  onFocus,
  onColorBy,
  onSpoken,
  onSelectCountry,
}) {
  // Starts collapsed on phones, where the open legend would cover most of the map.
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  const colored = branches.filter((b) => b.slot != null)
  const folded = branches.filter((b) => b.slot == null)
  // Single-child links and repeated names (Afro-Asiatic › Afro-Asiatic) add
  // nothing to click on, so they're left out.
  const trail = focus
    ? tree
        .lineage(tree.skipSingleChild(focus))
        .filter((id, i, path) => tree.skipSingleChild(id) === id && tree.name(id) !== tree.name(path[i - 1]))
    : []

  return (
    <div className="absolute bottom-4 left-4 z-10 w-[260px] max-w-[calc(100%-2rem)] rounded-lg border border-gray-200 bg-white/95 text-xs text-gray-600 shadow-lg backdrop-blur dark:border-white/15 dark:bg-black/85 dark:text-gray-300">
      <div className="flex border-b border-gray-200 p-1 dark:border-white/10">
        {[
          ['family', 'Families'],
          ['similar', 'Similarity'],
          ['countries', 'Countries'],
        ].map(([mode, label]) => {
          const disabled = mode === 'similar' && !canShowSimilarity
          return (
            <button
              key={mode}
              disabled={disabled}
              title={disabled ? 'Pick a language with a word list first' : undefined}
              onClick={() => onColorBy(mode)}
              className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
                colorBy === mode
                  ? 'bg-naija-50 text-naija-700 dark:bg-naija-500/15 dark:text-naija-300'
                  : 'text-gray-500 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          )
        })}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Hide legend' : 'Show legend'}
          aria-expanded={open}
          className="px-2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          {open ? '▾' : '▴'}
        </button>
      </div>

      {!open ? null : colorBy === 'countries' ? (
        <div className="p-3">
          {/* Keyed so the box empties after a pick; the name shows below it. */}
          <LanguageSearch
            key={spoken?.id ?? 'none'}
            languageOptions={spokenChoices}
            selectedLanguage={null}
            onSelect={onSpoken}
            onClear={() => {}}
            placeholder={spoken ? 'Search another…' : 'Language or family…'}
            dropUp
          />
          {spoken ? (
            <>
              <div className="mt-3 flex items-start gap-2">
                <span className="mt-1">
                  <Swatch color={spoken.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Where {spoken.name} is spoken</p>
                  <p className="text-gray-400 dark:text-gray-500">
                    {spoken.rows.length} {spoken.rows.length === 1 ? 'country' : 'countries'} coloured
                    {spoken.isGroup && ` · ${tree.count(spoken.id).toLocaleString('en-US')} languages`}
                  </p>
                </div>
                <button
                  onClick={() => onSpoken(null)}
                  aria-label={`Stop colouring countries for ${spoken.name}`}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  ×
                </button>
              </div>
              <ul className="mt-2 max-h-[20vh] space-y-0.5 overflow-y-auto">
                {spoken.rows.map(({ code, name, count }) => (
                  <li key={code}>
                    <button
                      onClick={() => onSelectCountry(code)}
                      title={`Zoom to ${name}`}
                      className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <span className="flex-1 truncate">{name}</span>
                      {spoken.isGroup && (
                        <span className="tabular-nums text-gray-400 dark:text-gray-500">{count}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {spoken.elsewhere.length > 0 && (
                <p className="mt-2 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  Also listed, outside the outlines on this map: {spoken.elsewhere.join(', ')}.
                </p>
              )}
              <p className="mt-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">{SPOKEN_NOTE}</p>
            </>
          ) : (
            <>
              <p className="mb-1 mt-3 leading-snug">Colour every country where a language or family is spoken.</p>
              <ul className="space-y-0.5">
                {tree.branches(null).map((branch, i) => (
                  <li key={branch.id}>
                    <button
                      onClick={() => onSpoken(tree.lineage(branch.id)[0])}
                      className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <Swatch color={CATEGORICAL[theme][i]} />
                      <span className="flex-1 truncate">{branch.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : colorBy === 'similar' ? (
        <div className="p-3">
          <p className="mb-2 font-medium text-gray-900 dark:text-white">
            How similar are their basic words to {selected.n}?
          </p>
          <ul className="space-y-1">
            {SIMILARITY_BANDS.map((band, i) => (
              <li key={band.label} className="flex items-center gap-2">
                <Swatch color={SIMILARITY[theme][i] ?? FADED[theme]} />
                {band.label}
              </li>
            ))}
            <li className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <Swatch color={FADED[theme]} />
              No word list to compare
            </li>
          </ul>
        </div>
      ) : (
        <div className="p-3">
          <nav className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <button
              onClick={() => onFocus(null)}
              className={focus ? 'text-naija-700 hover:underline dark:text-naija-400' : 'font-medium text-gray-900 dark:text-white'}
            >
              All of Africa
            </button>
            {trail.map((id, i) => (
              <span key={id} className="flex items-center gap-1">
                <span className="text-gray-400">›</span>
                <button
                  onClick={() => onFocus(id)}
                  className={
                    i === trail.length - 1
                      ? 'font-medium text-gray-900 dark:text-white'
                      : 'text-naija-700 hover:underline dark:text-naija-400'
                  }
                >
                  {tree.name(id)}
                </button>
              </span>
            ))}
          </nav>
          <ul className="max-h-[30vh] space-y-0.5 overflow-y-auto md:max-h-[40vh]">
            {colored.map((branch) => {
              const isGroup = tree.isGroup(branch.id)
              return (
                <li key={branch.id}>
                  <button
                    disabled={!isGroup}
                    onClick={() => onFocus(branch.id)}
                    title={isGroup ? `Zoom into ${branch.name}` : undefined}
                    className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left enabled:hover:bg-gray-100 dark:enabled:hover:bg-white/10"
                  >
                    <Swatch color={CATEGORICAL[theme][branch.slot]} />
                    <span className="flex-1 truncate">{branch.name}</span>
                    <span className="tabular-nums text-gray-400 dark:text-gray-500">{branch.count}</span>
                    {isGroup && <span className="text-gray-400">›</span>}
                  </button>
                </li>
              )
            })}
            {folded.length > 0 && (
              <li className="flex items-center gap-2 px-1 py-0.5">
                <Swatch color={OTHER[theme]} />
                <span className="flex-1">
                  {folded.length} smaller group{folded.length === 1 ? '' : 's'}
                </span>
                <span className="tabular-nums text-gray-400 dark:text-gray-500">
                  {folded.reduce((sum, b) => sum + b.count, 0)}
                </span>
              </li>
            )}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
            {focus ? 'Click a group to zoom in.' : 'Click a family to see its branches.'}
          </p>
          {focus && (
            <button
              onClick={() => onSpoken(focus)}
              className="mt-1 text-left text-[11px] text-naija-700 hover:underline dark:text-naija-400"
            >
              Colour the countries where {tree.name(focus)} is spoken
            </button>
          )}
        </div>
      )}
    </div>
  )
}
