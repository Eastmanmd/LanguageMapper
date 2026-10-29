// Builds the Africa-wide atlas data from two open datasets (both CC BY 4.0):
//
//   Glottolog (glottolog-cldf) — languages, coordinates, countries, the expert
//     family tree and endangerment status.
//   ASJP (lexibank/asjp) — a 40-item basic vocabulary list for most languages,
//     used to measure how similar two languages' words are.
//
// plus Natural Earth country outlines (public domain) for zoom-to-country and
// the highlighted border, and Unicode CLDR's per-country language population
// estimates (Unicode License v3) for the country panel's speaker shares.
//
//   npm run build-africa-data
//
// Downloads are cached in data-raw/ (gitignored); delete it to refresh. Writes
// public/data/africa/{languages,words}.json and borders.geojson, which the
// /atlas page loads at runtime, and src/data/africaStats.json for the home page.

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
  'ne_50m_admin_0_countries.geojson':
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson',
  'cldr-supplementalData.xml':
    'https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/supplemental/supplementalData.xml',
  'cldr-supplementalMetadata.xml':
    'https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/supplemental/supplementalMetadata.xml',
  'cldr-en.xml': 'https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/main/en.xml',
  'ne_50m_rivers_lake_centerlines.geojson':
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_rivers_lake_centerlines.geojson',
  'ne_50m_lakes.geojson':
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_lakes.geojson',
  // Pew Research Center's 2025 religious composition estimates, as republished by Our World in Data.
  'owid-religion-shares.csv':
    'https://ourworldindata.org/grapher/share-of-population-by-religious-affiliation.csv?v=1&csvType=full&useColumnShortNames=true',
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
// Glottolog 5.2.1 marks Seychellois Creole extinct ("Dormant"), though nearly
// all of the Seychelles speaks it (CLDR: 98%).
endangerment.set('sese1246', AES['aes-not_endangered'])

const familyToGroup = new Map()
for (const [groupId, group] of Object.entries(TRADITIONAL_GROUPS)) {
  for (const name of group.families) familyToGroup.set(name, groupId)
}

const nodes = {}
for (const [id, group] of Object.entries(TRADITIONAL_GROUPS)) nodes[id] = { n: group.name }

// Natural Earth puts a few non-African territories in its Africa region
// (Australia's Indian Ocean Territories, French Antarctic lands); drop them.
const NON_AFRICAN_TERRITORIES = new Set(['AU', 'IO', 'TF', 'HM'])
const countryShapes = JSON.parse(await fetchSource('ne_50m_admin_0_countries.geojson')).features.filter(
  (f) => f.properties.REGION_UN === 'Africa' && !NON_AFRICAN_TERRITORIES.has(f.properties.ISO_A2_EH),
)
// Réunion and Mayotte are African but sit inside France in Natural Earth.
const africanCountries = new Set([...countryShapes.map((f) => f.properties.ISO_A2_EH), 'RE', 'YT'])

// Glottolog 5.2.1 leaves the macroarea blank for some isolates (Sandawe,
// Hadza, Bangime…), so an untagged language counts if it's spoken in Africa.
// Some carry several macroareas: "Africa;Eurasia" covers Egyptian Arabic but
// also English, whose dot is in England, so those must sit in Africa as well.
const spokenInAfrica = (r) => r.Countries.split(';').some((c) => africanCountries.has(c))
const dotInAfrica = (r) => r.Longitude > -26 && r.Longitude < 64 && r.Latitude > -47 && r.Latitude < 38
const isAfrican = (r) => {
  const areas = r.Macroarea.split(';').filter(Boolean)
  if (areas.length === 1) return areas[0] === 'Africa'
  if (areas.length > 1) return areas.includes('Africa') && spokenInAfrica(r) && dotInAfrica(r)
  return spokenInAfrica(r)
}

