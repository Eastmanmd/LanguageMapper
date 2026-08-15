# LanguageMapper

A tool for mapping and reconstructing the shared origins of words across the languages of Nigeria. Compare vocabulary side by side, explore how languages relate, and see where they are spoken — all 37 states (including the FCT) with 239 catalogued languages across the Niger-Congo, Afro-Asiatic, and Nilo-Saharan families.

**Live features:** interactive state map · language profiles · side-by-side word comparison · lexical similarity tree · dark mode

## Features

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

### Contribute (`/contribute`)

Community submissions, all reviewed by the admin before going live:

- **Flag a word** — hover any cell in the comparison table and click the flag to suggest a correction (or propose a value for an empty cell).
- **Fill in a word list** — pick any of the 239 languages and fill in its missing words from the master list; only new or changed entries are submitted.
- **Add a new language** — name, classification, ethnic groups, states where spoken, description, and optionally its word list.

Every form takes an optional contributor name, email, and source citation. Submissions are validated client- and server-side, rate-limited per IP, and identical pending suggestions are merged with a counter.

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

Without this, the app runs fine but the contribution forms and `/admin` show a "not configured" notice.

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

All app data lives in three JSON files plus one GeoJSON:

| File | Contents |
|---|---|
| `src/data/languages.json` | Language profiles keyed by id: name, classification, ethnic groups, similar-language ids, description |
| `src/data/stateLanguages.json` | State id (ISO 3166-2, e.g. `NG-KN`) → array of language ids spoken there |
| `src/data/wordComparison.json` | Master word list (23 word ids) and per-language word maps for the comparison tool |
| `public/data/nigeria-states.geojson` | State boundary polygons with `state_id` and `name` properties |

### Adding a language

1. Add a profile entry to `src/data/languages.json` (id, name, classification, ethnicGroups, similarLanguages, description).
2. Add its id to the relevant states in `src/data/stateLanguages.json`.
3. Optionally, add a word map to `src/data/wordComparison.json` to include it in the comparison tool. Missing words are fine — the similarity score is computed over whichever words both languages have.

Language ids are lowercase-kebab-case and must match across all three files.

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
      Contribute.jsx          # fill-words and new-language submission forms
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
