# LanguageMapper

A map of Africa's languages and how they relate: 2,236 languages placed where they are spoken, coloured by family, with basic-word comparisons for 1,762 of them. Nigeria is covered in depth, with all 37 states (including the FCT) and 239 hand-written language profiles.

**Live features:** Africa atlas · family drill-down · similarity map · interactive state map · language profiles · side-by-side word comparison · lexical similarity tree · dark mode

## Features

### Africa atlas (`/atlas`)

One dot per language across the continent, built from [Glottolog](https://glottolog.org) and the [ASJP Database](https://asjp.clld.org) (both CC BY 4.0).

- **Families:** dots are coloured by family. Click a family in the legend to zoom in and colour its branches, down to the smallest subgroup. The top level uses the four traditional groupings (Niger-Congo, Afro-Asiatic, Nilo-Saharan, Khoisan). Everything below follows Glottolog.
- **Similarity:** pick a language, then switch the legend to *Similarity*. Every other language is coloured by how much its 40 basic words resemble the selected one's, from "very close" to "no clear similarity". The score is LDND (normalized Levenshtein distance divided by the chance baseline), computed in the browser.
- **Country filter:** pick a country to zoom to it, outline its border, and fade out languages spoken elsewhere. The side panel switches to a country overview: population, languages mapped, the eight most spoken languages (share of the population, from [Unicode CLDR](https://cldr.unicode.org)), and the share of the country's languages in each family. Legend counts follow the country, and family colours stay the same as Africa-wide. Each language is one dot at the centre of its whole area, so cross-border languages can sit just outside the country.
- **Language panel:** where it's spoken, endangerment status, its full family tree, closest relatives, and a word-by-word comparison with any relative. Languages with a Nigeria profile also show its description and link to the state map and the compare tool.
- State lives in the URL (`/atlas?country=NG&lang=yoru1245&color=similar&vs=igal1242`), so every view can be shared.

### Map Studio (`/studio`)

Make and share maps of Africa. Pick what to colour the map by, add overlays, style it, and download a PNG or copy a link.

- **Layers:** language families (dots), approximate family areas, language density and endangerment (hexagons); languages per country, official languages, main writing script, largest religion, and the Christian–Muslim balance (countries).
- **Overlays and bases:** language dots, rivers and lakes, borders, country names; light, dark, terrain (hillshade) and streets bases.
- **Filters:** any language family (down to e.g. Narrow Bantu), endangered languages only, and a country (outlined, and language layers narrowed to it).
- **Stories:** seven presets (families, mountains as refuges, the Bantu expansion, writing systems, official vs spoken, religion, languages at risk) to start from.
- **Export:** 1920×1080, 1600×1600 or 1600×2000 PNGs with the title, legend and source credits drawn in. The whole map is in the URL, so links rebuild it exactly.
- Country-level layers (religion, official languages, scripts) hide variation inside countries; the legends say so.

### Interactive map (`/map`)

A zoomable MapLibre map of Nigeria's states, rendered on OpenFreeMap tiles.

- **Click a state** to open a side panel listing every language spoken there, with full profiles.
- **Search for a language** to highlight all the states where it is spoken, with a summary of where it's found.
- Selected state and searched language are stored in the URL (`/map/NG-KN?lang=hausa`), so any view is shareable and survives refresh.
- Light and dark map styles follow the app theme.

### Language profiles

Each of the 239 catalogued languages has a profile with:

- **Classification** — full lineage (e.g. `Niger-Congo > Atlantic-Congo > Volta-Niger > Yoruboid`)
- **Ethnic groups** associated with the language
- **Similar languages** — cross-linked to their own profiles
- **Description** — a short note on where it's spoken and its cultural or historical significance

### Compare languages (`/compare`)

Pick two or more languages and compare them side by side:

- A table of **23 basic words** (numbers one to ten, body parts, everyday nouns, and the verbs *come*, *go*, *speak*) across all selected languages.
- A **similarity tree** built live in the browser: word forms are normalized (tone marks stripped), compared with Levenshtein distance, averaged into a per-language-pair similarity score, and clustered with UPGMA into a dendrogram. Closer word forms cluster together first.
- Currently 26 languages have word lists, including Hausa, Yoruba, Igbo, Fulfulde, Edo, Idoma, Ibibio, Ijaw (Izon), Tiv, Ikwerre, Kanuri, and Nigerian Pidgin.
- Selections live in the URL (`/compare?langs=yoruba,igbo,twi`) for sharing.

The tree is a simple lexical-similarity illustration, not a rigorous historical-linguistic classification.

### Flag a word

Hover any cell in the comparison table and click the flag to suggest a correction (or propose a value for an empty cell). The form takes an optional contributor name, email, and source citation. Submissions are validated client- and server-side, rate-limited per IP, identical pending suggestions are merged with a counter, and nothing goes live until the admin approves it.

### Admin review (`/admin`)

A hidden route (not in the nav) where the admin signs in with a Supabase magic link. Row-level security restricts reads and reviews to the admin email. The queue shows each submission as a diff (current value → suggested value) with contributor info, and approve/reject buttons. Approved submissions are applied to the JSON data files with:

```bash
npm run sync-data   # needs SUPABASE_SERVICE_ROLE_KEY (see .env.example)
```

The script applies each approved item to `languages.json`, `stateLanguages.json`, and `wordComparison.json`, marks it `applied` in Supabase, and leaves the changes as an ordinary git diff to review and commit — so every accepted change stays versioned in git.

### Blog (`/blog`)

Placeholder — articles and research notes are coming soon.

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vite.dev/) with [React Router](https://reactrouter.com/) for tab/URL routing
- [MapLibre GL JS](https://maplibre.org/) with [OpenFreeMap](https://openfreemap.org/) vector tiles
- [Tailwind CSS 4](https://tailwindcss.com/) with class-based dark mode
- [Oxlint](https://oxc.rs/) for linting
- [Supabase](https://supabase.com/) for community submissions and admin review — the app itself is still a static site; all published data ships as JSON

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # run oxlint
npm run sync-data # apply approved community submissions to the JSON files
```

The dev server runs at **http://localhost:5173/LanguageMapper/**, not at the bare
root — the site is deployed under that subpath and the base is applied in
development too, so path bugs surface locally instead of in production.

### Supabase setup (for community submissions)

Without this, the app runs fine but the flag-a-word form and `/admin` show a "not configured" notice.

1. Create a free project at [supabase.com](https://supabase.com/).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) — first replace the `ADMIN_EMAIL` placeholder comments' address with your admin email if it differs.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key (Dashboard → Settings → API). For `npm run sync-data`, also add the service role key — never commit it or expose it to the client.
4. Make sure email (magic link) auth is enabled (it is by default). Sign in at `/admin` with the admin email.

## Deployment (GitHub Pages)

The site is static, so Pages serves it directly and the contribution forms keep
working — the browser talks to Supabase itself, with no server in between.
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
publishes on every push to `main`; `dist/` stays gitignored and is never
committed.

Live at **https://eastmanmd.github.io/LanguageMapper/**.

### One-time setup

1. Repository → Settings → Pages → **Source: GitHub Actions**.
2. Repository → Settings → Secrets and variables → Actions, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both are baked into the
   bundle and are safe to expose; row-level security is what protects the data.
   Skip them and the site still deploys, with the contribution forms showing
   their "not configured" notice. Never add the service role key — it belongs
   only to `npm run sync-data`, which you run locally.
3. In Supabase → Authentication → URL Configuration, add
   `https://eastmanmd.github.io/LanguageMapper/admin` as a redirect URL, or the
   `/admin` magic link will send you back to localhost.

### How routing survives a static host

Pages has no server-side rewrites, so a deep link like `/map/NG-KN?lang=hausa`
asks for a file that does not exist. The `postbuild` step copies `index.html` to
`404.html`; Pages serves that for any unmatched path while leaving the URL
intact, so the app boots and React Router renders the right view. Shareable URLs
therefore work exactly as they do locally.

The trade-off: those responses carry an HTTP 404 status. Visitors never notice,
but crawlers may not index deep links. Switching to a `HashRouter` would return
a clean 200 at the cost of `#/` in every URL.

### Moving to a custom domain

Set `base` in [`vite.config.js`](vite.config.js) back to `'/'` — everything else
reads the base at runtime and follows automatically.

## Keeping Supabase awake

Free Supabase projects pause after about a week without traffic, and this site
only touches the database when somebody submits a suggestion, so it can go
dormant between contributions.
[`.github/workflows/supabase-keepalive.yml`](.github/workflows/supabase-keepalive.yml)
makes one read a week to prevent that. It no-ops when the secrets are absent.

## Data model

All app data lives in these JSON files plus one GeoJSON:

| File | Contents |
|---|---|
| `public/data/africa/languages.json` | Generated. Atlas languages (glottocode, name, coordinates, countries, endangerment) and the family tree nodes |
| `public/data/africa/words.json` | Generated. ASJP 40-concept word lists per glottocode: ASJPcode for scoring, IPA for display |
| `public/data/africa/borders.geojson` | Generated. Simplified Natural Earth outlines of African countries, for the selected-country border |
| `public/data/africa/studio.json` | Generated. Per-country official languages (with status), main and other writing scripts, religion shares and label points, for Map Studio |
| `public/data/africa/water.geojson` | Generated. Natural Earth rivers and lakes in Africa |
| `src/data/africaStats.json` | Generated. Headline numbers for the home page |
| `src/data/nigeriaGlottocodes.json` | Nigeria profile id → glottocode, linking the profiles to atlas languages (dialect profiles point to their language) |
| `src/data/languages.json` | Language profiles keyed by id: name, classification, ethnic groups, similar-language ids, description |
| `src/data/stateLanguages.json` | State id (ISO 3166-2, e.g. `NG-KN`) → array of language ids spoken there |
| `src/data/wordComparison.json` | Master word list (23 word ids) and per-language word maps for the comparison tool |
| `public/data/nigeria-states.geojson` | State boundary polygons with `state_id` and `name` properties |

### Adding a language

1. Add a profile entry to `src/data/languages.json` (id, name, classification, ethnicGroups, similarLanguages, description).
2. Add its id to the relevant states in `src/data/stateLanguages.json`.
3. Optionally, add a word map to `src/data/wordComparison.json` to include it in the comparison tool. Missing words are fine — the similarity score is computed over whichever words both languages have.

Language ids are lowercase-kebab-case and must match across all three files. To show the profile in the atlas, also add its glottocode to `src/data/nigeriaGlottocodes.json`.

### Rebuilding the atlas data

```bash
npm run build-africa-data
```

This downloads pinned releases of Glottolog (5.2.1), ASJP (v21), Natural Earth (5.1.2) and Unicode CLDR (48), plus Pew Research Center's 2025 religious composition estimates (via Our World in Data), into `data-raw/` (gitignored) and regenerates `public/data/africa/`. To move to a newer release, bump the tags in `scripts/build-africa-data.mjs` and delete `data-raw/`. The script warns if any Nigeria link no longer matches an atlas language.

## Crawler (experimental)

`crawler/` contains a standalone Python pipeline for harvesting language facts into SQLite, separate from the app data for now:

- `harvest_wikidata.py` — pulls language → region facts (ISO codes, coordinates) from Wikidata's SPARQL endpoint
- `extract_llm.py` — fetches prose pages, extracts structured facts with Claude, validates them with pydantic
- `db.py` — shared storage; facts are keyed on (language, region, period, source) so conflicting sources coexist

See [crawler/README.md](crawler/README.md) for setup and usage.

## Project structure

```
src/
  App.jsx                     # header, tab nav, routes
  components/
    MapView.jsx               # MapLibre map with state fill/highlight layers
    InfoPanel.jsx             # state detail side panel
    LanguageProfile.jsx       # single language profile card
    LanguageSearch.jsx        # typeahead for map language search
    MultiLanguagePicker.jsx   # multi-select picker for the compare tool
    contribute/
      fields.jsx              # shared form primitives (inputs, honeypot, status)
      FlagWordModal.jsx       # flag/correct a single word from the compare table
      WordListEditor.jsx      # grid of inputs for the master word list
    tabs/
      Home.jsx                # landing page
      MapExplorer.jsx         # map + search + info panel layout
      CompareLanguages.jsx    # word table + similarity tree
      PhylogeneticTree.jsx    # SVG dendrogram renderer
      Admin.jsx               # magic-link login + submission review queue
      Blog.jsx                # placeholder
  context/ThemeContext.jsx    # dark mode state, persisted
  data/                       # all language data (see Data model)
  lib/supabase.js             # Supabase client (null when unconfigured)
  lib/submissions.js          # submit RPC wrapper + admin queries
  utils/phylogenetics.js      # normalization, Levenshtein, UPGMA clustering
scripts/sync-approved.mjs     # applies approved submissions to the JSON files
supabase/schema.sql           # submissions table, RLS, submit_suggestion RPC
crawler/                      # experimental data-harvesting pipeline (Python)
public/data/                  # state boundary GeoJSON
```

## Roadmap

- Fill in word lists for more of the 239 catalogued Nigerian languages
- Move beyond lexical similarity toward tracing shared word origins across languages
- Data validation script to catch dangling cross-references between the JSON files
- Connect the crawler pipeline to the app data for sourced, semi-automated growth
- Blog with articles and research notes
