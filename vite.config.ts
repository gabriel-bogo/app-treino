import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pacote from './package.json' with { type: 'json' }

// PWA (seção 2 da especificação):
// - manifest com display standalone, ícones e apple-touch-icon
// - service worker que guarda TODOS os arquivos do app (inclusive as imagens dos
//   exercícios) para funcionar offline depois da primeira visita
// - registerType 'prompt': uma versão nova só entra quando o app é fechado e
//   aberto de novo; nunca recarrega a página no meio de um treino
export default defineConfig({
  base: '/',
  define: {
    __VERSAO_APP__: JSON.stringify(pacote.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        id: '/',
        name: 'App Treino',
        short_name: 'Treino',
        description: 'Treino de academia pessoal, offline e sem cadastro.',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,json,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
