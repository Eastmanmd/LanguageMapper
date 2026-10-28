// Helpers over the atlas family tree (public/data/africa/languages.json):
// `nodes` maps a group id to { n: name, p: parent id }, and each language's
// `p` is the innermost group it belongs to. Ids starting with "x-" are the four
// traditional macro-groups plus "Other languages", which sit at the root.

export function buildTree({ nodes, languages }) {
  const children = new Map()
  const addChild = (parent, child) => {
    if (!children.has(parent)) children.set(parent, [])
    children.get(parent).push(child)
  }
  for (const [id, node] of Object.entries(nodes)) addChild(node.p ?? null, id)
  for (const lang of languages) addChild(lang.p, lang.g)

  const lineageCache = new Map()
  // Group ids from the root down to `id` (inclusive).
  const lineage = (id) => {
    if (!lineageCache.has(id)) {
      const path = []
      for (let cur = id; cur; cur = nodes[cur]?.p) path.unshift(cur)
      lineageCache.set(id, path)
    }
    return lineageCache.get(id)
  }

  const languageCount = new Map()
  for (const lang of languages) {
    for (const id of lineage(lang.p)) languageCount.set(id, (languageCount.get(id) ?? 0) + 1)
  }

  const byId = new Map(languages.map((l) => [l.g, l]))

  // Glottolog has long single-child chains (Nigerian Pidgin sits 15 levels deep).
  // Drilling in skips them so every step splits the languages into ≥ 2 groups.
  const skipSingleChild = (id) => {
    let cur = id
    for (;;) {
      const kids = children.get(cur) ?? []
      if (kids.length !== 1 || !nodes[kids[0]]) return cur
      cur = kids[0]
    }
  }

  return {
    nodes,
    byId,
    name: (id) => nodes[id]?.n ?? byId.get(id)?.n ?? id,
    count: (id) => languageCount.get(id) ?? (byId.has(id) ? 1 : 0),
    isGroup: (id) => id in nodes,
    lineage,
    skipSingleChild,
    /** The direct subgroups (and ungrouped languages) of `focus`, largest first. */
    branches(focus) {
      const kids = focus ? children.get(skipSingleChild(focus)) : children.get(null)
      return (kids ?? [])
        .map((id) => ({ id: nodes[id] ? skipSingleChild(id) : id, label: id }))
        .map(({ id, label }) => ({ id, name: nodes[label]?.n ?? byId.get(label).n, count: this.count(id) }))
        .sort((a, b) => b.count - a.count)
    },
    /** Which of `branchIds` a language falls under, or null if outside them all. */
    branchOf(lang, branchIds) {
      if (branchIds.has(lang.g)) return lang.g
      for (const id of lineage(lang.p)) if (branchIds.has(id)) return id
      return null
    },
    /** Readable lineage for a language: duplicate names collapsed (Afro-Asiatic > Afro-Asiatic). */
    displayLineage(lang) {
      const path = lineage(lang.p)
      return path.filter((id, i) => i === 0 || nodes[id].n !== nodes[path[i - 1]].n)
    },
  }
}
