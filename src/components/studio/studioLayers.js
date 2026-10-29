// Map Studio's layers. Each builder turns the atlas data into GeoJSON with a
// `color` and a hover `tip` per feature, plus the legend and the credits the
// layer needs. The map component only draws what it's given.

import {
  CATEGORICAL,
  DIVERGING,
  FADED,
  OTHER,
  SEQUENTIAL_BLUE,
  SEQUENTIAL_ORANGE,
} from '../../utils/atlasColors'
import { countryName } from '../../utils/countries'
import { hexbin, quantileBreaks } from '../../utils/hexbin'

export const CREDITS = {
  borders: 'Borders, rivers and lakes: Natural Earth',
  glottolog: 'Languages: Glottolog 5.2.1 (CC BY 4.0)',
  cldr: 'Official languages, scripts: Unicode CLDR 48',
  pew: 'Religion: Pew Research Center (2025), via Our World in Data',
  terrain: 'Elevation: Mapzen Terrain Tiles on AWS (SRTM, GMTED, ETOPO1 and others)',
  streets: '© OpenStreetMap contributors, OpenFreeMap',
}

export const MAIN_LAYERS = [
  { id: 'none', label: 'Nothing (base map only)', group: 'Base' },
  { id: 'families', label: 'Language families (dots)', group: 'Languages', kind: 'dots' },
  { id: 'territories', label: 'Family areas (approximate)', group: 'Languages', kind: 'hex' },
  { id: 'density', label: 'Language density', group: 'Languages', kind: 'hex' },
  { id: 'endangerment', label: 'Endangered languages', group: 'Languages', kind: 'hex' },
  { id: 'perCountry', label: 'Languages per country', group: 'Countries', kind: 'country' },
  { id: 'official', label: 'Official languages', group: 'Countries', kind: 'country' },
  { id: 'scripts', label: 'Writing scripts', group: 'Countries', kind: 'country' },
  { id: 'religion', label: 'Largest religion', group: 'Countries', kind: 'country' },
  { id: 'religionBalance', label: 'Christian–Muslim balance', group: 'Countries', kind: 'country' },
]

export const HEX_RADIUS = { small: 0.012, medium: 0.02, large: 0.034 }

const OFFICIAL_ORDER = [
  'European',
  'European + African',
  'African',
  'Arabic',
  'Arabic + African',
  'Arabic + European',
  'Arabic + European + African',
]
const OFFICIAL_LABELS = {
  European: 'European language only',
  'European + African': 'European and African languages',
  African: 'African languages only',
  Arabic: 'Arabic only',
  'Arabic + African': 'Arabic and African languages',
  'Arabic + European': 'Arabic and a European language',
  'Arabic + European + African': 'Arabic, European and African',
}
const SCRIPT_ORDER = ['Latn', 'Arab', 'Ethi', 'Latn+Arab', 'Latn+Ethi']
const RELIGIONS = [
  { key: 'christian', label: 'Christian' },
  { key: 'muslim', label: 'Muslim' },
  { key: 'other', label: 'Folk and other religions' },
  { key: 'unaffiliated', label: 'Unaffiliated' },
]

const pctText = (n) => `${Math.round(n)}%`
const classOf = (value, breaks) => {
  const i = breaks.findIndex((b) => value <= b)
  return i === -1 ? breaks.length : i
}
// Counts are whole numbers, so their classes read "1", "2–3", "13+" rather than overlapping ranges.
const countLabels = (breaks) =>
  [0, ...breaks].map((lo, i) => {
    const from = i === 0 ? 1 : lo + 1
    const to = breaks[i]
    if (to === undefined) return `${from}+`
    return from === to ? String(from) : `${from}–${to}`
  })
const rangeLabels = (breaks, format) =>
  [0, ...breaks].map((lo, i) => {
    const hi = breaks[i]
    if (i === 0) return `up to ${format(hi)}`
    if (hi === undefined) return `over ${format(lo)}`
    return `${format(lo)}–${format(hi)}`
  })

/** The languages a language layer draws: inside the family focus and passing the filter. */
export function visibleLanguages({ atlas, focus, endangeredOnly }) {
  const { tree } = atlas
  return atlas.languages.filter(
    (l) =>
      (!focus || tree.lineage(l.p).includes(focus)) && (!endangeredOnly || (l.e >= 1 && l.e <= 4)),
  )
}

/** Colour slots for the family focus's branches, as the atlas legend assigns them. */
export function familyBranches({ atlas, focus }) {
  return atlas.tree.branches(focus).map((b, i) => ({ ...b, slot: i < CATEGORICAL.light.length ? i : null }))
}

function familyColorer(ctx) {
  const branches = familyBranches(ctx)
  const ids = new Set(branches.map((b) => b.id))
  const byId = new Map(branches.map((b) => [b.id, b]))
  return (lang) => {
    const branch = byId.get(ctx.atlas.tree.branchOf(lang, ids))
    const color = branch?.slot == null ? OTHER[ctx.theme] : CATEGORICAL[ctx.theme][branch.slot]
    return { branch, color }
  }
}

