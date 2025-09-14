<script setup>

import ProgressBar from 'primevue/progressbar';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import { FloatLabel } from 'primevue';
import Checkbox from 'primevue/checkbox';
import axios from 'axios';
import { ref } from 'vue';
import { mean, min, max } from './statHelper.js';
import { dateToISO } from './dateHelper.js';
import getWMOCodeLabel from './WMOCodes.js';
import mockRawData from './MockStats.js'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement } from 'chart.js'
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



// input parameters
var lon = 0
var lat = 0
var selectedDateRanges = []

// internal state
var rawData = []
var dayNum = 0
var dayNumLabels = []
const generationProgress = ref(100);
const downloadStatusMessage = ref(null);
const hasData = ref(false);
const aggregateYears = ref(true);
const yearNum = ref(0);
const selectedYearIndex = ref(0);

const chart_options = ref(
    { 
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
)

const data_code = ref(null)
const data_temp = ref(null)
const data_wind = ref(null)
const data_prec = ref(null)
const data_rain = ref(null)
const data_snow = ref(null)



// download => prepare => refresh
//      1) download: download weather data for all selected date ranges, possibly using mock data
//      2) prepare: after download prepare internal state
//      3) refresh: update charts



const minDownloadDelay = 100;
const maxDownloadDelay = 6400;
var downloadDelay = 10;
const maxRetries = 2;
var retryCount = 0;

function download(_lon, _lat, _selectedDateRanges, useMockData) {
    lon = _lon;
    lat = _lat;
    selectedDateRanges = _selectedDateRanges;
    rawData = [];
    hasData.value = false;
    console.log('Generating statistics for ', lon, lat, selectedDateRanges);

    if (useMockData) {
        rawData = mockRawData;
        prepare();
    }
    else {
        generationProgress.value = 0;

        downloadDelay = minDownloadDelay;
        retryCount = 0;
        downloadStatusMessage.value = null;

        downloadNext();
    }
}

function downloadNext() {
    console.log('Downloading weather data for date index', rawData.length);

    const range = selectedDateRanges[rawData.length];

    axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
            latitude: lat,
            longitude: lon,
            start_date: dateToISO(range.start),
            end_date: dateToISO(range.end),
            daily: [ 
                "weather_code", 
                "temperature_2m_min", 
                "temperature_2m_max", 
                "temperature_2m_mean", 
                "wind_speed_10m_max", 
                "precipitation_hours", 
                "rain_sum", 
                "snowfall_sum"
            ].join(","),
            timezone: 'auto',
        }
    }).then(response => {
        console.log('Weather data downloaded for ' + dateToISO(range.start) + " - " + dateToISO(range.end));
        rawData.push(response.data.daily);
        retryCount = 0;
        generationProgress.value += (100 / selectedDateRanges.length);  
        if (rawData.length < selectedDateRanges.length) {
            setTimeout(downloadNext, downloadDelay);
        }
        else {
            generationProgress.value = 100
            prepare()
        }
    }).catch(error => {
        downloadDelay *= 2;
        if (downloadDelay > maxDownloadDelay) {
            downloadDelay = maxDownloadDelay;
        }
        retryCount++;
        console.error('Error downloading weather data for ' + dateToISO(range.start) + " - " + dateToISO(range.end) + "; error message: " + error.message);
        if (retryCount <= maxRetries) {
            downloadStatusMessage.value = 'Retrying: ' + error.message;
            setTimeout(downloadNext, downloadDelay);
        }
        else {
            downloadStatusMessage.value = 'Fetching weather stats failed: ' + error.message;
            generationProgress.value = 100;
        }
    });
}



function prepare() {
    yearNum.value = rawData.length;
    selectedYearIndex.value = rawData.length - 1;
    dayNum = rawData[0].time.length;
    
    const day0index = Math.floor((dayNum - 1) / 2);

    dayNumLabels = []
    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        dayNumLabels.push('Day ' + (dayIndex > day0index ? "+" : "") + (dayIndex - day0index).toString())
    }

    hasData.value = true

    refresh();
}



