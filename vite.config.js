import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/urlhaus-feed': {
        target: 'https://urlhaus.abuse.ch',
        changeOrigin: true,
        rewrite: (path) => {
          const sub = path.replace(/^\/api\/urlhaus-feed\/?/, '');
          return sub ? `/${sub}` : '/downloads/csv_recent/';
        },
      },
      '/api/urlhaus-api': {
        target: 'https://urlhaus-api.abuse.ch',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/urlhaus-api/, ''),
        headers: process.env.URLHAUS_AUTH_KEY
          ? { 'Auth-Key': process.env.URLHAUS_AUTH_KEY }
          : {},
      },
    },
  },
})
