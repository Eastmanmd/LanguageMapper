function normalize(word) {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics/tone marks
    .toLowerCase()
    .replace(/[^a-z]/g, '') // drop spaces, apostrophes, etc.
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      )
    }
    prev = curr
  }
  return prev[n]
}

function wordSimilarity(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na.length && !nb.length) return null
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return null
  return 1 - levenshtein(na, nb) / maxLen
}

/** Average per-word similarity between two languages' word maps, ignoring
 * words either language is missing. Returns null if there's no overlap. */
export function languageSimilarity(wordsA, wordsB, wordIds) {
  let total = 0
  let count = 0
  for (const id of wordIds) {
    const a = wordsA[id]
    const b = wordsB[id]
    if (!a || !b) continue
    const sim = wordSimilarity(a, b)
    if (sim === null) continue
    total += sim
    count += 1
  }
  return count === 0 ? null : total / count
}

/** UPGMA hierarchical clustering over a distance matrix.
 * languageIds: string[]
 * distance(idA, idB): number
 * Returns a tree: { id?, children?: [tree, tree], height, label? } */
export function buildTree(languageIds, distanceFn) {
  let clusters = languageIds.map((id) => ({
    label: id,
    height: 0,
    members: [id],
    children: null,
  }))

  if (clusters.length === 1) return clusters[0]

  while (clusters.length > 1) {
    let best = null
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = averageDistance(clusters[i], clusters[j], distanceFn)
        if (best === null || d < best.d) {
          best = { i, j, d }
        }
      }
    }
    const { i, j, d } = best
    const merged = {
      label: null,
      height: d / 2,
      members: [...clusters[i].members, ...clusters[j].members],
      children: [clusters[i], clusters[j]],
    }
    clusters = clusters.filter((_, idx) => idx !== i && idx !== j)
    clusters.push(merged)
  }
  return clusters[0]
}

function averageDistance(clusterA, clusterB, distanceFn) {
  let total = 0
  let count = 0
  for (const a of clusterA.members) {
    for (const b of clusterB.members) {
      total += distanceFn(a, b)
      count += 1
    }
  }
  return total / count
}
