import { buildTree } from './atlasTree'

const DATA_URL = `${import.meta.env.BASE_URL}data/africa/`
const cache = new Map()

// Each file loads once per visit; pages share the result (and the browser's
// cache makes later visits quick too).
function loadJson(file) {
  if (!cache.has(file)) cache.set(file, fetch(`${DATA_URL}${file}`).then((res) => res.json()))
  return cache.get(file)
}

export const loadAtlas = () => {
  if (!cache.has('atlas')) cache.set('atlas', loadJson('languages.json').then((data) => ({ ...data, tree: buildTree(data) })))
  return cache.get('atlas')
}
export const loadBorders = () => loadJson('borders.geojson')
export const loadStudio = () => loadJson('studio.json')
export const loadWater = () => loadJson('water.geojson')
