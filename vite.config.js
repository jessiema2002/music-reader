import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Uncomment and set to your GitHub repo name if deploying to GitHub Pages:
  // base: '/music-reader/',
})
