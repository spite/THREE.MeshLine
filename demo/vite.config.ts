import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      meshline: path.resolve(__dirname, '../src'),
    },
  },
  plugins: [react()],
})
