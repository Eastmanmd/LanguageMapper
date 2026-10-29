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

// Five-step ramps for Map Studio's graded layers (density, endangerment,
// languages per country), lightest = least. Both validated as ordinal ramps.
export const SEQUENTIAL_BLUE = {
  light: ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
  dark: ['#184f95', '#2a78d6', '#5598e7', '#86b6ef', '#b7d3f6'],
}
export const SEQUENTIAL_ORANGE = {
  light: ['#f09d77', '#e97b4a', '#d65c29', '#a6451c', '#723012'],
  dark: ['#9a3d17', '#c9531f', '#ec7a47', '#f4a582', '#f9cbb5'],
}

// Two arms and a grey midpoint, for a balance between two shares. The arms
// reuse the blue and orange ramps so they match the categorical slots 1 and 2.
export const DIVERGING = {
  light: ['#1c5cab', '#86b6ef', '#f0efec', '#f09d77', '#a6451c'],
  dark: ['#86b6ef', '#256abf', '#383835', '#c9531f', '#f4a582'],
}
