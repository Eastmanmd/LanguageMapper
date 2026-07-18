# LanguageMap

A tool for mapping and reconstructing the shared origins of words across diverse languages, starting with the languages of Africa. Compare vocabulary side by side, explore how languages relate, and see where they are spoken. The focus today is Nigeria — all 37 states (including the FCT) with 239 catalogued languages — with the project built to spread to other regions of Africa and beyond.

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
- Currently 15 languages have word lists: Hausa, Yoruba, Igbo, Fulfulde, Edo, Idoma, Ibibio, Ijaw (Izon), Tiv, Ikwerre, Kanuri, plus Swahili, Luganda, Wolof, and Twi for cross-regional comparison.
- Selections live in the URL (`/compare?langs=yoruba,igbo,twi`) for sharing.

The tree is a simple lexical-similarity illustration, not a rigorous historical-linguistic classification.

### Blog (`/blog`)

Placeholder — articles and research notes are coming soon.

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vite.dev/) with [React Router](https://reactrouter.com/) for tab/URL routing
- [MapLibre GL JS](https://maplibre.org/) with [OpenFreeMap](https://openfreemap.org/) vector tiles
- [Tailwind CSS 4](https://tailwindcss.com/) with class-based dark mode
- [Oxlint](https://oxc.rs/) for linting
- No backend — the whole app is a static site; all data ships as JSON

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # run oxlint
```

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
    tabs/
      Home.jsx                # landing page
      MapExplorer.jsx         # map + search + info panel layout
      CompareLanguages.jsx    # word table + similarity tree
      PhylogeneticTree.jsx    # SVG dendrogram renderer
      Blog.jsx                # placeholder
  context/ThemeContext.jsx    # dark mode state, persisted
  data/                       # all language data (see Data model)
  utils/phylogenetics.js      # normalization, Levenshtein, UPGMA clustering
crawler/                      # experimental data-harvesting pipeline (Python)
public/data/                  # state boundary GeoJSON
```

## Roadmap

- Expand to other African regions, starting with West Africa (the data model already supports it)
- Move beyond lexical similarity toward tracing shared word origins across languages
- Data validation script to catch dangling cross-references between the JSON files
- Connect the crawler pipeline to the app data for sourced, semi-automated growth
- Blog with articles and research notes