function refresh()
{
    refreshCodeStats();
    refreshTempStats()
    refreshFieldStats("wind_speed_10m_max", "wind km/h", data_wind)
    refreshFieldStats("precipitation_hours", "precipitation hours", data_prec)
    refreshFieldStats("rain_sum", "rain mm", data_rain)
    refreshFieldStats("snowfall_sum", "snow cm", data_snow)
 }

function refreshCodeStats() {
    data_code.value = null;

    // rawData[yearIndex][field][dayIndex]
    // codes[code][day] = count-over-years
    const codes = new Map()

    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        for (let yearIndex = 0; yearIndex < yearNum.value; yearIndex++) {

            if (aggregateYears.value || yearIndex == selectedYearIndex.value) {

                const c = rawData[yearIndex]["weather_code"][dayIndex]
                if (!codes.has(c)) {
                    codes.set(c, new Array(dayNum).fill(0))
                }
                codes.get(c)[dayIndex]++

            }
        }
    }

    const codePercentDatasets = []
    for (const [code, counts] of codes) {
        codePercentDatasets.push({
            label: getWMOCodeLabel(code),
            data: counts.map( (c) => 100 * c / yearNum.value ),
            stack: "Stack 0"
        })
    }

    data_code.value = {
        labels: dayNumLabels,
        datasets: codePercentDatasets
    }
}

// returns an array of values for a specific dayIndex and field across all years in rawData
function getDayData(yearIndex, dayIndex, field) {
    const result = []
    if (yearIndex == -1) {
        for (let yearIndex = 0; yearIndex < rawData.length; yearIndex++) {
            result.push(rawData[yearIndex][field][dayIndex])
        }
    }
    else {
        result.push
    }
    return result
}

function refreshTempStats() {
    data_temp.value = null;

    const temperatures_min = []
    const temperatures_mean = []
    const temperatures_max = []

    for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
        if (aggregateYears.value) {
            temperatures_min.push(min(getDayData(-1, dayIndex, 'temperature_2m_min')))
            temperatures_mean.push(mean(getDayData(-1, dayIndex, 'temperature_2m_mean')))
            temperatures_max.push(max(getDayData(-1, dayIndex, 'temperature_2m_max')))
        }
        else {
            temperatures_min.push(rawData[selectedYearIndex.value]['temperature_2m_min'][dayIndex])
            temperatures_mean.push(rawData[selectedYearIndex.value]['temperature_2m_mean'][dayIndex])
            temperatures_max.push(rawData[selectedYearIndex.value]['temperature_2m_max'][dayIndex])
        }
    }
    
    data_temp.value = {
        labels: dayNumLabels,
        datasets: [
            {
                label: 'Mean',
                backgroundColor: '#f87979',
                data: temperatures_mean
            },
            {
                label: 'Min',
                backgroundColor: '#3b82f6',
                data: temperatures_min,
                fill: {
                    target: 2,
                    above: "rgba(0, 0, 192, 0.05)",
                    below: "rgba(0, 0, 192, 0.05)"
                }
            },
            {
                label: 'Max',
                backgroundColor: '#fbbf24',
                data: temperatures_max
            }
        ]
    }
}

function refreshFieldStats(fieldId, fieldDisplayName, dataRef) {
    dataRef.value = null;

    const field_mean = []
    const field_max = []

    if (aggregateYears.value) {
        for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
            field_mean.push(mean(getDayData(-1, dayIndex, fieldId)))
            field_max.push(max(getDayData(-1, dayIndex, fieldId)))
        }

        dataRef.value = {
            labels: dayNumLabels,
            datasets: [
                {
                    label: 'Mean', // + fieldDisplayName,
                    data: field_mean
                },
                {
                    label: 'Max', // + fieldDisplayName,
                    data: field_max
                }
            ]
        }
    }
    else {
        for (let dayIndex = 0; dayIndex < dayNum; dayIndex++) {
            field_mean.push(rawData[selectedYearIndex.value][fieldId][dayIndex])
        }

        dataRef.value = {
            labels: dayNumLabels,
            datasets: [
                {
                    label: fieldDisplayName,
                    data: field_mean
                }
            ]
        }
    }
}

defineExpose({
    download
})

</script>



