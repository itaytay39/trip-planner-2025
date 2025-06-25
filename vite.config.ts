import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // [התיקון החשוב] הגדרת נתיב הבסיס הנכון עבור GitHub Pages
  base: '/trip-planner-2025/',
  plugins: [react()],
})
