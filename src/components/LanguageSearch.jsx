import { useEffect, useMemo, useState } from 'react'

export default function LanguageSearch({
  languageOptions,
  selectedLanguage,
  onSelect,
  onClear,
  placeholder = 'Search a language…',
  browsable = false,
  clearLabel = 'Clear search',
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const lang = selectedLanguage ? languageOptions.find((l) => l.id === selectedLanguage) : null
    setQuery(lang ? lang.name : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    // A browsable list (a few dozen countries) opens in full; long lists wait for typing.
    if (!q) return browsable ? languageOptions : []
    const found = languageOptions.filter((lang) => lang.name.toLowerCase().includes(q))
    return browsable ? found : found.slice(0, 8)
  }, [query, languageOptions, browsable])

  const handleSelect = (lang) => {
    setQuery(lang.name)
    setIsOpen(false)
    onSelect(lang.id)
  }

  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    onClear()
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-naija-400 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-naija-400"
        />
        {(query || selectedLanguage) && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={clearLabel}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-[#141414]">
          {matches.map((lang) => (
            <li key={lang.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(lang)}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-naija-50 hover:text-naija-700 dark:text-gray-300 dark:hover:bg-naija-500/10 dark:hover:text-naija-400"
              >
                {lang.name}
                {lang.detail && (
                  <span className="float-right text-xs text-gray-400 dark:text-gray-500">{lang.detail}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query && matches.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-lg dark:border-white/15 dark:bg-[#141414] dark:text-gray-500">
          No matches for "{query}"
        </div>
      )}
    </div>
  )
}
