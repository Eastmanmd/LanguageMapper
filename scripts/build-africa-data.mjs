// Builds the Africa-wide atlas data from two open datasets (both CC BY 4.0):
//
//   Glottolog (glottolog-cldf) — languages, coordinates, countries, the expert
//     family tree and endangerment status.
//   ASJP (lexibank/asjp) — a 40-item basic vocabulary list for most languages,
//     used to measure how similar two languages' words are.
//
//   npm run build-africa-data
//
// Downloads are cached in data-raw/ (gitignored); delete it to refresh. Writes
// public/data/africa/languages.json and public/data/africa/words.json, which
// the /atlas page loads at runtime.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(root, 'data-raw')
const outDir = path.join(root, 'public/data/africa')

const SOURCES = {
  'glottolog-languages.csv':
    'https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.2.1/cldf/languages.csv',
  'glottolog-values.csv':
    'https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.2.1/cldf/values.csv',
  'asjp-languages.csv': 'https://raw.githubusercontent.com/lexibank/asjp/v21/cldf/languages.csv',
  'asjp-parameters.csv': 'https://raw.githubusercontent.com/lexibank/asjp/v21/cldf/parameters.csv',
  'asjp-forms.csv': 'https://raw.githubusercontent.com/lexibank/asjp/v21/cldf/forms.csv',
}

// Glottolog pseudo-families that aren't spoken languages or are duplicate
// entries. ("Unattested" stays: those are real languages nobody has recorded yet.)
const EXCLUDED_FAMILIES = new Set([
  'Bookkeeping',
  'Sign Language',
  'Speech Register',
  'Artificial Language',
])

// Glottolog only groups languages it considers proven related, so Niger-Congo,
// Nilo-Saharan and Khoisan don't exist there. The general public knows Africa
// through these four traditional groupings (Greenberg 1963), so the atlas adds
// them as a top level above Glottolog's families, labelled as traditional.
const TRADITIONAL_GROUPS = {
  'x-nc': {
    name: 'Niger-Congo',
    families: [
      'Atlantic-Congo', 'Mande', 'Kru', 'Dogon', 'Ijoid', 'Heibanic', 'Narrow Talodi',
      'Katla-Tima', 'Rashad', 'Tegem', 'Siamou', 'Laal', 'Jalaa',
    ],
  },
  'x-aa': {
    name: 'Afro-Asiatic',
    families: ['Afro-Asiatic', 'Ta-Ne-Omotic', 'South Omotic', 'Dizoid', 'Blue Nile Mao', 'Ongota'],
  },
  'x-ns': {
    name: 'Nilo-Saharan',
    families: [
      'Central Sudanic', 'Nilotic', 'Nubian', 'Surmic', 'Maban', 'Songhay', 'Saharan', 'Dajuic',
      'Kadugli-Krongo', 'Koman', 'Tamaic', 'Eastern Jebel', 'Kresh-Aja', 'Gumuz', 'Kuliak',
      'Temeinic', 'Nyimang', 'Furan', 'Kunama', 'Berta', 'Nara', 'Shabo', 'Mimi-Gaudefroy',
      'Kujarge', 'Gule', 'Meroitic',
    ],
  },
  'x-ks': { name: 'Khoisan', families: ['Khoe-Kwadi', 'Tuu', 'Kxa', 'Sandawe', 'Hadza'] },
  'x-other': { name: 'Other languages', families: [] },
}

const AES = {
  'aes-not_endangered': 0,
  'aes-threatened': 1,
  'aes-shifting': 2,
  'aes-moribund': 3,
  'aes-nearly_extinct': 4,
  'aes-extinct': 5,
}

async function fetchSource(file) {
  const dest = path.join(rawDir, file)
  if (!existsSync(dest)) {
    console.log(`Downloading ${file}…`)
    const res = await fetch(SOURCES[file])
    if (!res.ok) throw new Error(`${SOURCES[file]}: HTTP ${res.status}`)
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  }
  return readFileSync(dest, 'utf8')
}

// RFC 4180 CSV → array of objects keyed by the header row.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) rows.push([...row, field])
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

const round = (n) => Math.round(n * 1000) / 1000

mkdirSync(rawDir, { recursive: true })
mkdirSync(outDir, { recursive: true })

const glottolog = parseCsv(await fetchSource('glottolog-languages.csv'))
const byId = new Map(glottolog.map((r) => [r.ID, r]))

const classification = new Map()
const endangerment = new Map()
for (const v of parseCsv(await fetchSource('glottolog-values.csv'))) {
  if (v.Parameter_ID === 'classification' && v.Value) {
    classification.set(v.Language_ID, v.Value.split('/'))
  } else if (v.Parameter_ID === 'aes' && v.Code_ID in AES) {
    endangerment.set(v.Language_ID, AES[v.Code_ID])
  }
}

const familyToGroup = new Map()
for (const [groupId, group] of Object.entries(TRADITIONAL_GROUPS)) {
  for (const name of group.families) familyToGroup.set(name, groupId)
}

