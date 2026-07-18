import { supabase } from './supabase'

// Thin wrappers around the Supabase RPC and admin queries. All submission
// writes go through the submit_suggestion RPC, which re-validates,
// rate-limits, and dedupes server-side.

/**
 * Submit a suggestion. `type` is 'flag_word' | 'fill_words' | 'new_language'.
 * Returns { result: 'created' | 'merged', id } or throws with a message
 * suitable for showing to the user.
 */
export async function submitSuggestion({
  type,
  languageId = null,
  payload,
  contributorName = '',
  contributorContact = '',
  source = '',
  note = '',
  honeypot = '',
}) {
  // Bots that autofill every field reveal themselves here; drop silently so
  // they believe the submission worked.
  if (honeypot) return { result: 'created', id: null }

  if (!supabase) throw new Error('Submissions are not configured on this deployment.')

  const { data, error } = await supabase.rpc('submit_suggestion', {
    p_type: type,
    p_language_id: languageId,
    p_payload: payload,
    p_contributor_name: contributorName || null,
    p_contributor_contact: contributorContact || null,
    p_source: source || null,
    p_note: note || null,
  })
  if (error) throw new Error(friendlyError(error.message))
  return data
}

function friendlyError(message) {
  if (/rate limit/i.test(message)) {
    return 'You have submitted a lot recently — please try again in an hour.'
  }
  return `Submission failed: ${message}`
}

// ---------------------------------------------------------------------------
// Admin (requires the signed-in admin session; RLS enforces access)
// ---------------------------------------------------------------------------

export async function fetchSubmissions(status) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return data
}

export async function reviewSubmission(id, status, reviewNote = '') {
  const { error } = await supabase
    .from('submissions')
    .update({
      status,
      review_note: reviewNote || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
