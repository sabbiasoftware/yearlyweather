<script setup>


import ProgressBar from 'primevue/progressbar';
import axios from 'axios';
import { ref } from 'vue';

import mockRawData from './MockStats.js'
import WMOCodes from './WMOCodes.js';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'
import autocolors from 'chartjs-plugin-autocolors';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  autocolors
)

const categoricalFields = [ "weather_code" ];
const numericalFields = [ "temperature_2m_min", "temperature_2m_max", "temperature_2m_mean", "wind_speed_10m_max", "precipitation_hours", "rain_sum", "snowfall_sum" ];

var lon = 0
var lat = 0
var selectedDateRanges = []

var rawData = []

const generationProgress = ref(100);

function dateToISO(date) {
    return date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0")
}

function downloadNextStat() {
    console.log('Downloading weather data for date index', rawData.length);

    const range = selectedDateRanges[rawData.length];

    axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
            latitude: lat,
            longitude: lon,
            start_date: dateToISO(range.start),
            end_date: dateToISO(range.end),
            daily: categoricalFields.concat(numericalFields).join(","),
            timezone: 'auto',
        }
    }).then(response => {
        console.log('Weather data downloaded for ' + dateToISO(range.start) + " - " + dateToISO(range.end));
        rawData.push(response.data.daily);
        generationProgress.value += (100 / selectedDateRanges.length);  
        if (rawData.length < selectedDateRanges.length - 1) {
            setTimeout(downloadNextStat, 1000); // To avoid hitting rate limits
        }
        else {
            generationProgress.value = 100
            calculateStats()
        }
    }).catch(error => {
        console.error('****** Error downloading weather data for ' + d.toISOString().split('T')[0]);
    });
}

function generateStatistics(_lon, _lat, _selectedDateRanges) {
    lon = _lon;
    lat = _lat;
    selectedDateRanges = _selectedDateRanges;
    console.log('Generating statistics for ', lon, lat, selectedDateRanges);

    // MOCK
    rawData = mockRawData
    calculateStats();

    // DOWNLOAD
    //generationProgress.value = 0;
    //downloadNextStat();
}








// **************************************************
// HELPERS
// **************************************************

function getDayData(dayIndex, field) {
    const result = []
    for (let yearIndex = 0; yearIndex < rawData.length; yearIndex++) {
        result.push(rawData[yearIndex][field][dayIndex])
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

function dayAbsDiff(startDate, endDate) {
    let timeDifference = Math.abs(endDate - startDate);
    let daysDifference = timeDifference / (1000 * 3600 * 24);
    return daysDifference;
}








// **************************************************
// CALCULATION LOGIC, MIGHT DESERVE A SEPARATE MODULE
// **************************************************

const chart_options = ref({ responsive: true })

var yearNum = 0
var dayNum = 0
var dayNumLabels = []

const data_code = ref(null)
const data_temp = ref(null)
const data_wind = ref(null)
const data_prec = ref(null)
const data_rain = ref(null)
const data_snow = ref(null)

function resetStats() {
    data_code.value = null
    data_temp.value = null
    data_wind.value = null
    data_prec.value = null
    data_rain.value = null
    data_snow.value = null

    yearNum = rawData.length
    dayNum = rawData[0].time.length;
    
    const day0index = Math.floor((dayNum - 1) / 2);

    dayNumLabels = []
    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        dayNumLabels.push('Day ' + (dayIndex > day0index ? "+" : "") + (dayIndex - day0index).toString())
    }
}

function calculateStats()
{
    console.log(rawData)

    resetStats()
    calculateCodeStats()
    calculateTempStats()
    calculateFieldStats("wind_speed_10m_max", "wind km/h", data_wind)
    calculateFieldStats("precipitation_hours", "precipitation hours", data_prec)
    calculateFieldStats("rain_sum", "rain mm", data_rain)
    calculateFieldStats("snowfall_sum", "snow cm", data_snow)
 }

var z = 0

function getCodeLabel(code) {
    const codeString = code.toString()

    if (codeString in WMOCodes) {
        return WMOCodes[codeString]["day"]["description"]
    }
    else {
        return codeString
    }
}

function calculateCodeStats() {
    // rawData[yearIndex][field][dayIndex]
    // codes[code][day] = count-over-years
    const codes = new Map()

    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        for (let yearIndex = 0; yearIndex < yearNum; yearIndex++) {
            const c = rawData[yearIndex]["weather_code"][dayIndex]
            if (!codes.has(c)) {
                codes.set(c, new Array(dayNum).fill(0))
            }
            codes.get(c)[dayIndex]++
        }
    }

    const codePercentDatasets = []
    for (const [code, counts] of codes) {
        codePercentDatasets.push({
            label: getCodeLabel(code),
            data: counts.map( (c) => 100 * c / yearNum ),
            stack: "Stack 0"
        })
    }

    data_code.value = {
        labels: dayNumLabels,
        datasets: codePercentDatasets
    }
}

function calculateTempStats() {
    const temperatures_min = []
    const temperatures_mean = []
    const temperatures_max = []

    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        temperatures_min.push(min(getDayData(dayIndex, 'temperature_2m_min')))
        temperatures_mean.push(mean(getDayData(dayIndex, 'temperature_2m_mean')))
        temperatures_max.push(max(getDayData(dayIndex, 'temperature_2m_max')))
    }
    
    data_temp.value = {
        labels: dayNumLabels,
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

function calculateFieldStats(fieldId, fieldDisplayName, dataRef) {
    const field_mean = []
    const field_max = []

    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        field_mean.push(mean(getDayData(dayIndex, fieldId)))
        field_max.push(max(getDayData(dayIndex, fieldId)))
    }

    dataRef.value = {
        labels: dayNumLabels,
        datasets: [
            {
                label: 'Mean ' + fieldDisplayName,
                backgroundColor: '#f87979',
                data: field_mean
            },
            {
                label: 'Max ' + fieldDisplayName,
                backgroundColor: '#fbbf24',
                data: field_max
            }
        ]
    }
}

defineExpose({
    generateStatistics
})

</script>

<template>
        <ProgressBar v-if="generationProgress < 100" :value="generationProgress" :showValue="false" style="height: 6px; margin-top: 10px; margin-bottom: 10px;"></ProgressBar>
    <div id="chartGrid">
        <div id="chartCode"><Bar v-if="data_code" :data="data_code" :options="chart_options"></Bar></div>
        <div id="chartTemp"><Line v-if="data_temp" :data="data_temp" :options="chart_options"></Line></div>
        <div id="chartWind"><Line v-if="data_wind" :data="data_wind" :options="chart_options"></Line></div>
        <div id="chartPrec"><Line v-if="data_prec" :data="data_prec" :options="chart_options"></Line></div>
        <div id="chartRain"><Line v-if="data_rain" :data="data_rain" :options="chart_options"></Line></div>
        <div id="chartSnow"><Line v-if="data_snow" :data="data_snow" :options="chart_options"></Line></div>
    </div>
</template>

<style>
    #chartGrid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 8px;
        row-gap: 8px;
    }
</style>