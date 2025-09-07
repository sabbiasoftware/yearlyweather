<script setup>

import Button from 'primevue/button';
import axios from 'axios';
import { ref } from 'vue';

const generationInProgress = ref(false);

function generateStatistics(lon, lat, selectedDates, daydelta) {
    console.log(typeof(selectedDates));
    console.log('Generating statistics for', lon, lat, selectedDates);

    generationInProgress.value = true;

    for (const d of selectedDates) {
        const sd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daydelta);
        const ed = new Date(d.getFullYear(), d.getMonth(), d.getDate() + daydelta);

        axios.get('https://archive-api.open-meteo.com/v1/archive', {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: sd.toISOString().split('T')[0],
                end_date: ed.toISOString().split('T')[0],
                daily: "weather_code,rain_sum,snowfall_sum,temperature_2m_min,temperature_2m_max,temperature_2m_mean,wind_speed_10m_max",
                timezone: 'auto',
            }
        }).then(response => {
            console.log('Weather data:', response.data);
            // Process and display the data as needed
        }).catch(error => {
            console.error('Error fetching weather data:', error);
        }).finally(() => {
            generationInProgress.value = false;
        });
        break;
    }
}

defineExpose({
    generateStatistics
})

</script>

<template>



</template>