<script setup>


import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Locator from './components/Locator.vue'
import DateSelector from './components/DateSelector.vue';
import WeatherStatistics from './components/WeatherStatistics.vue';
import { useTemplateRef } from 'vue';

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
        true // useMockData
    );
}

</script>

<template>
    <div>
        <br/>

        <Panel header="Yearly Weather" toggleable collapsed>
            <p>Ever wonder what the weather was like on your birthdays? Whether it rained on Thanksgiving in the past 10 years? Or how about historical weather on first Saturdays of October, on the day of your fav running race? Seek no more. This little app is (hopefully) for you.</p>
            <br/>
            <p><span class="strong">Note</span>: This page is NOT intended to forecast weather. It presents purely historical weather data.</p>
            <br/>
            <p><span class="strong">Public web services used:</span> Geocoding: <a href="https://photon.komoot.io">photon.komoot.io</a>, Mapping: <a href="https://openstreetmap.org">openstreetmap.org</a>, Weather: <a href="https://open-meteo.com">open-meteo.com</a></p>
        </Panel>

        <br/>

        <Panel header="Step 1: Select location">
            <Locator ref="locator"></Locator>
        </Panel>

        <br/>

        <Panel header="Step 2: Select dates / date ranges">
            <DateSelector ref="dateSelector"></DateSelector>
        </Panel>

        <br/>

        <Panel header="Step 3: View weather stats">
            <Button label="Fetch stats" icon="pi pi-chart-bar" @click="generateStats"></Button>
            <WeatherStatistics ref="weatherStatistics"></WeatherStatistics>
        </Panel>

        <br/>
</div>
</template>

<style scoped>
    button {
        margin-bottom: 1rem;
        height: 3.2rem;
    }

    .strong {
        font-weight: bold;
    }
</style>