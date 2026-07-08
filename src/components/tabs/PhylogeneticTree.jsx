const LEAF_SPACING = 48
const MARGIN = { top: 24, right: 160, bottom: 24, left: 24 }

function collectMaxHeight(node) {
  if (!node.children) return node.height
  return Math.max(node.height, ...node.children.map(collectMaxHeight))
}

function assignPositions(node, positions, state) {
  if (!node.children) {
    const y = state.leafIndex * LEAF_SPACING
    state.leafIndex += 1
    positions.set(node, { y })
    return y
  }
  const ys = node.children.map((child) => assignPositions(child, positions, state))
  const y = (ys[0] + ys[1]) / 2
  positions.set(node, { y })
  return y
}

function renderNode(node, positions, xScale, labelOf, keyPrefix) {
  const pos = positions.get(node)
  const x = xScale(node.height)
  const elements = []

  if (!node.children) {
    elements.push(
      <text
        key={`${keyPrefix}-label`}
        x={x + 10}
        y={pos.y}
        dominantBaseline="middle"
        className="fill-gray-800 text-[13px]"
      >
        {labelOf(node.label)}
      </text>,
    )
    return elements
  }

  const [left, right] = node.children
  const leftPos = positions.get(left)
  const rightPos = positions.get(right)
  const leftX = xScale(left.height)
  const rightX = xScale(right.height)

  elements.push(
    <line
      key={`${keyPrefix}-vline`}
      x1={x}
      y1={leftPos.y}
      x2={x}
      y2={rightPos.y}
      stroke="#94a3b8"
      strokeWidth={1.5}
    />,
    <line
      key={`${keyPrefix}-hline-left`}
      x1={x}
      y1={leftPos.y}
      x2={leftX}
      y2={leftPos.y}
      stroke="#94a3b8"
      strokeWidth={1.5}
    />,
    <line
      key={`${keyPrefix}-hline-right`}
      x1={x}
      y1={rightPos.y}
      x2={rightX}
      y2={rightPos.y}
      stroke="#94a3b8"
      strokeWidth={1.5}
    />,
  )

  elements.push(...renderNode(left, positions, xScale, labelOf, `${keyPrefix}-l`))
  elements.push(...renderNode(right, positions, xScale, labelOf, `${keyPrefix}-r`))
  return elements
}

export default function PhylogeneticTree({ tree, labelOf }) {
  if (!tree) return null

  const maxHeight = collectMaxHeight(tree) || 1
  const positions = new Map()
  assignPositions(tree, positions, { leafIndex: 0 })

  const leafCount = positions.size - countInternal(tree)
  const plotHeight = Math.max(0, leafCount - 1) * LEAF_SPACING
  const plotWidth = 360

  // leaves (height 0) sit at the right edge; the root (max similarity
  // distance) sits at the left -- a conventional left-to-right phylogram.
  const xScale = (height) =>
    MARGIN.left + plotWidth - (height / maxHeight) * plotWidth

  const width = MARGIN.left + plotWidth + MARGIN.right
  const height = MARGIN.top + plotHeight + MARGIN.bottom

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width }}
    >
      <g transform={`translate(0, ${MARGIN.top})`}>
        {renderNode(tree, positions, xScale, labelOf, 'n')}
      </g>
    </svg>
  )
}

function countInternal(node) {
  if (!node.children) return 0
  return 1 + countInternal(node.children[0]) + countInternal(node.children[1])
}
