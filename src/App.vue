<script setup>

import { ref, computed, onMounted, useTemplateRef } from 'vue';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Locator from './components/Locator.vue'
import DateSelector from './components/DateSelector.vue';
import WeatherStatistics from './components/WeatherStatistics.vue';

const darkModeToken = 'my-app-dark';
const darkMode = ref(false);

const dateSelector = useTemplateRef('dateSelector');
const locator = useTemplateRef('locator');
const weatherStatistics = useTemplateRef('weatherStatistics');

function generateStats() {
  //console.log('Selected dates:', dateSelector.value.selectedDates);
  //console.log('Selected location:', locator.value.selectedLocation.lon);
  weatherStatistics.value.download(
    locator.value.selectedLocation.lon,
    locator.value.selectedLocation.lat,
    dateSelector.value.selectedDateRanges,
    false // useMockData
  );
}

function toggleDarkMode() {
  darkMode.value = document.documentElement.classList.toggle(darkModeToken);
}

const darkModeIconClass = computed(() => {
  return darkMode.value ? 'pi pi-moon' : 'pi pi-sun';
});

onMounted(() => {
  darkMode.value = document.body.classList.contains(darkModeToken);
});

</script>

<template>
  <div id="panelContainer">
    <br />

    <Panel header="Yearly Weather" toggleable collapsed>
      <p>Ever wonder what the weather was like on your birthdays? Whether it rained on Thanksgiving in the past 10
        years? Or how about historical weather on first Saturdays of October, on the day of your favorite running race?
        Seek no more. This little app is (hopefully) for you.</p>
      <p>Feel free to send any feedback to <a href="mailto://sabbiasoftware.gmail.com">sabbiasoftware@gmail.com</a>.</p>
      <p>Public web services used:</p>
      <ul>
        <li>Geocoding: <a href="https://photon.komoot.io">photon.komoot.io</a></li>
        <li>Mapping: <a href="https://openstreetmap.org">openstreetmap.org</a></li>
        <li>Weather: <a href="https://open-meteo.com">open-meteo.com</a></li>
        <li>Favicon: <a href="https://www.flaticon.com/free-icons/clouds-and-sun" title="clouds and sun icons">Clouds and sun icons created by riajulislam - Flaticon</a></li>
      </ul>
      <p><span class="strong">Note</span>: This page is NOT intended to forecast weather. It presents purely historical
        weather data.</p>
    </Panel>

    <br />

    <Panel header="Step 1: Select location" toggleable>
      <Locator ref="locator"></Locator>
    </Panel>

    <br />

    <Panel header="Step 2: Select dates / date ranges" toggleable>
      <DateSelector ref="dateSelector"></DateSelector>
    </Panel>

    <br />

    <Panel header="Step 3: View weather stats">
      <Button id="fetchButton" label="Fetch stats" icon="pi pi-chart-bar" @click="generateStats"></Button>
      <WeatherStatistics ref="weatherStatistics"></WeatherStatistics>
    </Panel>

    <br />

    <Panel header="Information">
      <div id="bottomBar">
        <!--<a href="mailto://sabbiasoftware.gmail.com"><i class="pi pi-at"></i> sabbiasoftware@gmail.com</a>-->
        <span>Last update: Sep 23, 2025</span>
        <span class="filler">&nbsp;</span>
        <Button id="darkButton" :icon="darkModeIconClass" severity="primary" v-tooltip="'Switch between dark and light mode'" @click="toggleDarkMode" />
        <Button id="bmcButton" as="a" href="https://buymeacoffee.com/sabbiasoftware"><img src="./assets/bmc-logo.svg"/></Button>
        <!--<a href="https://buymeacoffee.com/sabbiasoftware"><img src="/public/bmc.png" class="bmc"/></a>-->
      </div>

    </Panel>

    <br />

  </div>
</template>

<style scoped>
#bottomBar {
  display: flex;
  justify-content: flex-end;
  align-items:center;
  gap: 1rem; 
}

#fetchButton {
  margin-bottom: 1rem;
  height: 3.2rem;
}

p {
  margin: 1rem;
}

.strong {
  font-weight: bold;
}

.filler {
  flex-grow:1;
}

#bmcButton {
  height: 2.5rem;
  width: 2.5rem;
  img {
    height: 1.6rem;
    width: 1.6rem;
  }
}

.bmc {
  height: 2.5rem;
  margin-bottom: -0.4rem;
}

</style>
