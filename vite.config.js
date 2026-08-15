import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this project at https://eastmanmd.github.io/LanguageMap/,
// so every asset and route sits under that subpath. It is applied in dev too, so
// what runs locally matches what ships — anything that assumes the site is at the
// domain root breaks here rather than in production. Serving from a custom domain
// (or a <user>.github.io repo) instead? Set this back to '/'.
// https://vite.dev/config/
export default defineConfig({
  base: '/LanguageMap/',
  plugins: [react(), tailwindcss()],
})
