// Turns the Map Studio view into a PNG: the map re-rendered at export
// resolution, with the title, legend and source credits drawn on top, so
// every exported image carries its attribution.

export const FRAMES = {
  wide: { label: 'Wide 16:9', width: 1920, height: 1080 },
  square: { label: 'Square', width: 1600, height: 1600 },
  portrait: { label: 'Portrait 4:5', width: 1600, height: 2000 },
}

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif'

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

const nextIdle = (map) => new Promise((resolve) => map.once('idle', resolve))

export async function exportMapPng({ map, frame, title, subtitle, legend, credits, dark }) {
  const { width, height } = FRAMES[frame]
  const container = map.getContainer()
  const originalRatio = map.getPixelRatio()

  // Re-render the map at the export width, then read it straight back.
  map.setPixelRatio(width / container.clientWidth)
  map.triggerRepaint()
  await nextIdle(map)
  const mapImage = map.getCanvas()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(mapImage, 0, 0, width, height)
  map.setPixelRatio(originalRatio)

  const unit = width / 1600
  const ink = dark ? '#f0efec' : '#0b0b0b'
  const muted = dark ? '#c3c2b7' : '#52514e'
  const panel = dark ? 'rgba(18,18,17,0.88)' : 'rgba(255,255,255,0.9)'
  const pad = 40 * unit

  if (title || subtitle) {
    ctx.font = `600 ${52 * unit}px ${FONT}`
    const titleLines = title ? wrap(ctx, title, width * 0.6) : []
    ctx.font = `400 ${24 * unit}px ${FONT}`
    const subLines = subtitle ? wrap(ctx, subtitle, width * 0.55) : []
    const blockHeight = titleLines.length * 60 * unit + subLines.length * 32 * unit + 40 * unit
    ctx.font = `600 ${52 * unit}px ${FONT}`
    const blockWidth =
      Math.max(
        ...titleLines.map((l) => ctx.measureText(l).width),
        ...subLines.map((l) => {
          ctx.font = `400 ${24 * unit}px ${FONT}`
          return ctx.measureText(l).width
        }),
      ) + 48 * unit
    ctx.fillStyle = panel
    roundedRect(ctx, pad, pad, blockWidth, blockHeight, 18 * unit)
    let y = pad + 24 * unit + 46 * unit
    ctx.fillStyle = ink
    ctx.font = `600 ${52 * unit}px ${FONT}`
    for (const line of titleLines) {
      ctx.fillText(line, pad + 24 * unit, y)
      y += 60 * unit
    }
    ctx.fillStyle = muted
    ctx.font = `400 ${24 * unit}px ${FONT}`
    y -= 24 * unit
    for (const line of subLines) {
      ctx.fillText(line, pad + 24 * unit, y)
      y += 32 * unit
    }
  }

  if (legend?.items.length) {
    const rowHeight = 30 * unit
    const legendWidth = 380 * unit
    ctx.font = `400 ${18 * unit}px ${FONT}`
    const noteLines = legend.note ? wrap(ctx, legend.note, legendWidth - 40 * unit) : []
    const legendHeight = 64 * unit + legend.items.length * rowHeight + noteLines.length * 24 * unit + 16 * unit
    const x = pad
    const top = height - pad - 44 * unit - legendHeight
    ctx.fillStyle = panel
    roundedRect(ctx, x, top, legendWidth, legendHeight, 16 * unit)
    ctx.fillStyle = ink
    ctx.font = `600 ${20 * unit}px ${FONT}`
    ctx.fillText(legend.title, x + 20 * unit, top + 38 * unit)
    let y = top + 70 * unit
    ctx.font = `400 ${19 * unit}px ${FONT}`
    for (const item of legend.items) {
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(x + 28 * unit, y - 6 * unit, 8 * unit, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = ink
      ctx.fillText(item.label, x + 46 * unit, y)
      if (item.value != null) {
        ctx.fillStyle = muted
        const value = item.value.toLocaleString('en-US')
        ctx.fillText(value, x + legendWidth - 20 * unit - ctx.measureText(value).width, y)
      }
      y += rowHeight
    }
    ctx.fillStyle = muted
    ctx.font = `400 ${17 * unit}px ${FONT}`
    for (const line of noteLines) {
      ctx.fillText(line, x + 20 * unit, y)
      y += 24 * unit
    }
  }

  // Credits run along the bottom edge.
  ctx.font = `400 ${15 * unit}px ${FONT}`
  const creditLines = wrap(ctx, `Made with LanguageMapper · ${credits.join(' · ')}`, width - 2 * pad)
  const creditsHeight = creditLines.length * 20 * unit + 16 * unit
  ctx.fillStyle = panel
  ctx.fillRect(0, height - creditsHeight, width, creditsHeight)
  ctx.fillStyle = muted
  creditLines.forEach((line, i) => ctx.fillText(line, pad, height - creditsHeight + 22 * unit + i * 20 * unit))

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(title || 'africa-map').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