<template>
    <ProgressBar id="bar" v-if="generationProgress < 100" :value="generationProgress" :showValue="false" :pt:value:style="{ 'transition-property': 'none' }"></ProgressBar>
    <p v-if="downloadStatusMessage != null" class="p-error"> {{ downloadStatusMessage }} </p>

    <div id="chartControls" v-if="hasData">
        <span id="aggYears">
            <Checkbox  size="large" inputId="aggYears" v-model="aggregateYears" binary @update:modelValue="refresh"/>
        </span>
        <span id="aggYearsLabel">
            <label for="aggYears">Aggregate</label>
        </span>
        <span id="yearInput">
            <FloatLabel variant="in">
                <InputNumber fluid inputId="yearInput" v-if="!aggregateYears" v-model="selectedYearIndex" :min="0" :max="yearNum-1" :step="1" showButtons buttonLayout="horizontal" @update:modelValue="refresh"></InputNumber>
                <label v-if="!aggregateYears" for="yearInput">Year #</label>
            </FloatLabel>
        </span>
        <span>
            <span v-if="!aggregateYears">{{ dateToISO(selectedDateRanges[selectedYearIndex].start) + " &ndash; " + dateToISO(selectedDateRanges[selectedYearIndex].end) }}</span>
        </span>
        <span id="yearBar">
            <Slider v-if="!aggregateYears" v-model="selectedYearIndex" :min="0" :max="yearNum-1" :step="1" @update:modelValue="refresh"></Slider>
        </span>
    </div>
    <div id="chartGroupContainer" v-if="hasData">

        <div id="chartCode" class="chartCointainer">
            <div class="chartTitleContainer">
                <i class="wi wi-day-cloudy chartIcon"></i>
                <h3>Daily weather</h3>
            </div>
            <Bar v-if="data_code" :data="data_code" :options="chart_options"></Bar>
        </div>

        <div id="chartTemp" class="chartCointainer">
            <div class="chartTitleContainer">
                <i class="wi wi-thermometer chartIcon"></i>
                <h3>Daily temperature (&deg;C)</h3>
            </div>
            <Line :data="data_temp" :options="chart_options"></Line>
        </div>

        <div id="chartWind" class="chartCointainer">
            <div class="chartTitleContainer">
                <i class="wi wi-strong-wind chartIcon"></i>
                <h3>Wind speed (km/h)</h3>
            </div>
            <Line :data="data_wind" :options="chart_options"></Line>
        </div>
        
        <div id="chartPrec" class="chartCointainer">
            <div class="chartTitleContainer">
                <i class="wi wi-rain chartIcon"></i>
                <h3>Precipitation hours</h3>
            </div>
            <Line :data="data_prec" :options="chart_options"></Line>
        </div>
        
        <div id="chartRain" class="chartCointainer">
            <div class="chartTitleContainer">
                <i class="wi wi-raindrop chartIcon"></i>
                <h3>Daily rain (mm)</h3>
            </div>
            <Line :data="data_rain" :options="chart_options"></Line>
        </div>
        
        <div id="chartSnow" class="chartCointainer">
            <div class="chartTitleContainer">
                <i class="wi wi-snowflake-cold chartIcon"></i>
                <h3>Daily snow (cm)</h3>
            </div>
            <Line :data="data_snow" :options="chart_options"></Line>
        </div>

    </div>
</template>

<style scoped>
    #chartControls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 1rem;
        gap: 2rem;
        min-height: 4rem;
    }

    #aggYearsLabel {
        margin-left: -1rem;
    }

    #yearBar {
        flex-grow: 1;
        min-width: 12rem;
    }

    #yearInput {
        flex-basis: 10rem;
    }

    #chartGroupContainer {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 3rem;
        gap: 3rem;
    }

    .chartCointainer {
        width: 100%;
        max-width: 550px;
        flex-grow: 1;
        background-color: rgba(0,0,0, 0.015);
        border-style: solid;
        border-width: 1px;
        border-color: var(--p-panel-border-color);
        border-radius: 0.5rem;
        padding: 1rem;
    }

    .chartTitleContainer {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .chartIcon {
        font-size: 1.5em;
        color: var(--p-panel-color);
    }

    canvas {
        width: 100%;
        height: 100%;
    }
</style>