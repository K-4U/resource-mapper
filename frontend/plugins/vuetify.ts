import 'vuetify/styles'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    primary: '#1976D2',
    secondary: '#26A69A',
    accent: '#9C27B0',
    error: '#C10015',
    info: '#31CCEC',
    success: '#21BA45',
    warning: '#F2C037'
  }
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#90CAF9',
    secondary: '#4DB6AC',
    accent: '#CE93D8',
    error: '#EF9A9A',
    info: '#81D4FA',
    success: '#A5D6A7',
    warning: '#FFE082'
  }
}

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      variations: {
        colors: ['primary', 'secondary', 'accent', 'warning', 'info', 'success', 'error']
      },
      themes: {
        light: lightTheme,
        dark: darkTheme
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})

