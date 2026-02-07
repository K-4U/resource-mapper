import vuetify from 'vite-plugin-vuetify'

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

  modules: [],

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/css/main.css'
  ],

  build: {
    transpile: ['vuetify']
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8080/api'
    }
  },

  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    plugins: [
      vuetify({
        autoImport: true
      })
    ]
  }
})