const nodes = {}
for (const [id, group] of Object.entries(TRADITIONAL_GROUPS)) nodes[id] = { n: group.name }

const languages = []
const unmappedFamilies = new Set()
for (const r of glottolog) {
  if (r.Macroarea !== 'Africa' || r.Level !== 'language' || !r.Latitude) continue
  const lineage = classification.get(r.ID) ?? []
  const familyId = lineage[0] ?? r.ID
  const familyName = byId.get(familyId).Name
  if (EXCLUDED_FAMILIES.has(familyName)) continue

  const groupId = familyToGroup.get(familyName) ?? 'x-other'
  if (groupId === 'x-other') unmappedFamilies.add(familyName)

  // Chain each Glottolog node to its parent; family roots hang off a traditional group.
  let parent = groupId
  for (const nodeId of lineage) {
    nodes[nodeId] ??= { n: byId.get(nodeId).Name, p: parent }
    parent = nodeId
  }

  languages.push({
    g: r.ID,
    n: r.Name,
    lat: round(Number(r.Latitude)),
    lon: round(Number(r.Longitude)),
    p: parent,
    c: r.Countries ? r.Countries.split(';') : [],
    ...(r.ISO639P3code && { iso: r.ISO639P3code }),
    ...(endangerment.has(r.ID) && { e: endangerment.get(r.ID) }),
  })
}
const included = new Set(languages.map((l) => l.g))

// ASJP: keep the 40 core concepts (marked with * in the source) and, for each
// Glottolog language, the fullest word list among its doculects (dialect-level
// glottocodes roll up to their language).
const concepts = parseCsv(await fetchSource('asjp-parameters.csv'))
  .filter((p) => p.Name.startsWith('*'))
  .map((p) => ({ id: p.ID, en: p.Name.slice(1) }))
const conceptIndex = new Map(concepts.map((c, i) => [c.id, i]))

const doculectToLanguage = new Map()
for (const d of parseCsv(await fetchSource('asjp-languages.csv'))) {
  const g = byId.get(d.Glottocode)
  if (!g) continue
  const langId = g.Level === 'language' ? g.ID : g.Language_ID
  if (included.has(langId)) doculectToLanguage.set(d.ID, langId)
}

const doculectWords = new Map()
for (const f of parseCsv(await fetchSource('asjp-forms.csv'))) {
  const i = conceptIndex.get(f.Parameter_ID)
  if (i === undefined || !doculectToLanguage.has(f.Language_ID) || f.Loan === 'true') continue
  if (!doculectWords.has(f.Language_ID)) {
    doculectWords.set(f.Language_ID, { asjp: Array(concepts.length).fill(''), ipa: Array(concepts.length).fill('') })
  }
  const entry = doculectWords.get(f.Language_ID)
  // Synonyms are kept comma-separated; similarity takes the closest pair.
  entry.asjp[i] = entry.asjp[i] ? `${entry.asjp[i]},${f.Form}` : f.Form
  entry.ipa[i] ||= f.Segments.replace(/ /g, '')
}

const words = {}
for (const [doculect, entry] of doculectWords) {
  const langId = doculectToLanguage.get(doculect)
  const filled = entry.asjp.filter(Boolean).length
  if (filled >= 20 && filled > (words[langId]?.filled ?? 0)) words[langId] = { ...entry, filled, src: doculect }
}
for (const lang of languages) if (words[lang.g]) lang.w = 1

writeFileSync(
  path.join(outDir, 'languages.json'),
  JSON.stringify({
    sources: [
      'Hammarström, Forkel, Haspelmath & Bank. 2025. Glottolog 5.2.1. https://glottolog.org (CC BY 4.0)',
      'Wichmann, Holman, Brown, Dryer & Ran (eds.). 2025. The ASJP Database, version 21. https://asjp.clld.org (CC BY 4.0)',
    ],
    nodes,
    languages,
  }),
)
writeFileSync(
  path.join(outDir, 'words.json'),
  JSON.stringify({
    concepts,
    words: Object.fromEntries(
      Object.entries(words).map(([g, w]) => [g, { a: w.asjp, i: w.ipa, s: w.src }]),
    ),
  }),
)

console.log(`${languages.length} languages, ${Object.keys(nodes).length} groups, ${Object.keys(words).length} word lists`)

// The Nigeria profiles link to the atlas by glottocode; catch links that a
// Glottolog update has broken.
const nigeriaLinks = JSON.parse(readFileSync(path.join(root, 'src/data/nigeriaGlottocodes.json'), 'utf8'))
const broken = Object.entries(nigeriaLinks).filter(([, g]) => !included.has(g))
if (broken.length) console.warn('Nigeria links not in the atlas:', broken.map((b) => b.join('→')).join(', '))
if (unmappedFamilies.size) console.log('Under "Other languages":', [...unmappedFamilies].sort().join(', '))
