import { useCallback, useEffect, useState } from 'react'
import languages from '../../data/languages.json'
import wordData from '../../data/wordComparison.json'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { fetchSubmissions, reviewSubmission } from '../../lib/submissions'
import { Field, NotConfiguredNotice, inputClass } from '../contribute/fields'

const TYPE_LABELS = {
  flag_word: 'Word correction',
  fill_words: 'Word list',
  new_language: 'New language',
}

const STATUS_TABS = ['pending', 'approved', 'rejected', 'applied']

const wordEn = (wordId) => wordData.words.find((w) => w.id === wordId)?.en ?? wordId

function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    setStatus(error ? error.message : 'sent')
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-white">Admin</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Sign in with a magic link to review submissions.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Send magic link
        </button>
        {status === 'sent' && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Check your inbox for the sign-in link.
          </p>
        )}
        {status && status !== 'sending' && status !== 'sent' && (
          <p className="text-sm text-red-600 dark:text-red-400">{status}</p>
        )}
      </form>
    </div>
  )
}

// Current vs suggested, shown side by side for a single word.
function WordDiff({ label, current, suggested }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
      <span className="w-20 shrink-0 capitalize text-gray-500 dark:text-gray-400">{label}</span>
      <span className={current ? 'text-red-600 line-through dark:text-red-400' : 'italic text-gray-400 dark:text-gray-500'}>
        {current || 'empty'}
      </span>
      <span className="text-gray-400">&rarr;</span>
      <span className="font-medium text-green-700 dark:text-green-400">{suggested}</span>
    </div>
  )
}

function SubmissionDetail({ submission }) {
  const { type, language_id: languageId, payload } = submission

  if (type === 'flag_word') {
    return (
      <WordDiff
        label={wordEn(payload.wordId)}
        current={wordData.languages[languageId]?.words?.[payload.wordId] ?? payload.currentValue}
        suggested={payload.suggestedValue}
      />
    )
  }

  if (type === 'fill_words') {
    const existing = wordData.languages[languageId]?.words ?? {}
    return (
      <div className="space-y-1">
        {Object.entries(payload.words).map(([wordId, value]) => (
          <WordDiff key={wordId} label={wordEn(wordId)} current={existing[wordId]} suggested={value} />
        ))}
      </div>
    )
  }

  // new_language
  return (
    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
      {payload.classification && <div><span className="text-gray-500 dark:text-gray-400">Classification:</span> {payload.classification}</div>}
      {payload.ethnicGroups?.length > 0 && (
        <div><span className="text-gray-500 dark:text-gray-400">Ethnic groups:</span> {payload.ethnicGroups.join(', ')}</div>
      )}
      {payload.states?.length > 0 && (
        <div><span className="text-gray-500 dark:text-gray-400">States:</span> {payload.states.join(', ')}</div>
      )}
      {payload.description && <p className="text-gray-600 dark:text-gray-400">{payload.description}</p>}
      {payload.words && Object.keys(payload.words).length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5 sm:grid-cols-3">
          {Object.entries(payload.words).map(([wordId, value]) => (
            <div key={wordId}>
              <span className="capitalize text-gray-500 dark:text-gray-400">{wordEn(wordId)}:</span>{' '}
              {value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ submission, onReviewed }) {
  const [rejectNote, setRejectNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const languageName =
    submission.type === 'new_language'
      ? submission.payload.name
      : (languages[submission.language_id]?.name ?? submission.language_id)

  const review = async (status, note = '') => {
    setBusy(true)
    setError(null)
    try {
      await reviewSubmission(submission.id, status, note)
      onReviewed()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          {TYPE_LABELS[submission.type]}
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{languageName}</span>
        {submission.dup_count > 1 && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            suggested by {submission.dup_count} people
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {new Date(submission.created_at).toLocaleString()}
        </span>
      </div>

      <div className="mt-3">
        <SubmissionDetail submission={submission} />
      </div>

      {(submission.note || submission.source || submission.contributor_name || submission.contributor_contact) && (
        <div className="mt-3 space-y-0.5 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
          {submission.note && <div>Note: {submission.note}</div>}
          {submission.source && <div>Source: {submission.source}</div>}
          {(submission.contributor_name || submission.contributor_contact) && (
            <div>
              From: {[submission.contributor_name, submission.contributor_contact].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      )}

      {submission.review_note && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Review note: {submission.review_note}
        </p>
      )}

      {submission.status === 'pending' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => review('approved')}
            disabled={busy}
            className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
          {rejecting ? (
            <>
              <input
                className={`${inputClass} w-56`}
                placeholder="Reason (optional)"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => review('rejected', rejectNote)}
                disabled={busy}
                className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm reject
              </button>
              <button
                onClick={() => setRejecting(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setRejecting(true)}
              disabled={busy}
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-gray-300 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/30"
            >
              Reject
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function Queue({ session }) {
  const [statusTab, setStatusTab] = useState('pending')
  const [submissions, setSubmissions] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setSubmissions(await fetchSubmissions(statusTab))
    } catch (err) {
      setError(err.message)
      setSubmissions([])
    }
  }, [statusTab])

  useEffect(() => {
    setSubmissions(null)
    load()
  }, [load])

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-white">
            Review submissions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Signed in as {session.user.email}. Approved items are applied to the
            data files by <code className="text-xs">npm run sync-data</code>.
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-gray-300 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/30"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              statusTab === tab
                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">
          {error} — if you signed in with a non-admin account, this is expected.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {submissions === null ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : submissions.length === 0 ? (
          !error && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No {statusTab} submissions.
            </p>
          )
        ) : (
          submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} onReviewed={load} />
          ))
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 md:px-10">
      {!isSupabaseConfigured ? (
        <NotConfiguredNotice />
      ) : session === undefined ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
      ) : session === null ? (
        <LoginForm />
      ) : (
        <Queue session={session} />
      )}
    </div>
  )
}