const languages = []
const unmappedFamilies = new Set()
for (const r of glottolog) {
  if (!isAfrican(r) || r.Level !== 'language' || !r.Latitude) continue
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

// Zoom box per African country that has languages. Far-flung specks (South
// Africa's Prince Edward Islands, Equatorial Guinea's Annobón) would stretch a
// box across open ocean, so only polygons ≥ 5% the area of the largest count.
// Countries Natural Earth folds into another (Réunion, Mayotte) get no box; the
// page falls back to framing their languages' dots.
const polygonArea = (ring) =>
  Math.abs(ring.reduce((sum, [x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length]
    return sum + x1 * y2 - x2 * y1
  }, 0)) / 2

const usedCountries = new Set(languages.flatMap((l) => l.c))
const countries = {}
for (const f of countryShapes) {
  const code = f.properties.ISO_A2_EH
  if (!usedCountries.has(code)) continue
  const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const largest = Math.max(...polygons.map((p) => polygonArea(p[0])))
  const points = polygons.filter((p) => polygonArea(p[0]) >= largest * 0.05).flatMap((p) => p[0])
  const lons = points.map((p) => p[0])
  const lats = points.map((p) => p[1])
  countries[code] = [
    [round(Math.min(...lons)), round(Math.min(...lats))],
    [round(Math.max(...lons)), round(Math.max(...lats))],
  ]
}
// No outline for Réunion and Mayotte; the page frames their dots instead.
for (const code of ['RE', 'YT']) if (usedCountries.has(code)) countries[code] ??= null

// Outlines for the selected-country border, at ~100 m precision (plenty at the
// zoom levels a whole country is shown at, and a fraction of the raw size).
const roundRing = (ring) =>
  ring
    .map(([x, y]) => [round(x), round(y)])
    .filter((pt, i, arr) => i === 0 || pt[0] !== arr[i - 1][0] || pt[1] !== arr[i - 1][1])
writeFileSync(
  path.join(outDir, 'borders.geojson'),
  JSON.stringify({
    type: 'FeatureCollection',
    features: countryShapes
      .filter((f) => f.properties.ISO_A2_EH in countries)
      .map((f) => ({
        type: 'Feature',
        properties: { c: f.properties.ISO_A2_EH },
        geometry: {
          type: f.geometry.type,
          coordinates:
            f.geometry.type === 'Polygon'
              ? f.geometry.coordinates.map(roundRing)
              : f.geometry.coordinates.map((poly) => poly.map(roundRing)),
        },
      })),
  }),
)

// Speaker shares per country from CLDR: the percentage of the population that
// speaks each language, first or second language, so shares overlap. CLDR uses
// two-letter and macrolanguage codes (sw, om, kr); its aliases map those to the
// individual ISO 639-3 language the atlas has (swh, gaz, knc).
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
// CLDR names one member for every macrolanguage, but for these the umbrella
// covers several distinct languages (Fula, Kalenjin, Luyia, Akan), so linking to
// that one member would mislead. They're listed by name without a link.
const UMBRELLA_CODES = new Set(['ff', 'kln', 'luy', 'ak'])
const cldrCandidates = new Map()
for (const [, tag] of (await fetchSource('cldr-supplementalMetadata.xml')).matchAll(/<languageAlias ([^>]*)\/>/g)) {
  const { type, replacement, reason } = attrs(tag)
  if (reason !== 'macrolanguage' && reason !== 'overlong') continue
  if (reason === 'macrolanguage' && UMBRELLA_CODES.has(replacement)) continue
  if (!cldrCandidates.has(replacement)) cldrCandidates.set(replacement, [])
  // The individual language behind a macrolanguage is the better match, so it goes first.
  cldrCandidates.get(replacement)[reason === 'macrolanguage' ? 'unshift' : 'push'](type)
}
const atlasByIso = new Map(languages.filter((l) => l.iso).map((l) => [l.iso, l.g]))
const glottologByIso = new Map(glottolog.filter((r) => r.ISO639P3code).map((r) => [r.ISO639P3code, r]))
const isoCandidates = (code) => [...(cldrCandidates.get(code) ?? []), code]
const glottocodeForCldr = (code) => isoCandidates(code).map((iso) => atlasByIso.get(iso)).find(Boolean) ?? null

// Languages from outside Africa are left out where they serve only as a
// language of government (English in Nigeria, French in Cameroon, Portuguese in
// Angola), by the same test that decides atlas membership. Codes Glottolog
// can't resolve are African umbrella names (Kru), so they stay.
const isAfricanCldr = (code) => {
  const row = isoCandidates(code).map((iso) => glottologByIso.get(iso)).find(Boolean)
  return !row || isAfrican(row)
}
// …but they stay where a community descends from their speakers: settler,
// creole and Indian-descended populations, and Arabic in the Arab world.
const HERITAGE_LANGUAGES = {
  ZA: ['en', 'hi'],
  NA: ['de'],
  CV: ['pt'],
  ST: ['pt'],
  RE: ['fr', 'ta'],
  MU: ['fr', 'bho', 'ur', 'ta'],
  SC: ['fr'],
  EG: ['ar'],
  DZ: ['ar'],
  MA: ['ar'],
  TN: ['ar'],
  MR: ['ar'],
  SD: ['ar'],
}

// Where CLDR has only "Arabic" (Modern Standard Arabic) and no entry for the
// local variety, that figure stands for the Arabic people actually speak.
const LOCAL_ARABIC = { LY: 'liby1240', TD: 'chad1249', SS: 'suda1237', EH: 'hass1238' }

// CLDR's English names cover umbrella codes (Luyia, Kalenjin) that browsers
// can't name; otherwise the atlas name is used.
const cldrNames = new Map(
  [...(await fetchSource('cldr-en.xml')).matchAll(/<language type="([a-z]+)">([^<]+)<\/language>/g)].map((m) => [m[1], m[2]]),
)
const atlasNames = new Map(languages.map((l) => [l.g, l.n]))
// Extinct languages kept for liturgy (Coptic) have no speakers to count.
const extinct = new Set(languages.filter((l) => l.e === 5).map((l) => l.g))

const speakers = {}
for (const [, head, body] of (await fetchSource('cldr-supplementalData.xml')).matchAll(
  /<territory ([^>]*)>([\s\S]*?)<\/territory>/g,
)) {
  const { type: code, population } = attrs(head)
  if (!(code in countries)) continue
  const entries = [...body.matchAll(/<languagePopulation ([^>]*)\/>/g)]
    .map(([, tag]) => attrs(tag))
    // Script variants (ha_Arab) are the same speakers again.
    .filter((l) => !l.type.includes('_') && Number(l.populationPercent) > 0)
    .map((l) => ({ ...l, g: l.type === 'ar' && LOCAL_ARABIC[code] ? LOCAL_ARABIC[code] : glottocodeForCldr(l.type) }))
  // A local variety substituted for "Arabic" replaces CLDR's own (tiny) entry for it.
  const top = entries
    .filter((l) => !extinct.has(l.g))
    .filter(
      (l) =>
        (l.type === 'ar' && LOCAL_ARABIC[code]) ||
        HERITAGE_LANGUAGES[code]?.includes(l.type) ||
        (isAfricanCldr(l.type) && !(l.g === LOCAL_ARABIC[code] && entries.some((e) => e.type === 'ar'))),
    )
    .map((l) => [
      (l.type === 'ar' && LOCAL_ARABIC[code] ? atlasNames.get(l.g) : cldrNames.get(l.type)) ?? atlasNames.get(l.g) ?? l.type,
      Number(l.populationPercent),
      l.g,
    ])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  speakers[code] = { pop: Number(population), top }
}

writeFileSync(
  path.join(outDir, 'languages.json'),
  JSON.stringify({
    sources: [
      'Hammarström, Forkel, Haspelmath & Bank. 2025. Glottolog 5.2.1. https://glottolog.org (CC BY 4.0)',
      'Wichmann, Holman, Brown, Dryer & Ran (eds.). 2025. The ASJP Database, version 21. https://asjp.clld.org (CC BY 4.0)',
      'Natural Earth 5.1.2 country boundaries. https://www.naturalearthdata.com (public domain)',
      'Unicode CLDR 48 language population estimates. https://cldr.unicode.org (Unicode License v3)',
    ],
    countries,
    speakers,
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

// Headline numbers for the landing page, bundled with the app so it needn't
// fetch the full atlas. Glottolog's catch-all groupings aren't families.
const NOT_FAMILIES = new Set(['Pidgin', 'Unclassifiable', 'Unattested'])
const families = Object.entries(nodes).filter(([, n]) => n.p?.startsWith('x-') && !NOT_FAMILIES.has(n.n))
const languagesIn = (id) => languages.filter((l) => {
  for (let cur = l.p; cur; cur = nodes[cur]?.p) if (cur === id) return true
  return false
}).length
const largest = families.map(([id, n]) => ({ name: n.n, count: languagesIn(id) })).sort((a, b) => b.count - a.count)[0]
const perCountry = {}
for (const l of languages) for (const c of l.c) perCountry[c] = (perCountry[c] ?? 0) + 1
const [topCountry, topCountryCount] = Object.entries(perCountry).sort((a, b) => b[1] - a[1])[0]
const stats = {
  languages: languages.length,
  families: families.length,
  isolateCount: languages.filter((l) => l.p.startsWith('x-')).length,
  countries: Object.keys(countries).length,
  wordLists: Object.keys(words).length,
  endangered: languages.filter((l) => l.e >= 1 && l.e <= 4).length,
  extinct: languages.filter((l) => l.e === 5).length,
  largestFamily: largest,
  topCountry: { code: topCountry, count: topCountryCount },
  // Largest first, the same order (and so the same colours) as the atlas legend's top level.
  groups: Object.keys(TRADITIONAL_GROUPS)
    .map((id) => ({ id, name: TRADITIONAL_GROUPS[id].name, count: languagesIn(id) }))
    .sort((a, b) => b.count - a.count),
  isolates: languages
    .filter((l) => l.p.startsWith('x-'))
    .map((l) => ({ g: l.g, name: l.n }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  // Glottolog's scale from "threatened" (1) to "nearly extinct" (4).
  endangeredLevels: ['Threatened', 'Shifting', 'Moribund', 'Nearly extinct'].map((label, i) => ({
    label,
    count: languages.filter((l) => l.e === i + 1).length,
  })),
}
writeFileSync(path.join(root, 'src/data/africaStats.json'), `${JSON.stringify(stats, null, 2)}\n`)

console.log(`${languages.length} languages, ${Object.keys(nodes).length} groups, ${Object.keys(words).length} word lists`)

// The Nigeria profiles link to the atlas by glottocode; catch links that a
// Glottolog update has broken.
const nigeriaLinks = JSON.parse(readFileSync(path.join(root, 'src/data/nigeriaGlottocodes.json'), 'utf8'))
const broken = Object.entries(nigeriaLinks).filter(([, g]) => !included.has(g))
if (broken.length) console.warn('Nigeria links not in the atlas:', broken.map((b) => b.join('→')).join(', '))
if (unmappedFamilies.size) console.log('Under "Other languages":', [...unmappedFamilies].sort().join(', '))

// ---------------------------------------------------------------------------
// Map Studio layers: per-country official languages, writing scripts, religion
// and labels (public/data/africa/studio.json), plus rivers and lakes
// (public/data/africa/water.geojson).

const EUROPEAN_LANGUAGES = new Set(['en', 'fr', 'pt', 'es', 'de', 'it'])
// CLDR lists Yoruba as official in Nigeria but not Hausa or Igbo; the
// constitution (s. 55) recognises all three alongside English.
const OFFICIAL_CORRECTIONS = { NG: { ha: 'official_regional', ig: 'official_regional', yo: 'official_regional' } }
const scriptNames = new Map(
  [...(await fetchSource('cldr-en.xml')).matchAll(/<script type="([A-Z][a-z]{3})">([^<]+)<\/script>/g)].map((m) => [m[1], m[2]]),
)
scriptNames.set('Ethi', "Ge'ez (Ethiopic)")

// Each language's writing systems: the primary entry's first script is how
// it's usually written; secondary entries are scripts some speakers also use.
const languageScripts = new Map()
for (const [, tag] of (await fetchSource('cldr-supplementalData.xml')).matchAll(/<language ([^>]*scripts="[^"]*"[^>]*)\/>/g)) {
  const { type, scripts, alt } = attrs(tag)
  const entry = languageScripts.get(type) ?? { primary: [], secondary: [] }
  entry[alt === 'secondary' ? 'secondary' : 'primary'].push(...scripts.split(' '))
  languageScripts.set(type, entry)
}

const religionByIso3 = new Map()
for (const r of parseCsv(await fetchSource('owid-religion-shares.csv'))) {
  if (r.year !== '2020' || !r.code) continue
  const n = (k) => Number(r[`share__religion_${k}`]) || 0
  religionByIso3.set(r.code, {
    christian: n('christians'),
    muslim: n('muslims'),
    // Folk and traditional religions are most of "other" in Africa.
    other: n('other_religions') + n('jews') + n('hindus') + n('buddhists'),
    unaffiliated: n('religiously_unaffiliated'),
  })
}

const oneDecimal = (n) => Math.round(n * 10) / 10
const studioCountries = {}
for (const [, head, body] of (await fetchSource('cldr-supplementalData.xml')).matchAll(
  /<territory ([^>]*)>([\s\S]*?)<\/territory>/g,
)) {
  const { type: code, population, literacyPercent } = attrs(head)
  if (!(code in countries)) continue
  const entries = [...body.matchAll(/<languagePopulation ([^>]*)\/>/g)].map(([, tag]) => attrs(tag))

  const official = entries
    .filter((l) => (l.officialStatus || OFFICIAL_CORRECTIONS[code]?.[l.type]) && !l.type.includes('_'))
    .map((l) => ({
      name: cldrNames.get(l.type) ?? atlasNames.get(glottocodeForCldr(l.type)) ?? l.type,
      status: { official: 'official', de_facto_official: 'de facto', official_regional: 'regional' }[
        OFFICIAL_CORRECTIONS[code]?.[l.type] ?? l.officialStatus
      ],
      kind: l.type === 'ar' ? 'arabic' : EUROPEAN_LANGUAGES.has(l.type) ? 'european' : 'african',
    }))
  // Regionally official African languages count: South Africa's eleven are
  // provincial in CLDR but every bit as official in practice.
  const has = (kind) => official.some((o) => o.kind === kind && (o.status !== 'regional' || kind === 'african'))
  const officialType = [has('arabic') && 'Arabic', has('european') && 'European', has('african') && 'African']
    .filter(Boolean)
    .join(' + ') || null

  // Main script: weight each language's usual script by its share of speakers.
  const weights = new Map()
  const notable = new Set()
  // Languages of government alone (English in Ethiopia) don't decide how a
  // country writes, so the same African-and-heritage filter as the speaker list applies.
  const counted = entries.filter((l) => isAfricanCldr(l.type.split('_')[0]) || HERITAGE_LANGUAGES[code]?.includes(l.type))
  for (const l of counted.length ? counted : entries) {
    const pct = Number(l.populationPercent) || 0
    const [lang, variant] = l.type.split('_')
    const scripts = languageScripts.get(lang)
    if (variant) notable.add(variant)
    else if (scripts?.primary[0]) weights.set(scripts.primary[0], (weights.get(scripts.primary[0]) ?? 0) + pct)
    for (const sc of scripts?.primary ?? []) if (pct >= 0.5 || variant) notable.add(sc)
  }
  const ranked = [...weights].sort((a, b) => b[1] - a[1])
  const [first, second] = ranked
  // A close second makes it a two-script country (Ethiopia: Latin for Oromo, Ge'ez for Amharic).
  const ORDER = ['Latn', 'Arab', 'Ethi']
  let mainScript = first?.[0] ?? null
  if (first && second && second[1] >= first[1] * 0.4) {
    mainScript = [first[0], second[0]].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).join('+')
  }

  const shape = countryShapes.find((f) => f.properties.ISO_A2_EH === code)
  const religion = shape && religionByIso3.get(shape.properties.ISO_A3_EH)
  studioCountries[code] = {
    ...(shape && { label: [round(shape.properties.LABEL_X), round(shape.properties.LABEL_Y)] }),
    pop: Number(population),
    ...(literacyPercent && { literacy: Number(literacyPercent) }),
    official,
    officialType,
    mainScript,
    // Scripts beyond Latin and Arabic: Ge'ez, Tifinagh, N'Ko, Vai, Adlam, Bamum…
    otherScripts: [...notable].filter((sc) => sc !== 'Latn' && sc !== 'Arab' && scriptNames.has(sc)).map((sc) => scriptNames.get(sc)),
    ...(religion && { religion: Object.fromEntries(Object.entries(religion).map(([k, v]) => [k, oneDecimal(v)])) }),
  }
}
writeFileSync(
  path.join(outDir, 'studio.json'),
  JSON.stringify({
    scriptNames: Object.fromEntries(['Latn', 'Arab', 'Ethi'].map((sc) => [sc, scriptNames.get(sc)])),
    countries: studioCountries,
  }),
)

// Rivers and lakes inside Africa's box, for the water overlay.
const inAfricaBox = ([lon, lat]) => lon > -26 && lon < 64 && lat > -47 && lat < 38
const waterFeatures = []
for (const [file, kind] of [['ne_50m_rivers_lake_centerlines.geojson', 'river'], ['ne_50m_lakes.geojson', 'lake']]) {
  for (const f of JSON.parse(await fetchSource(file)).features) {
    if (!f.geometry) continue
    const flat = JSON.stringify(f.geometry.coordinates).match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/)
    const firstPoint = flat?.[0].split(',').map(Number)
    if (!firstPoint || !inAfricaBox(firstPoint)) continue
    const roundCoords = (c) => (typeof c[0] === 'number' ? [round(c[0]), round(c[1])] : c.map(roundCoords))
    waterFeatures.push({
      type: 'Feature',
      properties: { kind, rank: f.properties.scalerank ?? 5 },
      geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
    })
  }
}
writeFileSync(path.join(outDir, 'water.geojson'), JSON.stringify({ type: 'FeatureCollection', features: waterFeatures }))

