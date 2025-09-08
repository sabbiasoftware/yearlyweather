<script setup>


import ProgressBar from 'primevue/progressbar';
import axios from 'axios';
import { ref } from 'vue';

import mockRawData from './MockStats.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const categoricalFields = [ "weather_code" ];
const numericalFields = [ "temperature_2m_min", "temperature_2m_max", "temperature_2m_mean", "rain_sum", "snowfall_sum", "wind_speed_10m_max" ];

var lon = 0
var lat = 0
var selectedDates = []
var daydelta = 0

var rawData = []
const generationProgress = ref(100);

function downloadNextStat() {
    console.log('Downloading weather data for date index', rawData.length);
    console.log(selectedDates);
    const d = selectedDates[rawData.length];
    const sd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daydelta);
    const ed = new Date(d.getFullYear(), d.getMonth(), d.getDate() + daydelta);

    axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
            latitude: lat,
            longitude: lon,
            start_date: sd.toISOString().split('T')[0],
            end_date: ed.toISOString().split('T')[0],
            daily: categoricalFields.concat(numericalFields).join(","),
            timezone: 'auto',
        }
    }).then(response => {
        console.log('Weather data downloaded for ' + d.toISOString().split('T')[0]);
        rawData.push(response.data.daily);
    }).catch(error => {
        console.error('Error downloading weather data for ' + d.toISOString().split('T')[0]);
    }).finally(() => {
        generationProgress.value += (100 / selectedDates.length);
        
    });

    if (rawData.length < selectedDates.length - 1) {
        setTimeout(downloadNextStat, 1000); // To avoid hitting rate limits
    }
    else {
        generationProgress.value = 100
        calculateStatistics()
    }
}

function generateStatistics(_lon, _lat, _selectedDates, _daydelta) {
    lon = _lon;
    lat = _lat;
    selectedDates = _selectedDates;
    daydelta = _daydelta;
    console.log('Generating statistics for', lon, lat, selectedDates);

    rawData = mockRawData
    calculateStatistics();

    //generationProgress.value = 0;
    //downloadNextStat();
}

const data_temperature = ref(null)
const options_temperature = ref({
    responsive: true,
    //maintainAspectRatio: false
})

function getDayData(dayIndex, field) {
    const result = []
    for (let i = 0; i < rawData.length; i++) {
        result.push(rawData[i][field][dayIndex])
    }
    return result
}

function mean(s) {
    return s.reduce((a, b) => a + b, 0) / s.length;
}

function min(s) {
    return Math.min(...s);
}

function max(s) {
    return Math.max(...s);
}

function calculateStatistics() {
    // Implement statistics calculation here
    // This is a placeholder function
    console.log('Calculating statistics from raw data', rawData);
    console.log(rawData[0].temperature_2m_mean);
    
    const dayNum = 2 * daydelta + 1

    const temperature_labels = []
    const temperatures_min = []
    const temperatures_mean = []
    const temperatures_max = []

    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        temperature_labels.push('Day ' + (dayIndex - daydelta))
        temperatures_min.push(min(getDayData(dayIndex, 'temperature_2m_min')))
        temperatures_mean.push(mean(getDayData(dayIndex, 'temperature_2m_mean')))
        temperatures_max.push(max(getDayData(dayIndex, 'temperature_2m_max')))
    }
    
    data_temperature.value = {
        labels: temperature_labels,
        datasets: [
            {
                label: 'Mean Temperature',
                backgroundColor: '#f87979',
                data: temperatures_mean
            },
            {
                label: 'Min Temperature',
                backgroundColor: '#3b82f6',
                data: temperatures_min,
                fill: {
                    target: 2,
                    above: "rgba(0, 0, 192, 0.05)",
                    below: "rgba(0, 0, 192, 0.05)"
                }
            },
            {
                label: 'Max Temperature',
                backgroundColor: '#fbbf24',
                data: temperatures_max
            }
        ]
    }
}

defineExpose({
    generateStatistics
})

</script>

<template>
    <div>
        <ProgressBar v-if="generationProgress < 100" :value="generationProgress" :showValue="false" style="height: 6px; margin-top: 10px; margin-bottom: 10px;"></ProgressBar>
        <Line v-if="data_temperature" :data="data_temperature" :options="options_temperature"></Line>
    </div>
</template>