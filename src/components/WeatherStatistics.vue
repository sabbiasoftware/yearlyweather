<script setup>
import { statParams } from './statParams.js'
import { useClipboard } from '@vueuse/core';
import Panel from 'primevue/panel'
import Select from 'primevue/select'
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton'
import ProgressBar from 'primevue/progressbar';
import Checkbox from 'primevue/checkbox';
import axios from 'axios';
import { ref, watch, onMounted } from 'vue';
import { dateToISO } from './dateHelper.js';
import getWMOCodeLabel from './WMOCodes.js';
import mockRawData from './MockStats.js'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Legend, Filler, BarElement } from 'chart.js'
import { Line, Bar } from 'vue-chartjs'
import autocolors from 'chartjs-plugin-autocolors';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  Filler,
  autocolors
)


const baseURL = document.baseURI // window.location.origin

// constants
const chartModes = [
  { index: 0, label: "By day" },
  { index: 1, label: "By year" }
]

// internal state
var rawData = []
var dayNum = ref(0);
const yearNum = ref(0);

const generationProgress = ref(100);
const downloadStatusMessage = ref(null);
const hasData = ref(false);
const freshData = ref(false);
const chartMode = ref(chartModes[0]);
const aggregate = ref(true);

const yearOptions = ref([]) // [ { index: 0, label: '2008'}, { index: 1, label: '2009' } ]
const dayOptions = ref([]) // [ { index: 0, label: 'Day -3' }, { index: 1, label: 'Day -2' } ]
const dayLabels = ref([])
const yearLabels = ref([])
const selectedYear = ref();
const selectedDay = ref();

// ------------------------------------------------
// TODO: create dedicated component based on Button
const copyButtonLabelBase = "Copy data"
const copyButtonLabelTemp = "Data copied"
const copyButtonIconBase = "pi pi-copy"
const copyButtonIconTemp = "pi pi-check"
const copyButtonLabel = ref(copyButtonLabelBase)
const copyButtonIcon = ref(copyButtonIconBase)

function copyButtonClick() {
  copyButtonLabel.value = copyButtonLabelTemp
  copyButtonIcon.value = copyButtonIconTemp
  cbCopy(JSON.stringify(rawData, null, 4))
  setTimeout(() => {
    copyButtonLabel.value = copyButtonLabelBase
    copyButtonIcon.value = copyButtonIconBase
  }, 3000)
}
// ------------------------------------------------

// ------------------------------------------------
// TODO: create dedicated component based on Button
const shareButtonLabelBase = "Share link"
const shareButtonLabelTemp = "Link copied"
const shareButtonIconBase = "pi pi-share-alt"
const shareButtonIconTemp = "pi pi-check"
const shareButtonLabel = ref(shareButtonLabelBase)
const shareButtonIcon = ref(shareButtonIconBase)

function shareButtonClick() {
  shareButtonLabel.value = shareButtonLabelTemp
  shareButtonIcon.value = shareButtonIconTemp
  cbCopy(`${baseURL}?lat=${statParams.lat}&lon=${statParams.lon}&bd=${dateToISO(statParams.baseDate)}&dd=${statParams.dayDelta}&yn=${statParams.yearNum}&m=${statParams.yearMode}`)
  setTimeout(() => {
    shareButtonLabel.value = shareButtonLabelBase
    shareButtonIcon.value = shareButtonIconBase
  }, 3000)
}
// ------------------------------------------------

const chart_options = ref(
  {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    aspectRatio: 1.25
  }
)

const data_code = ref(null)
const data_temp = ref(null)
const data_wind = ref(null)
const data_prec = ref(null)
const data_rain = ref(null)
const data_snow = ref(null)



watch(statParams, () => {
  freshData.value = false
})


// download => prepare => refresh
//      1) download: download weather data for all selected date ranges, possibly using mock data
//      2) prepare: after download prepare internal state
//      3) refresh: update charts



const minDownloadDelay = 100;
const maxDownloadDelay = 6400;
var downloadDelay = 10;
const maxRetries = 2;
var retryCount = 0;

