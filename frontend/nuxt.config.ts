// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },

  // Disable SSR since we're connecting to a local backend API
  ssr: false,

  devServer: {
    port: 3001
  },

  modules: [
    'nuxt-quasar-ui'
  ],

  quasar: {
    plugins: [
      'Notify',
      'Loading',
      'Dialog'
    ],
    extras: {
      font: 'roboto-font',
      fontIcons: ['material-icons']
    }
  },

  css: [
    '@vue-flow/core/dist/style.css',
    '@vue-flow/core/dist/theme-default.css',
    '@vue-flow/controls/dist/style.css',
    '@vue-flow/minimap/dist/style.css',
    '~/assets/css/main.css'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8080/api'
    }
  },

  vite: {
    optimizeDeps: {
      include: ['@vue-flow/core', '@vue-flow/background', '@vue-flow/controls', '@vue-flow/minimap']
    }
  }
})

