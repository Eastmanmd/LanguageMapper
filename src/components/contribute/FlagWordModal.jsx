import { useState } from 'react'
import { submitSuggestion } from '../../lib/submissions'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Field,
  HoneypotField,
  ContributorFields,
  SubmitStatus,
  NotConfiguredNotice,
  inputClass,
} from './fields'

/**
 * Modal for flagging a single word in the comparison table — either
 * correcting an existing value or proposing one for an empty cell.
 * `target` is { languageId, languageName, wordId, wordEn, currentValue }.
 */
export default function FlagWordModal({ target, onClose }) {
  const [suggestedValue, setSuggestedValue] = useState('')
  const [note, setNote] = useState('')
  const [contrib, setContrib] = useState({ contributorName: '', contributorContact: '', source: '' })
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState(null)

  const isCorrection = Boolean(target.currentValue)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!suggestedValue.trim()) return
    setStatus('sending')
    try {
      const { result } = await submitSuggestion({
        type: 'flag_word',
        languageId: target.languageId,
        payload: {
          wordId: target.wordId,
          wordEn: target.wordEn,
          currentValue: target.currentValue ?? null,
          suggestedValue: suggestedValue.trim(),
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

  const done = status === 'created' || status === 'merged'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              {isCorrection ? 'Suggest a correction' : 'Suggest a word'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="capitalize">&ldquo;{target.wordEn}&rdquo;</span> in{' '}
              {target.languageName}
              {isCorrection && (
                <>
                  {' '}
                  &mdash; currently{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {target.currentValue}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mt-4">
            <NotConfiguredNotice />
          </div>
        ) : done ? (
          <div className="mt-4 space-y-4">
            <SubmitStatus status={status} />
            <button
              onClick={onClose}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative mt-4 space-y-4">
            <HoneypotField value={honeypot} onChange={setHoneypot} />
            <Field label={isCorrection ? 'Correct word' : 'Suggested word'}>
              <input
                className={inputClass}
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                maxLength={200}
                autoFocus
                required
              />
            </Field>
            <Field label="Why?" hint="optional">
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
                disabled={status === 'sending'}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Submit for review
              </button>
              <SubmitStatus status={status === 'sending' ? null : status} />
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
