import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Node は localhost を IPv6 (::1) で解決するため、IPv4 で転送する Dev Container のポート転送から届かない
    host: '127.0.0.1',
  },
})