function familyLegend(ctx, title) {
  const branches = familyBranches(ctx)
  const visible = new Set(visibleLanguages(ctx).map((l) => l.g))
  const counts = new Map()
  const ids = new Set(branches.map((b) => b.id))
  for (const lang of ctx.atlas.languages) {
    if (!visible.has(lang.g)) continue
    const id = ctx.atlas.tree.branchOf(lang, ids)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const colored = branches.filter((b) => b.slot != null && counts.get(b.id))
  const otherCount = branches.filter((b) => b.slot == null).reduce((sum, b) => sum + (counts.get(b.id) ?? 0), 0)
  return {
    title,
    items: [
      ...colored.map((b) => ({ color: CATEGORICAL[ctx.theme][b.slot], label: b.name, value: counts.get(b.id) })),
      ...(otherCount ? [{ color: OTHER[ctx.theme], label: 'Smaller groups', value: otherCount }] : []),
    ],
  }
}

export function buildDots(ctx, colorByFamily) {
  const color = familyColorer(ctx)
  const { tree } = ctx.atlas
  return {
    type: 'FeatureCollection',
    features: visibleLanguages(ctx).map((lang) => {
      const lineage = tree.lineage(lang.p)
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lang.lon, lang.lat] },
        properties: {
          color: colorByFamily ? color(lang).color : ctx.theme === 'dark' ? '#e5e5e5' : '#262626',
          tip: [lang.n, tree.name(lineage[1] ?? lineage[0]), lang.c.slice(0, 3).map(countryName).join(', ')]
            .filter(Boolean)
            .join('\n'),
        },
      }
    }),
  }
}

function buildHex(ctx, layerId) {
  const langs = visibleLanguages(ctx)
  const bins = hexbin(langs, HEX_RADIUS[ctx.hexSize])
  const theme = ctx.theme
  let colorOf
  let legend
  if (layerId === 'territories') {
    const color = familyColorer(ctx)
    colorOf = (bin) => {
      const tally = new Map()
      for (const lang of bin.members) {
        const { branch, color: c } = color(lang)
        const key = branch?.id ?? 'other'
        tally.set(key, { c, name: branch?.name ?? 'Other', n: (tally.get(key)?.n ?? 0) + 1 })
      }
      const [top] = [...tally.values()].sort((a, b) => b.n - a.n)
      return { color: top.c, tip: `${top.name}: ${top.n} of ${bin.members.length} languages here` }
    }
    legend = {
      ...familyLegend(ctx, 'Most common family in each area'),
      note: 'Each hexagon takes the colour of the family most of its languages belong to. Areas are approximate: languages are points, not territories.',
    }
  } else if (layerId === 'density') {
    const breaks = quantileBreaks(bins.map((b) => b.members.length), true)
    colorOf = (bin) => ({
      color: SEQUENTIAL_BLUE[theme][classOf(bin.members.length, breaks)],
      tip: `${bin.members.length} language${bin.members.length === 1 ? '' : 's'} here`,
    })
    legend = {
      title: 'Languages per area',
      items: countLabels(breaks).map((label, i) => ({ color: SEQUENTIAL_BLUE[theme][i], label })),
    }
  } else {
    const share = (bin) => bin.members.filter((l) => l.e >= 1 && l.e <= 4).length / bin.members.length
    const breaks = [0.2, 0.4, 0.6, 0.8]
    colorOf = (bin) =>
      bin.members.length < 2
        ? { color: FADED[theme], tip: `${bin.members[0].n}: too few languages here to give a share` }
        : {
            color: SEQUENTIAL_ORANGE[theme][classOf(share(bin), breaks)],
            tip: `${pctText(share(bin) * 100)} endangered (${bin.members.length} languages)`,
          }
    legend = {
      title: 'Share of languages that are endangered',
      items: [
        ...rangeLabels([20, 40, 60, 80], (n) => `${n}%`).map((label, i) => ({ color: SEQUENTIAL_ORANGE[theme][i], label })),
        { color: FADED[theme], label: 'Only one language here' },
      ],
    }
  }
  return {
    kind: 'hex',
    data: {
      type: 'FeatureCollection',
      features: bins.map((bin) => {
        const { color, tip } = colorOf(bin)
        return { type: 'Feature', geometry: { type: 'Polygon', coordinates: bin.polygon }, properties: { color, tip } }
      }),
    },
    legend,
    credits: [CREDITS.glottolog],
  }
}

