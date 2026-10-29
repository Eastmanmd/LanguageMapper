const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

/** English name for an ISO 3166-1 alpha-2 code, e.g. "NG" → "Nigeria". */
export function countryName(code) {
  return regionNames.of(code) ?? code
}

/** [[west, south], [east, north]] around a set of languages' dots. */
export function boundsOf(languages) {
  const lons = languages.map((l) => l.lon)
  const lats = languages.map((l) => l.lat)
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ]
}
