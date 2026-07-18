// Shared form primitives for the contribution and admin forms, styled to
// match the app's existing inputs.

export const inputClass =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500'

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
      {hint && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}

// Invisible to humans, autofilled by naive bots; submissions with this field
// set are dropped client-side.
export function HoneypotField({ value, onChange }) {
  return (
    <input
      type="text"
      name="website"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -left-[9999px] h-0 w-0 opacity-0"
    />
  )
}

export function ContributorFields({ form, setForm }) {
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Your name" hint="optional">
        <input className={inputClass} value={form.contributorName} onChange={set('contributorName')} />
      </Field>
      <Field label="Email" hint="optional — in case we have questions">
        <input className={inputClass} type="email" value={form.contributorContact} onChange={set('contributorContact')} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Source" hint="optional — dictionary, publication, or “native speaker”">
          <input className={inputClass} value={form.source} onChange={set('source')} />
        </Field>
      </div>
    </div>
  )
}

export function SubmitStatus({ status }) {
  if (!status) return null
  if (status === 'sending') {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Submitting…</p>
  }
  if (status === 'created' || status === 'merged') {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">
        {status === 'merged'
          ? 'Thanks — someone made the same suggestion, so we added your voice to it. It is awaiting review.'
          : 'Thanks — your suggestion was sent for review.'}
      </p>
    )
  }
  return <p className="text-sm text-red-600 dark:text-red-400">{status}</p>
}

export function NotConfiguredNotice() {
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
      Community submissions are not configured on this deployment. Set
      VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable them.
    </p>
  )
}
