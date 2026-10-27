/* global process */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import threatFeedHandler from './api/urlhaus-feed.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'cybershield-threat-feed-proxy',
        configureServer(server) {
          server.middlewares.use('/api/urlhaus-feed', async (req, res) => {
            await threatFeedHandler(req, res);
          });
        },
      },
    ],
    server: {
      proxy: {
        '/api/urlhaus-api': {
          target: 'https://urlhaus-api.abuse.ch',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/urlhaus-api/, ''),
          headers: env.URLHAUS_AUTH_KEY
            ? { 'Auth-Key': env.URLHAUS_AUTH_KEY }
            : {},
        },
      },
    },
  };
});
