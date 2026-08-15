import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this project at https://eastmanmd.github.io/LanguageMapper/,
// so every asset and route sits under that subpath — it must match the repository
// name exactly, or every asset 404s. It is applied in dev too, so what runs
// locally matches what ships. Serving from a custom domain (or a <user>.github.io
// repo) instead? Set this back to '/'.
// https://vite.dev/config/
export default defineConfig({
  base: '/LanguageMapper/',
  plugins: [react(), tailwindcss()],
})
