import { useEffect, useMemo, useState } from 'react'
import languages from '../../data/languages.json'
import wordData from '../../data/wordComparison.json'
import { submitSuggestion } from '../../lib/submissions'
import { isSupabaseConfigured } from '../../lib/supabase'
import WordListEditor from '../contribute/WordListEditor'
import {
  Field,
  HoneypotField,
  ContributorFields,
  SubmitStatus,
  NotConfiguredNotice,
  inputClass,
} from '../contribute/fields'

const WORD_COUNT = wordData.words.length

const LANGUAGE_OPTIONS = Object.values(languages)
  .map((lang) => {
    const words = wordData.languages[lang.id]?.words ?? {}
    const filled = Object.values(words).filter(Boolean).length
    return { id: lang.id, name: lang.name, filled }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

function FillWordsForm() {
  const [languageId, setLanguageId] = useState('')
  const [values, setValues] = useState({})
  const [contrib, setContrib] = useState({ contributorName: '', contributorContact: '', source: '' })
  const [note, setNote] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState(null)

  const existing = useMemo(
    () => wordData.languages[languageId]?.words ?? {},
    [languageId],
  )

  const handleSelect = (id) => {
    setLanguageId(id)
    setValues(wordData.languages[id]?.words ?? {})
    setStatus(null)
  }

  // Only send entries that are new or changed — the reviewer sees a clean diff.
  const changedWords = useMemo(() => {
    const changed = {}
    for (const [wordId, value] of Object.entries(values)) {
      const trimmed = (value ?? '').trim()
      if (trimmed && trimmed !== (existing[wordId] ?? '')) changed[wordId] = trimmed
    }
    return changed
  }, [values, existing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!languageId || Object.keys(changedWords).length === 0) return
    setStatus('sending')
    try {
      const { result } = await submitSuggestion({
        type: 'fill_words',
        languageId,
        payload: {
          languageName: languages[languageId]?.name,
          words: changedWords,
        },
        note,
        honeypot,
        ...contrib,
      })
      setStatus(result)
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <Field label="Language">
        <select
          className={inputClass}
          value={languageId}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="">Choose a language…</option>
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
              {lang.filled > 0
                ? ` — ${lang.filled} of ${WORD_COUNT} words`
                : ' — no words yet'}
            </option>
          ))}
        </select>
      </Field>

      {languageId && (
        <>
          <WordListEditor values={values} onChange={setValues} existing={existing} />
          <Field label="Notes" hint="optional — dialect, spelling convention, anything the reviewer should know">
            <textarea
              className={inputClass}
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <ContributorFields
            form={contrib}
            setForm={(next) => setContrib({ ...contrib, ...next })}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === 'sending' || Object.keys(changedWords).length === 0}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Submit {Object.keys(changedWords).length || 'no'} word
              {Object.keys(changedWords).length === 1 ? '' : 's'} for review
            </button>
            <SubmitStatus status={status} />
          </div>
        </>
      )}
    </form>
  )
}

function NewLanguageForm() {
  const [form, setForm] = useState({
    name: '',
    classification: '',
    ethnicGroups: '',
    description: '',
  })
  const [states, setStates] = useState([])
  const [selectedStates, setSelectedStates] = useState([])
  const [words, setWords] = useState({})
  const [showWords, setShowWords] = useState(false)
  const [contrib, setContrib] = useState({ contributorName: '', contributorContact: '', source: '' })
  const [note, setNote] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState(null)

  // State names live in the boundary GeoJSON, which ships as a static asset.
  useEffect(() => {
    fetch('/data/nigeria-states.geojson')
      .then((res) => res.json())
      .then((geo) => {
        const list = geo.features
          .map((f) => ({ id: f.properties.state_id, name: f.properties.name }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setStates(list)
      })
      .catch(() => setStates([]))
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const toggleState = (id) =>
    setSelectedStates((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const cleanWords = {}
    for (const [wordId, value] of Object.entries(words)) {
      if ((value ?? '').trim()) cleanWords[wordId] = value.trim()
    }
    setStatus('sending')
    try {
      const { result } = await submitSuggestion({
        type: 'new_language',
        payload: {
          name: form.name.trim(),
          classification: form.classification.trim(),
          ethnicGroups: form.ethnicGroups
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          description: form.description.trim(),
          states: selectedStates,
          words: cleanWords,
        },
        note,
        honeypot,
        ...contrib,
      })
      setStatus(result)
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Language name">
          <input className={inputClass} value={form.name} onChange={set('name')} maxLength={200} required />
        </Field>
        <Field label="Classification" hint="e.g. Niger-Congo > Atlantic-Congo > Volta-Niger">
          <input className={inputClass} value={form.classification} onChange={set('classification')} maxLength={500} />
        </Field>
      </div>
      <Field label="Ethnic groups" hint="comma-separated">
        <input className={inputClass} value={form.ethnicGroups} onChange={set('ethnicGroups')} maxLength={500} />
      </Field>
      <Field label="Description" hint="where it's spoken, cultural or historical significance">
        <textarea className={inputClass} rows={3} maxLength={2000} value={form.description} onChange={set('description')} />
      </Field>

      {states.length > 0 && (
        <div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            States where it is spoken
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {states.map((state) => {
              const active = selectedStates.includes(state.id)
              return (
                <button
                  key={state.id}
                  type="button"
                  onClick={() => toggleState(state.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/30'
                  }`}
                >
                  {state.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowWords(!showWords)}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {showWords ? 'Hide word list' : `Add the ${WORD_COUNT}-word list (optional)`}
        </button>
        {showWords && (
          <div className="mt-4">
            <WordListEditor values={words} onChange={setWords} />
          </div>
        )}
      </div>

      <Field label="Notes" hint="optional">
        <textarea className={inputClass} rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <ContributorFields form={contrib} setForm={(next) => setContrib({ ...contrib, ...next })} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'sending' || !form.name.trim()}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Submit for review
        </button>
        <SubmitStatus status={status} />
      </div>
    </form>
  )
}

const MODES = [
  { id: 'fill', label: 'Fill in a word list' },
  { id: 'new', label: 'Add a new language' },
]

export default function Contribute() {
  const [mode, setMode] = useState('fill')

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 md:px-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-white">
          Contribute
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Help grow the map. Fill in missing words for a language you speak, or
          propose a language we haven&apos;t catalogued yet. Every submission is
          reviewed before it goes live. To correct a single word, you can also
          flag it directly in the comparison table.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-6">
            <NotConfiguredNotice />
          </div>
        )}

        <div className="mt-8 flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                mode === m.id
                  ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/30'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-8">{mode === 'fill' ? <FillWordsForm /> : <NewLanguageForm />}</div>
      </div>
    </div>
  )
}
