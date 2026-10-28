// Lexical similarity between two ASJP 40-word lists, after Wichmann et al.'s
// LDND: the average normalized Levenshtein distance between same-meaning words,
// divided by the average distance between different-meaning words. Dividing out
// the second term cancels the look-alikes any two languages get by chance from
// sharing short words and common sounds, so unrelated pairs land near 0.

// ASJPcode modifiers (* nasal, " glottalized, ~ and $ combining marks) are
// dropped, as in ASJP's own distance computation.
function cleanForms(cell) {
  if (!cell) return null
  const forms = cell
    .split(',')
    .map((f) => f.replace(/[*"~$\s]/g, ''))
    .filter(Boolean)
  return forms.length ? forms : null
}

/** Pre-clean a word list's ASJPcode forms once, so comparisons stay cheap. */
export function prepareWordList(asjpForms) {
  return asjpForms.map(cleanForms)
}

function levenshtein(a, b) {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = curr
  }
  return prev[b.length]
}

/** Normalized distance (0 = identical, 1 = nothing shared) between the closest synonyms. */
function wordDistance(formsA, formsB) {
  let best = 1
  for (const a of formsA) {
    for (const b of formsB) {
      const d = levenshtein(a, b) / Math.max(a.length, b.length)
      if (d < best) best = d
    }
  }
  return best
}

// Below this many shared meanings the score is too noisy to show.
const MIN_SHARED = 15
// Different-meaning baseline: each word against the words 1–5 places along,
// a sample of the full 40×39 pairing that keeps one comparison under a millisecond.
const BASELINE_OFFSETS = [1, 2, 3, 4, 5]

/**
 * Similarity of two prepared word lists, 0 (no more alike than chance) to 1
 * (identical), or null when they share too few meanings to say.
 */
export function lexicalSimilarity(a, b) {
  const shared = []
  for (let i = 0; i < a.length; i++) if (a[i] && b[i]) shared.push(i)
  if (shared.length < MIN_SHARED) return null

  let same = 0
  for (const i of shared) same += wordDistance(a[i], b[i])
  same /= shared.length

  let different = 0
  let pairs = 0
  for (const offset of BASELINE_OFFSETS) {
    for (let k = 0; k < shared.length; k++) {
      different += wordDistance(a[shared[k]], b[shared[(k + offset) % shared.length]])
      pairs++
    }
  }
  different /= pairs

  return Math.max(0, Math.min(1, 1 - same / different))
}

/** Meanings whose words look alike (≤ half the sounds differ), for the side-by-side list. */
export function lookAlikeWords(a, b) {
  const result = []
  for (let i = 0; i < a.length; i++) {
    if (a[i] && b[i]) result[i] = wordDistance(a[i], b[i]) <= 0.5
  }
  return result
}

// Plain-language bands for a general audience, calibrated on known pairs:
// Efik–Ibibio 0.82, Zulu–Xhosa 0.60, Bini–Esan 0.45, Yoruba–Isekiri 0.42,
// Igbo–Ikwere 0.32, Swahili–Zulu 0.20, Akan–Ewe 0.11, Yoruba–Igbo 0.10,
// Hausa–Amharic 0.02, Yoruba–Hausa 0.
export const SIMILARITY_BANDS = [
  { min: 0.5, label: 'Very close', note: 'Often mutually understandable, or dialects of one language' },
  { min: 0.3, label: 'Close relatives', note: 'Many basic words are clearly shared' },
  { min: 0.15, label: 'Related', note: 'A noticeable share of basic words match' },
  { min: 0.06, label: 'Distantly related', note: 'Only a few traces of shared vocabulary' },
  { min: 0, label: 'No clear similarity', note: 'About what you would expect by chance' },
]

export function similarityBand(score) {
  return SIMILARITY_BANDS.find((band) => score >= band.min)
}