function buildCountry(ctx, layerId) {
  const { studio, borders, atlas, theme } = ctx
  const perCountry = new Map()
  if (layerId === 'perCountry') for (const l of atlas.languages) for (const c of l.c) perCountry.set(c, (perCountry.get(c) ?? 0) + 1)
  const perCountryBreaks = quantileBreaks([...perCountry.values()], true)

  const valueOf = (code) => {
    const info = studio.countries[code]
    const name = countryName(code)
    if (!info) return { color: FADED[theme], tip: `${name}\nNo data` }
    switch (layerId) {
      case 'perCountry': {
        const n = perCountry.get(code) ?? 0
        return { color: SEQUENTIAL_BLUE[theme][classOf(n, perCountryBreaks)], tip: `${name}\n${n} languages` }
      }
      case 'official': {
        const i = OFFICIAL_ORDER.indexOf(info.officialType)
        const list = info.official.map((o) => (o.status === 'official' ? o.name : `${o.name} (${o.status})`)).join(', ')
        return { color: i === -1 ? FADED[theme] : CATEGORICAL[theme][i], tip: `${name}\n${list || 'No official language recorded'}` }
      }
      case 'scripts': {
        const i = SCRIPT_ORDER.indexOf(info.mainScript)
        const label = info.mainScript?.split('+').map((s) => studio.scriptNames[s]).join(' and ')
        const others = info.otherScripts.filter((s) => !label?.includes(s))
        return {
          color: i === -1 ? FADED[theme] : CATEGORICAL[theme][i],
          tip: `${name}\nMostly written in ${label ?? 'unknown'}${others.length ? `\nAlso: ${others.join(', ')}` : ''}`,
        }
      }
      case 'religion':
      case 'religionBalance': {
        const r = info.religion
        if (!r) return { color: FADED[theme], tip: `${name}\nNo data` }
        const tip = `${name}\n${RELIGIONS.map((x) => `${x.label} ${pctText(r[x.key])}`).join('\n')}`
        if (layerId === 'religion') {
          const top = RELIGIONS.reduce((best, x) => (r[x.key] > r[best.key] ? x : best))
          return { color: CATEGORICAL[theme][RELIGIONS.indexOf(top)], tip }
        }
        const balance = r.muslim - r.christian
        const step = balance <= -60 ? 0 : balance <= -15 ? 1 : balance < 15 ? 2 : balance < 60 ? 3 : 4
        return { color: DIVERGING[theme][step], tip }
      }
      default:
        return { color: FADED[theme], tip: name }
    }
  }

  const legends = {
    perCountry: {
      title: 'Languages spoken in each country',
      items: countLabels(perCountryBreaks).map((label, i) => ({ color: SEQUENTIAL_BLUE[theme][i], label })),
    },
    official: {
      title: 'Official languages (official or de facto)',
      items: OFFICIAL_ORDER.filter((t) => Object.values(studio.countries).some((c) => c.officialType === t)).map((t) => ({
        color: CATEGORICAL[theme][OFFICIAL_ORDER.indexOf(t)],
        label: OFFICIAL_LABELS[t],
      })),
      note: 'Counts African languages that are official in a region, like South Africa’s eleven.',
    },
    scripts: {
      title: 'Main writing script',
      items: SCRIPT_ORDER.map((s, i) => ({
        color: CATEGORICAL[theme][i],
        label: s.split('+').map((x) => studio.scriptNames[x]).join(' and '),
      })),
      note: 'Hover a country for the other scripts in use there, like Tifinagh, N’Ko, Vai, Adlam or Bamum.',
    },
    religion: {
      title: 'Largest religious group (2020)',
      items: RELIGIONS.map((x, i) => ({ color: CATEGORICAL[theme][i], label: x.label })),
      note: 'Country totals hide large differences inside countries, such as Nigeria’s north and south.',
    },
    religionBalance: {
      title: 'Christians and Muslims (2020)',
      items: [
        'Mostly Christian',
        'More Christians',
        'Close to even',
        'More Muslims',
        'Mostly Muslim',
      ].map((label, i) => ({ color: DIVERGING[theme][i], label })),
      note: 'Country totals hide large differences inside countries, such as Nigeria’s north and south.',
    },
  }

  return {
    kind: 'country',
    data: {
      type: 'FeatureCollection',
      features: borders.features.map((f) => ({ ...f, properties: { ...f.properties, ...valueOf(f.properties.c) } })),
    },
    legend: legends[layerId],
    credits: [
      layerId === 'perCountry' ? CREDITS.glottolog : layerId.startsWith('religion') ? CREDITS.pew : CREDITS.cldr,
    ],
  }
}

/** Everything the map needs to draw the chosen main layer. */
export function buildMainLayer(layerId, ctx) {
  const def = MAIN_LAYERS.find((l) => l.id === layerId)
  if (!def || !def.kind) return { kind: null, legend: null, credits: [] }
  if (def.kind === 'dots') {
    return {
      kind: 'dots',
      data: buildDots(ctx, true),
      legend: familyLegend(ctx, ctx.focus ? `Branches of ${ctx.atlas.tree.name(ctx.focus)}` : 'Language families'),
      credits: [CREDITS.glottolog],
    }
  }
  if (def.kind === 'hex') return buildHex(ctx, layerId)
  return buildCountry(ctx, layerId)
}
