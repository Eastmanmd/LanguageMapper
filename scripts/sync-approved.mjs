// Applies approved community submissions to the JSON data files, then marks
// them 'applied' in Supabase. Run after reviewing in /admin:
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run sync-data
//
// (or put both in .env — this script reads it). Review the resulting git diff
// and commit; the site picks the changes up on the next build.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Minimal .env loader so the script works without extra dependencies.
const envPath = path.join(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2]
  }
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n' +
      'The service role key is in Supabase Dashboard > Settings > API. Keep it out of git.',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const files = {
  languages: path.join(root, 'src/data/languages.json'),
  stateLanguages: path.join(root, 'src/data/stateLanguages.json'),
  wordComparison: path.join(root, 'src/data/wordComparison.json'),
}
const data = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, JSON.parse(readFileSync(file, 'utf8'))]),
)

const slugify = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Ensures a language has an entry in wordComparison.json, pulling its name and
// classification from languages.json.
function wordEntryFor(languageId) {
  const langs = data.wordComparison.languages
  if (!langs[languageId]) {
    const profile = data.languages[languageId]
    if (!profile) return null
    langs[languageId] = {
      name: profile.name,
      classification: profile.classification,
      words: {},
    }
  }
  return langs[languageId]
}

function apply(submission) {
  const { type, language_id: languageId, payload } = submission

  if (type === 'flag_word') {
    const entry = wordEntryFor(languageId)
    if (!entry) return `unknown language "${languageId}"`
    entry.words[payload.wordId] = payload.suggestedValue
    return null
  }

  if (type === 'fill_words') {
    const entry = wordEntryFor(languageId)
    if (!entry) return `unknown language "${languageId}"`
    Object.assign(entry.words, payload.words)
    return null
  }

  if (type === 'new_language') {
    const id = slugify(payload.name)
    if (!id) return 'name does not produce a valid id'
    if (data.languages[id]) return `language "${id}" already exists`
    data.languages[id] = {
      id,
      name: payload.name,
      classification: payload.classification || '',
      ethnicGroups: payload.ethnicGroups || [],
      similarLanguages: [],
      description: payload.description || '',
    }
    for (const stateId of payload.states || []) {
      const list = data.stateLanguages[stateId]
      if (list && !list.includes(id)) list.push(id)
    }
    if (payload.words && Object.keys(payload.words).length > 0) {
      data.wordComparison.languages[id] = {
        name: payload.name,
        classification: payload.classification || '',
        words: payload.words,
      }
    }
    return null
  }

  return `unknown submission type "${type}"`
}

const { data: approved, error } = await supabase
  .from('submissions')
  .select('*')
  .eq('status', 'approved')
  .order('created_at', { ascending: true })
if (error) {
  console.error('Failed to fetch approved submissions:', error.message)
  process.exit(1)
}
if (approved.length === 0) {
  console.log('No approved submissions to apply.')
  process.exit(0)
}

const appliedIds = []
for (const submission of approved) {
  const problem = apply(submission)
  const label = `${submission.type} ${submission.language_id ?? submission.payload.name} (${submission.id.slice(0, 8)})`
  if (problem) {
    console.warn(`SKIPPED ${label}: ${problem} — resolve manually, it stays approved.`)
  } else {
    console.log(`applied ${label}`)
    appliedIds.push(submission.id)
  }
}

for (const [key, file] of Object.entries(files)) {
  writeFileSync(file, JSON.stringify(data[key], null, 2) + '\n')
}

if (appliedIds.length > 0) {
  const { error: markError } = await supabase
    .from('submissions')
    .update({ status: 'applied', applied_at: new Date().toISOString() })
    .in('id', appliedIds)
  if (markError) {
    console.error(
      'Data files were updated but marking submissions as applied failed:',
      markError.message,
    )
    process.exit(1)
  }
}

console.log(
  `\nDone: ${appliedIds.length} applied, ${approved.length - appliedIds.length} skipped. ` +
    'Review the git diff and commit.',
)
