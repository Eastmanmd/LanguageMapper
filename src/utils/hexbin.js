// Groups points into a grid of hexagons that look regular on a web-mercator
// map: binning happens in mercator space, then vertices go back to lon/lat.

const toMercator = (lon, lat) => [
  (lon * Math.PI) / 180,
  Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
]
const fromMercator = (x, y) => [(x * 180) / Math.PI, (Math.atan(Math.exp(y)) * 360) / Math.PI - 90]

/** Axial coordinates of the pointy-top hexagon of radius `r` containing (x, y). */
function hexAt(x, y, r) {
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / r
  const s = ((2 / 3) * y) / r
  // Round in cube coordinates so points near an edge land in the nearest hexagon.
  let rq = Math.round(q)
  let rs = Math.round(s)
  const rt = Math.round(-q - s)
  const dq = Math.abs(rq - q)
  const ds = Math.abs(rs - s)
  const dt = Math.abs(rt - (-q - s))
  if (dq > ds && dq > dt) rq = -rs - rt
  else if (ds > dt) rs = -rq - rt
  return [rq, rs]
}

function hexPolygon(q, s, r) {
  const cx = r * Math.sqrt(3) * (q + s / 2)
  const cy = r * 1.5 * s
  const ring = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    ring.push(fromMercator(cx + r * Math.cos(angle), cy + r * Math.sin(angle)))
  }
  ring.push(ring[0])
  return [ring]
}

/**
 * Bins `items` (each with lon/lat) into hexagons of radius `radius` (radians
 * of longitude at the equator). Returns one entry per occupied hexagon with
 * its polygon and members, for the caller to summarise.
 */
export function hexbin(items, radius) {
  const bins = new Map()
  for (const item of items) {
    const [x, y] = toMercator(item.lon, item.lat)
    const [q, s] = hexAt(x, y, radius)
    const key = `${q},${s}`
    if (!bins.has(key)) bins.set(key, { key, q, s, members: [] })
    bins.get(key).members.push(item)
  }
  return [...bins.values()].map((bin) => ({ ...bin, polygon: hexPolygon(bin.q, bin.s, radius) }))
}

/** Upper bounds for five classes, from the data's quantiles (rounded to whole numbers when counting). */
export function quantileBreaks(values, integer = false) {
  const sorted = [...values].sort((a, b) => a - b)
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
  const breaks = [0.2, 0.4, 0.6, 0.8].map(at)
  const cleaned = integer ? breaks.map(Math.round) : breaks
  // Equal neighbours would make empty classes; nudge them apart.
  for (let i = 1; i < cleaned.length; i++) if (cleaned[i] <= cleaned[i - 1]) cleaned[i] = cleaned[i - 1] + (integer ? 1 : 0.01)
  return cleaned
}