function download() {
  rawData = [];
  hasData.value = false;
  console.log('Generating statistics for ', statParams.lon, statParams.lat, statParams.selectedDateRanges);

  if (statParams.useMockData) {
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

  const range = statParams.selectedDateRanges[rawData.length];

  axios.get('https://archive-api.open-meteo.com/v1/archive', {
    params: {
      latitude: statParams.lat,
      longitude: statParams.lon,
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
      generationProgress.value += (100 / statParams.selectedDateRanges.length);
      if (rawData.length < statParams.selectedDateRanges.length) {
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
  console.log("Prepare() called")
  yearNum.value = rawData.length;
  dayNum.value = rawData[0].time.length;

  const day0index = Math.floor((dayNum.value - 1) / 2);

  dayOptions.value = []
  dayLabels.value = []
  for (let dayIndex = 0; dayIndex < dayNum.value; dayIndex++) {
    const s = 'Day ' + (dayIndex > day0index ? "+" : "") + (dayIndex - day0index).toString();
    dayOptions.value.push({ index: dayIndex, label: s });
    dayLabels.value.push(s);
  }
  selectedDay.value = dayOptions.value[day0index]

  yearOptions.value = []
  yearLabels.value = []
  for (let yearIndex = 0; yearIndex < rawData.length; yearIndex++) {
    const s = rawData[yearIndex]['time'][day0index].substring(0, 4);
    yearOptions.value.push({ index: yearIndex, label: s });
    yearLabels.value.push(s);
  }
  selectedYear.value = yearOptions.value[yearOptions.value.length - 1]

  hasData.value = true
  freshData.value = true

  refresh();
}



function refresh() {
  refreshCodeStats();
  refreshTempStats()
  refreshFieldStats("wind_speed_10m_max", "wind km/h", data_wind)
  refreshFieldStats("precipitation_hours", "precipitation hours", data_prec)
  refreshFieldStats("rain_sum", "rain mm", data_rain)
  refreshFieldStats("snowfall_sum", "snow cm", data_snow)
}

function refreshCodeStats() {
  data_code.value = null;

  const codes = new Map()
  const n = getChartDataNum();
  const m = getChartAggDataNum();

  if (aggregate.value) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const c = getChartAggData('weather_code', i, j);
        if (!codes.has(c)) {
          codes.set(c, new Array(n).fill(0));
        }
        codes.get(c)[i]++;
      }
    }
  }
  else {
    for (let i = 0; i < n; i++) {
      const c = getChartData('weather_code', i);
      if (!codes.has(c)) {
        codes.set(c, new Array(n).fill(0));
      }
      codes.get(c)[i]++;
    }
  }

  const codePercentDatasets = []
  for (const [code, counts] of codes) {
    codePercentDatasets.push({
      label: getWMOCodeLabel(code),
      data: counts.map((c) => 100 * c / m),
      stack: "Stack 0"
    })
  }

  data_code.value = {
    labels: getChartLabels(),
    datasets: codePercentDatasets
  }
}

function refreshTempStats() {
  data_temp.value = null;

  const temperatures_min = []
  const temperatures_mean = []
  const temperatures_max = []

  if (aggregate.value) {
    const n = getChartDataNum();
    const m = getChartAggDataNum();
    for (let i = 0; i < n; i++) {
      var mean = getChartAggData('temperature_2m_mean', i, 0);
      var min = getChartAggData('temperature_2m_min', i, 0);
      var max = getChartAggData('temperature_2m_max', i, 0);
      for (let j = 1; j < m; j++) {
        mean += getChartAggData('temperature_2m_mean', i, j);
        const dmin = getChartAggData('temperature_2m_min', i, j);
        if (dmin < min) min = dmin;
        const dmax = getChartAggData('temperature_2m_max', i, j);
        if (dmax > max) max = dmax; }
      mean = mean / m;
      temperatures_mean.push(mean);
      temperatures_min.push(min);
      temperatures_max.push(max);
    }
  }
  else {
    const n = getChartDataNum();
    for (let i = 0; i < n; i++) {
      temperatures_mean.push(getChartData('temperature_2m_mean', i));
      temperatures_min.push(getChartData('temperature_2m_min', i));
      temperatures_max.push(getChartData('temperature_2m_max', i));
    }
  }

  data_temp.value = {
    labels: getChartLabels(),
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

function getChartDataNum() {
  return chartMode.value.index == 0 ? dayNum.value : yearNum.value;
}

function getChartAggDataNum() {
  return chartMode.value.index == 0 ? yearNum.value : dayNum.value;
}

function getChartData(fieldId, i) {
  return chartMode.value.index == 0 ? rawData[selectedYear.value.index][fieldId][i] : rawData[i][fieldId][selectedDay.value.index];
}

function getChartAggData(fieldId, i, j) {
  return chartMode.value.index == 0 ? rawData[j][fieldId][i] : rawData[i][fieldId][j];
}

function getChartLabels() {
  return chartMode.value.index == 0 ? dayLabels.value : yearLabels.value;
}

function refreshFieldStats(fieldId, fieldDisplayName, dataRef) {
  dataRef.value = null;

  const field_mean = []
  const field_max = []

  if (aggregate.value) {
    const n = getChartDataNum();
    const m = getChartAggDataNum();
    for (let i = 0; i < n; i++) {
      var mean = getChartAggData(fieldId, i, 0);
      var max = mean;
      for (let j = 1; j < m; j++) {
        const d = getChartAggData(fieldId, i, j);
        mean += d;
        if (d > max) max = d;
      }
      mean = mean / m;
      field_mean.push(mean);
      field_max.push(max);
    }

    dataRef.value = {
      labels: getChartLabels(), // dayLabels.value,
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
    const n = getChartDataNum();
    for (let i = 0; i < n; i++) {
      field_mean.push(getChartData(fieldId, i));
    }

    dataRef.value = {
      labels: getChartLabels(), // dayLabels.value,
      datasets: [
        {
          label: fieldDisplayName,
          data: field_mean
        }
      ]
    }
  }
}

const cbSource = ref("");

var cbText, cbCopy, cbCopied, cbIsSupported;
onMounted(() => {
  const { text, copy, copied, isSupported } = useClipboard({ cbSource, legacy: true });
  cbText = text;
  cbCopy = copy;
  cbCopied = copied;
  cbIsSupported = isSupported;
})

</script>



<template>
  <Panel header="3. Weather stats">
    <Button id="fetchButton" class="textButton" v-if="!freshData && (generationProgress == 100)" label="Fetch stats" icon="pi pi-chart-bar" @click="download"></Button>
    <ProgressBar id="bar" v-if="generationProgress < 100" :value="generationProgress" :showValue="false"
      :pt:value:style="{ 'transition-property': 'none' }"></ProgressBar>
    <p v-if="downloadStatusMessage != null" class="p-error"> {{ downloadStatusMessage }} </p>

    <div v-if="hasData">
      <div id="chartControls" v-if="hasData">
        <SelectButton v-model="chartMode" :options="chartModes" optionLabel="label" @update:model-value="refresh"></SelectButton>
        <span id="aggYears">
          <Checkbox size="large" inputId="aggYears" v-model="aggregate" binary @update:modelValue="refresh" />
        </span>
        <span id="aggYearsLabel">
          <label for="aggYears">Aggregate</label>
        </span>

        <div class="timeSelector" v-if="!aggregate && chartMode.index == 0">
          <Select id="yearSelector" v-model="selectedYear" :options="yearOptions"
            optionLabel="label" @update:modelValue="refresh"></Select>
          <Button class="prevYear" icon="pi pi-minus" rounded variant="outlined" severity="secondary"
            v-if="yearOptions != null"
            :disabled="(yearOptions == null) || (selectedYear == null) || (selectedYear.index == 0)"
            @click="selectedYear = yearOptions[selectedYear.index - 1]; refresh();"></Button>
          <Button class="nextYear" icon="pi pi-plus" rounded variant="outlined" severity="secondary"
            v-if="(yearOptions != null)"
            :disabled="(yearOptions == null) || (selectedYear == null) || (selectedYear.index == yearOptions.length - 1)"
            @click="selectedYear = yearOptions[selectedYear.index + 1]; refresh();"></Button>
        </div>

        <div class="timeSelector" v-if="!aggregate && chartMode.index == 1">
          <Select id="daySelect" v-model="selectedDay" :options="dayOptions"
            optionLabel="label" @update:modelValue="refresh"></Select>
          <Button class="prevDay" icon="pi pi-minus" rounded variant="outlined" severity="secondary"
            v-if="dayOptions != null"
            :disabled="(dayOptions == null) || (selectedDay == null) || (selectedDay.index == 0)"
            @click="selectedDay = dayOptions[selectedDay.index - 1]; refresh();"></Button>
          <Button class="nextDay" icon="pi pi-plus" rounded variant="outlined" severity="secondary"
            v-if="(dayOptions != null)"
            :disabled="(dayOptions == null) || (selectedDay == null) || (selectedDay.index == dayOptions.length - 1)"
            @click="selectedDay = dayOptions[selectedDay.index + 1]; refresh();"></Button>
        </div>
        <span id="filler"></span>
        <Button class="textButton" :label="copyButtonLabel" :icon="copyButtonIcon" severity="secondary"
          @click="copyButtonClick"></Button>
        <Button class="textButton" :label="shareButtonLabel" :icon="shareButtonIcon" severity="secondary"
          @click="shareButtonClick"></Button>
      </div>
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
  </Panel>
</template>

<style scoped>
.textButton {
  width: 9rem;
  height: 3.2rem;
}

#bar {
  margin-bottom: 1rem;
}

#chartControls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2rem;
  min-height: 4rem;
}

#chartControls .timeSelector {
  display: flex;
  gap: 0.25rem;
}

#aggYearsLabel {
  margin-left: -1rem;
}

#filler {
  flex-grow: 1;
}

#chartGroupContainer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
  gap: 3rem;
}

.chartCointainer {
  width: 100%;
  max-width: 550px;
  flex-grow: 1;
  background-color: rgba(0, 0, 0, 0.015);
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
