import { useState, useEffect } from 'react'
import languages from '../data/languages.json'
import stateLanguages from '../data/stateLanguages.json'
import LanguageProfile from './LanguageProfile'

export default function InfoPanel({ selectedStateId, selectedStateName }) {
  const [activeLanguageId, setActiveLanguageId] = useState(null)

  useEffect(() => {
    setActiveLanguageId(null)
  }, [selectedStateId])

  if (!selectedStateId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Click a state on the map to see the languages spoken there.
      </div>
    )
  }

  const languageIds = stateLanguages[selectedStateId] ?? []
  const activeLanguage = activeLanguageId ? languages[activeLanguageId] : null

  if (activeLanguage) {
    return (
      <div className="p-5">
        <LanguageProfile
          language={activeLanguage}
          onSelectLanguage={setActiveLanguageId}
          onBack={() => setActiveLanguageId(null)}
        />
      </div>
    )
  }

  return (
    <div className="p-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedStateName}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {languageIds.length} language{languageIds.length === 1 ? '' : 's'} shown for this state
      </p>

      <ul className="mt-4 space-y-2">
        {languageIds.map((id) => {
          const lang = languages[id]
          if (!lang) return null
          return (
            <li key={id}>
              <button
                onClick={() => setActiveLanguageId(id)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:border-naija-300 hover:bg-naija-50 dark:border-white/10 dark:hover:border-naija-400/40 dark:hover:bg-naija-500/10"
              >
                <span className="font-medium text-gray-900 dark:text-white">{lang.name}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {lang.ethnicGroups.join(', ')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
        Note: this list highlights major languages associated with the state and is not
        an exhaustive linguistic census.
      </p>
    </div>
  )
}
