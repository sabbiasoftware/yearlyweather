import './assets/main.css'
import 'primeicons/primeicons.css'
import './assets/weather-icons.min.css'
import './assets/weather-icons-wind.min.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import App from './App.vue'

const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.my-app-dark'
        }
    }
})
app.mount('#app')