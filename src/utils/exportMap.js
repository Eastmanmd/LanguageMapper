// Turns the Map Studio view into a PNG: the map re-rendered at export
// resolution, with the title, legend and source credits drawn on top, so
// every exported image carries its attribution.

export const FRAMES = {
  wide: { label: 'Wide 16:9', width: 1920, height: 1080 },
  square: { label: 'Square', width: 1600, height: 1600 },
  portrait: { label: 'Portrait 4:5', width: 1600, height: 2000 },
}

// While comparing, the title gets a band of its own above the maps. Shared with
// the on-screen layout so what's exported has the proportions of what's shown.
export const TITLE_BAND = { wide: 0.13, square: 0.1, portrait: 0.09 }

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

// Re-render the map at the export width, then read it straight back.
async function drawMap(ctx, map, rect) {
  const originalRatio = map.getPixelRatio()
  map.setPixelRatio(rect.width / map.getContainer().clientWidth)
  map.triggerRepaint()
  await nextIdle(map)
  ctx.drawImage(map.getCanvas(), rect.x, rect.y, rect.width, rect.height)
  map.setPixelRatio(originalRatio)
}

function drawTitleBlock(ctx, { title, subtitle, width, unit, pad, ink, muted, panel }) {
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

// The band has one line each for the title and subtitle, so longer text is cut.
function fitLine(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text
  while (cut && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

function drawTitleBand(ctx, { title, subtitle, width, height, unit, pad, ink, muted, dark }) {
  ctx.fillStyle = dark ? '#121211' : '#ffffff'
  ctx.fillRect(0, 0, width, height)
  const titleSize = 44 * unit
  const subSize = 22 * unit
  const lineGap = 10 * unit
  const blockHeight = (title ? titleSize : 0) + (title && subtitle ? lineGap : 0) + (subtitle ? subSize : 0)
  let y = (height - blockHeight) / 2
  if (title) {
    y += titleSize
    ctx.font = `600 ${titleSize}px ${FONT}`
    ctx.fillStyle = ink
    ctx.fillText(fitLine(ctx, title, width - 2 * pad), pad, y)
    y += lineGap
  }
  if (subtitle) {
    y += subSize
    ctx.font = `400 ${subSize}px ${FONT}`
    ctx.fillStyle = muted
    ctx.fillText(fitLine(ctx, subtitle, width - 2 * pad), pad, y)
  }
}

function drawCaption(ctx, caption, { rect, unit, ink, panel }) {
  const size = 22 * unit
  const inset = 20 * unit
  const inner = 14 * unit
  ctx.font = `600 ${size}px ${FONT}`
  const text = fitLine(ctx, caption, rect.width - 2 * inset - 2 * inner)
  ctx.fillStyle = panel
  roundedRect(ctx, rect.x + inset, rect.y + inset, ctx.measureText(text).width + 2 * inner, size + 18 * unit, 10 * unit)
  ctx.fillStyle = ink
  ctx.fillText(text, rect.x + inset + inner, rect.y + inset + size + 2 * unit)
}

function drawLegend(ctx, legend, { x, bottom, legendWidth, unit, ink, muted, panel }) {
  const rowHeight = 30 * unit
  ctx.font = `400 ${18 * unit}px ${FONT}`
  const noteLines = legend.note ? wrap(ctx, legend.note, legendWidth - 40 * unit) : []
  ctx.font = `600 ${20 * unit}px ${FONT}`
  const titleLines = wrap(ctx, legend.title, legendWidth - 40 * unit)
  const titleExtra = (titleLines.length - 1) * 26 * unit
  const legendHeight = 64 * unit + titleExtra + legend.items.length * rowHeight + noteLines.length * 24 * unit + 16 * unit
  const top = bottom - legendHeight
  ctx.fillStyle = panel
  roundedRect(ctx, x, top, legendWidth, legendHeight, 16 * unit)
  ctx.fillStyle = ink
  ctx.font = `600 ${20 * unit}px ${FONT}`
  titleLines.forEach((line, i) => ctx.fillText(line, x + 20 * unit, top + 38 * unit + i * 26 * unit))
  let y = top + 70 * unit + titleExtra
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

/** `panels` is one map, or two to compare: { map, legend, caption }. */
export async function exportMapPng({ panels, frame, title, subtitle, credits, dark }) {
  const { width, height } = FRAMES[frame]
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const unit = width / 1600
  const ink = dark ? '#f0efec' : '#0b0b0b'
  const muted = dark ? '#c3c2b7' : '#52514e'
  const panel = dark ? 'rgba(18,18,17,0.88)' : 'rgba(255,255,255,0.9)'
  const pad = 40 * unit
  const colors = { unit, ink, muted, panel }

  const compare = panels.length > 1
  const hasTitle = Boolean(title || subtitle)
  const band = compare && hasTitle ? Math.round(height * TITLE_BAND[frame]) : 0
  const stacked = frame === 'portrait'
  const rects = panels.map((_, i) => {
    if (!compare) return { x: 0, y: 0, width, height }
    const mapsHeight = height - band
    return stacked
      ? { x: 0, y: band + (i * mapsHeight) / 2, width, height: mapsHeight / 2 }
      : { x: (i * width) / 2, y: band, width: width / 2, height: mapsHeight }
  })

  for (const [i, { map }] of panels.entries()) await drawMap(ctx, map, rects[i])

  if (compare) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
    if (stacked) ctx.fillRect(0, rects[1].y - unit, width, 2 * unit)
    else ctx.fillRect(rects[1].x - unit, band, 2 * unit, height - band)
    if (hasTitle) drawTitleBand(ctx, { title, subtitle, width, height: band, pad, dark, ...colors })
  } else if (hasTitle) {
    drawTitleBlock(ctx, { title, subtitle, width, pad, ...colors })
  }

  panels.forEach(({ legend, caption }, i) => {
    const rect = rects[i]
    if (caption) drawCaption(ctx, caption, { rect, ...colors })
    if (legend?.items.length) {
      drawLegend(ctx, legend, {
        x: rect.x + (compare ? 20 * unit : pad),
        bottom: rect.y + rect.height - pad - 44 * unit,
        legendWidth: (compare ? 340 : 380) * unit,
        ...colors,
      })
    }
  })

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
