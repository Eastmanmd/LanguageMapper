// Map colours, validated with the dataviz palette checker (CVD and normal-vision
// separation on adjacent slots, both themes). Several light slots sit under 3:1
// against the surface, so every colour is also named in the legend and the
// hover tooltip.
export const CATEGORICAL = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
}

// Groups past the eighth fold into "Other"; languages outside the current focus fade back.
export const OTHER = { light: '#a3a3a3', dark: '#6b6b6b' }
export const FADED = { light: '#c9c9c9', dark: '#3d3d3d' }

// One-hue blue ramp for the similarity bands, most similar first. Light mode
// darkens with similarity; dark mode brightens, so "closest" always stands out.
export const SIMILARITY = {
  light: ['#104281', '#256abf', '#5598e7', '#86b6ef'],
  dark: ['#b7d3f6', '#6da7ec', '#2a78d6', '#184f95'],
}
