// Starting points for Map Studio. Each sets every option, so picking one gives
// a finished map that people can then tweak.

// What can differ between two compared maps. Everything else is shared.
export const DEFAULT_MAP = {
  layer: 'families',
  focus: null,
  endangered: false,
  hex: 'medium',
  country: null,
  dots: false,
  spoken: null,
}

const DEFAULT_SHARED = {
  base: 'light',
  overlays: ['borders'],
  title: 'Africa’s language families',
  subtitle: 'Every dot is one of more than 2,200 languages',
  frame: 'wide',
  legend: true,
  view: null,
}

export const PRESETS = [
  {
    id: 'families',
    name: 'Language families',
    blurb: 'Every language as a dot, coloured by family',
    state: {},
  },
  {
    id: 'refuges',
    name: 'Mountains as refuges',
    blurb: 'Language density over the terrain',
    state: {
      base: 'terrain',
      layer: 'density',
      overlays: ['water'],
      hex: 'small',
      title: 'Mountains as language refuges',
      subtitle: 'Highlands like the Jos Plateau, the Nuba Mountains and Ethiopia are packed with languages',
    },
  },
  {
    id: 'bantu',
    name: 'The Bantu expansion',
    blurb: 'Bantu branches across central and southern Africa',
    state: {
      base: 'terrain',
      layer: 'families',
      overlays: ['water', 'borders'],
      focus: 'narr1281',
      title: 'The Bantu expansion',
      subtitle: 'Over 500 Bantu languages, coloured by branch, spread from the Nigeria–Cameroon border',
    },
  },
  {
    id: 'scripts',
    name: 'Writing systems',
    blurb: 'Latin, Arabic, Ge’ez and more',
    state: {
      layer: 'scripts',
      overlays: ['borders', 'labels'],
      title: 'How Africa writes',
      subtitle: 'The main script in each country, by speakers of its languages',
    },
  },
  {
    id: 'official',
    name: 'Official vs spoken',
    blurb: 'Official languages, with every spoken language on top',
    state: {
      layer: 'official',
      overlays: ['borders'],
      dots: true,
      title: 'Official languages, spoken languages',
      subtitle: 'Most countries govern in a European language; each dot is a language people speak',
    },
  },
  {
    id: 'religion',
    name: 'Religion',
    blurb: 'Christians and Muslims across the continent',
    state: {
      layer: 'religionBalance',
      overlays: ['borders', 'labels'],
      title: 'Christians and Muslims in Africa',
      subtitle: 'Share of each country’s people in 2020',
    },
  },
  {
    id: 'risk',
    name: 'Languages at risk',
    blurb: 'Where endangered languages cluster',
    state: {
      base: 'dark',
      layer: 'endangerment',
      overlays: ['borders'],
      title: 'Languages at risk',
      subtitle: 'Share of each area’s languages that fewer children are learning',
    },
  },
]

function splitPreset(id) {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0]
  const map = { ...DEFAULT_MAP }
  const shared = { ...DEFAULT_SHARED }
  for (const [key, value] of Object.entries(preset.state)) (key in DEFAULT_MAP ? map : shared)[key] = value
  return { map, shared }
}

export const presetState = (id) => {
  const { map, shared } = splitPreset(id)
  return { ...shared, a: map, b: null }
}

// While comparing, a preset fills one map and sets the shared look, but keeps
// the title: it no longer describes both maps.
export const presetOnMap = (state, id, mapId) => {
  const { map, shared } = splitPreset(id)
  return { ...state, base: shared.base, overlays: shared.overlays, [mapId]: map }
}

// ---- Shareable links: the whole map lives in the URL ----

const SHARED_OVERLAYS = ['water', 'borders', 'labels']

function mapToParams(p, map, prefix) {
  if (map.focus) p.set(`${prefix}focus`, map.focus)
  if (map.endangered) p.set(`${prefix}endangered`, '1')
  if (map.hex !== 'medium') p.set(`${prefix}hex`, map.hex)
  if (map.country) p.set(`${prefix}country`, map.country)
  if (map.spoken) p.set(`${prefix}spoken`, map.spoken)
}

function paramsToMap(params, prefix) {
  return {
    layer: params.get(`${prefix}layer`),
    focus: params.get(`${prefix}focus`),
    endangered: params.get(`${prefix}endangered`) === '1',
    hex: params.get(`${prefix}hex`) ?? 'medium',
    country: params.get(`${prefix}country`),
    dots: false,
    spoken: params.get(`${prefix}spoken`),
  }
}

export function stateToParams(state) {
  const p = new URLSearchParams()
  p.set('base', state.base)
  p.set('layer', state.a.layer)
  // Map A's dots stay in `ov`, so single-map links read as they always have.
  p.set('ov', [...state.overlays, ...(state.a.dots ? ['dots'] : [])].join(','))
  mapToParams(p, state.a, '')
  if (state.b) {
    p.set('b.layer', state.b.layer)
    if (state.b.dots) p.set('b.dots', '1')
    mapToParams(p, state.b, 'b.')
  }
  if (state.title) p.set('title', state.title)
  if (state.subtitle) p.set('sub', state.subtitle)
  if (state.frame !== 'wide') p.set('frame', state.frame)
  if (!state.legend) p.set('legend', '0')
  if (state.view?.center) {
    const [lon, lat] = state.view.center
    p.set('view', `${lon.toFixed(2)},${lat.toFixed(2)},${state.view.zoom.toFixed(2)}`)
  }
  return p
}

export function paramsToState(params) {
  if (!params.has('layer')) return null
  const view = params.get('view')?.split(',').map(Number)
  const overlays = (params.get('ov') ?? '').split(',')
  return {
    ...DEFAULT_SHARED,
    base: params.get('base') ?? DEFAULT_SHARED.base,
    overlays: overlays.filter((o) => SHARED_OVERLAYS.includes(o)),
    a: { ...paramsToMap(params, ''), dots: overlays.includes('dots') },
    b: params.has('b.layer') ? { ...paramsToMap(params, 'b.'), dots: params.get('b.dots') === '1' } : null,
    title: params.get('title') ?? '',
    subtitle: params.get('sub') ?? '',
    frame: params.get('frame') ?? 'wide',
    legend: params.get('legend') !== '0',
    view: view?.length === 3 && view.every(Number.isFinite) ? { center: [view[0], view[1]], zoom: view[2] } : null,
  }
}
