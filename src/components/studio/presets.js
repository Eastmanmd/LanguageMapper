// Starting points for Map Studio. Each sets every option, so picking one gives
// a finished map that people can then tweak.

export const DEFAULT_STATE = {
  base: 'light',
  layer: 'families',
  overlays: ['borders'],
  focus: null,
  endangered: false,
  hex: 'medium',
  country: null,
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
      overlays: ['borders', 'dots'],
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

export const presetState = (id) => {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0]
  return { ...DEFAULT_STATE, ...preset.state }
}

// ---- Shareable links: the whole map lives in the URL ----

const OVERLAYS = ['dots', 'water', 'borders', 'labels']

export function stateToParams(state) {
  const p = new URLSearchParams()
  p.set('base', state.base)
  p.set('layer', state.layer)
  p.set('ov', state.overlays.filter((o) => OVERLAYS.includes(o)).join(','))
  if (state.focus) p.set('focus', state.focus)
  if (state.endangered) p.set('endangered', '1')
  if (state.hex !== 'medium') p.set('hex', state.hex)
  if (state.country) p.set('country', state.country)
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
  return {
    ...DEFAULT_STATE,
    base: params.get('base') ?? DEFAULT_STATE.base,
    layer: params.get('layer'),
    overlays: (params.get('ov') ?? '').split(',').filter((o) => OVERLAYS.includes(o)),
    focus: params.get('focus'),
    endangered: params.get('endangered') === '1',
    hex: params.get('hex') ?? 'medium',
    country: params.get('country'),
    title: params.get('title') ?? '',
    subtitle: params.get('sub') ?? '',
    frame: params.get('frame') ?? 'wide',
    legend: params.get('legend') !== '0',
    view: view?.length === 3 && view.every(Number.isFinite) ? { center: [view[0], view[1]], zoom: view[2] } : null,
  }
}
