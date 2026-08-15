import { useMemo, useState } from 'react'

export default function MultiLanguagePicker({ languageOptions, selectedIds, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const matches = useMemo(() => {
    const pool = languageOptions.filter((lang) => !selectedIds.includes(lang.id))
    const q = query.trim().toLowerCase()
    if (!q) return pool.slice(0, 8)
    return pool.filter((lang) => lang.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query, languageOptions, selectedIds])

  const handleAdd = (lang) => {
    setQuery('')
    setIsOpen(false)
    onAdd(lang.id)
  }

  return (
    <div>
      <div className="relative w-full max-w-sm">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          placeholder="Add a language…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-naija-400 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-naija-400"
        />

        {isOpen && matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-[#141414]">
            {matches.map((lang) => (
              <li key={lang.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAdd(lang)}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-naija-50 hover:text-naija-700 dark:text-gray-300 dark:hover:bg-naija-500/10 dark:hover:text-naija-400"
                >
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {isOpen && query && matches.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-lg dark:border-white/15 dark:bg-[#141414] dark:text-gray-500">
            No languages match "{query}"
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {selectedIds.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No languages selected yet — search above to add some.
          </p>
        )}
        {selectedIds.map((id) => {
          const lang = languageOptions.find((l) => l.id === id)
          return (
            <span
              key={id}
              className="flex items-center gap-1.5 rounded-full border border-naija-600 bg-naija-600 py-2 pl-4 pr-2 text-sm font-medium text-white dark:border-naija-500 dark:bg-naija-500"
            >
              {lang?.name ?? id}
              <button
                type="button"
                onClick={() => onRemove(id)}
                aria-label={`Remove ${lang?.name ?? id}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white"
              >
                ×
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}
