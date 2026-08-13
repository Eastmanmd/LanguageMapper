import { jsPDF } from 'jspdf'

const EXPORT_SCALE = 2
const LABEL_COLOR = '#1f2937' // always export on a white page, whatever the app theme

// Inline the styles the SVG gets from Tailwind classes so the markup survives
// being rendered standalone inside an <img>.
function inlineStyles(sourceSvg, clonedSvg) {
  const sourceNodes = sourceSvg.querySelectorAll('*')
  const clonedNodes = clonedSvg.querySelectorAll('*')
  sourceNodes.forEach((node, i) => {
    const clone = clonedNodes[i]
    if (node.tagName === 'text') {
      const computed = window.getComputedStyle(node)
      clone.setAttribute('font-size', computed.fontSize)
      clone.setAttribute('font-family', computed.fontFamily)
      clone.setAttribute('font-weight', computed.fontWeight)
      // Leaf annotations carry an explicit fill attribute (group color); label
      // text is colored via theme classes and must be forced to print color.
      if (!node.getAttribute('fill')) clone.setAttribute('fill', LABEL_COLOR)
      clone.removeAttribute('class')
    }
  })
}

function svgToPngDataUrl(svgEl) {
  return new Promise((resolve, reject) => {
    const viewBox = svgEl.viewBox.baseVal
    const width = viewBox.width
    const height = viewBox.height

    const clone = svgEl.cloneNode(true)
    inlineStyles(svgEl, clone)
    clone.setAttribute('width', width)
    clone.setAttribute('height', height)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * EXPORT_SCALE
      canvas.height = height * EXPORT_SCALE
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      // JPEG rather than PNG: jsPDF embeds JPEG streams as-is, while PNG can
      // get stored as a near-uncompressed bitmap (10MB+ for a large tree).
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height })
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

/** Build a jsPDF document with the tree image on a page matching its aspect. */
export async function buildTreePdf(svgEl, title) {
  const { dataUrl, width, height } = await svgToPngDataUrl(svgEl)
  const TITLE_SPACE = title ? 40 : 0
  const doc = new jsPDF({
    orientation: width > height + TITLE_SPACE ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height + TITLE_SPACE],
    hotfixes: ['px_scaling'],
  })
  if (title) {
    doc.setFontSize(14)
    doc.setTextColor(LABEL_COLOR)
    doc.text(title, 24, 26)
  }
  doc.addImage(dataUrl, 'JPEG', 0, TITLE_SPACE, width, height)
  return doc
}

export async function exportTreePdf(svgEl, title, filename) {
  const doc = await buildTreePdf(svgEl, title)
  doc.save(filename)
}
