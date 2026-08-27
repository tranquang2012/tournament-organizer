import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.BACKEND_PORT || '5001'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      // Listen on all interfaces so phones/tablets on the same Wi‑Fi can reach the dev server.
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})

