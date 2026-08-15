import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MapView from '../MapView'
import InfoPanel from '../InfoPanel'
import LanguageSearch from '../LanguageSearch'
import languages from '../../data/languages.json'
import stateLanguages from '../../data/stateLanguages.json'
import { useTheme } from '../../context/ThemeContext'

const LANGUAGE_OPTIONS = Object.values(languages)
  .map((lang) => ({ id: lang.id, name: lang.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

export default function MapExplorer() {
  const { stateId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { dark } = useTheme()
  const [stateNames, setStateNames] = useState({})

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/nigeria-states.geojson`)
      .then((res) => res.json())
      .then((geojson) => {
        const names = {}
        for (const feature of geojson.features) {
          names[feature.properties.state_id] = feature.properties.name
        }
        setStateNames(names)
      })
      .catch(() => {})
  }, [])

  const searchedLanguageId = searchParams.get('lang')

  const handleSelectState = (id) => {
    navigate({ pathname: `/map/${id}`, search: searchParams.toString() })
  }

  const handleSelectLanguage = (id) => {
    const next = new URLSearchParams(searchParams)
    next.set('lang', id)
    setSearchParams(next)
  }

  const handleClearLanguage = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('lang')
    setSearchParams(next)
  }

  const highlightedStateIds = useMemo(() => {
    if (!searchedLanguageId) return []
    return Object.entries(stateLanguages)
      .filter(([, langIds]) => langIds.includes(searchedLanguageId))
      .map(([id]) => id)
  }, [searchedLanguageId])

  const searchedLanguage = searchedLanguageId ? languages[searchedLanguageId] : null
  const selectedStateName = stateId ? (stateNames[stateId] ?? null) : null

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <div className="relative min-h-[45vh] flex-1 md:min-h-0">
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-col items-start gap-2 md:right-auto">
          <div className="pointer-events-auto w-full max-w-sm">
            <LanguageSearch
              languageOptions={LANGUAGE_OPTIONS}
              selectedLanguage={searchedLanguageId}
              onSelect={handleSelectLanguage}
              onClear={handleClearLanguage}
            />
          </div>
          {searchedLanguage && (
            <div className="pointer-events-auto max-w-sm rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-lg backdrop-blur dark:border-white/15 dark:bg-black/80 dark:text-gray-300">
              {highlightedStateIds.length > 0 ? (
                <>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {searchedLanguage.name}
                  </span>{' '}
                  is spoken in {highlightedStateIds.length} state
                  {highlightedStateIds.length === 1 ? '' : 's'}:{' '}
                  {highlightedStateIds
                    .map((id) => stateNames[id] ?? id)
                    .sort()
                    .join(', ')}
                </>
              ) : (
                <>No states found for {searchedLanguage.name}.</>
              )}
            </div>
          )}
        </div>
        <MapView
          selectedStateId={stateId ?? null}
          onSelectState={handleSelectState}
          highlightedStateIds={highlightedStateIds}
          dark={dark}
        />
      </div>
      <aside className="w-full shrink-0 overflow-y-auto border-t border-gray-200 bg-white md:w-[340px] md:border-t-0 md:border-l dark:border-white/10 dark:bg-[#0a0a0a]">
        <InfoPanel selectedStateId={stateId ?? null} selectedStateName={selectedStateName} />
      </aside>
    </div>
  )
}
