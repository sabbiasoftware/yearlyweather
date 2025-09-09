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
    weatherStatistics.value.generateStatistics(locator.value.selectedLocation.lon, locator.value.selectedLocation.lat, dateSelector.value.selectedDates, 3);
}

</script>

<template>
    <div>
        <br/>

        <Panel header="Step 1: select location">
            <Locator ref="locator"></Locator>
        </Panel>

        <br/>

        <Panel header="Step 2: select date">
            <DateSelector ref="dateSelector"></DateSelector>
        </Panel>

        <br/>

        <Panel header="Step 3: view weather stats">
            <Button label="Generate stats" @click="generateStats"></Button>
            <WeatherStatistics ref="weatherStatistics"></WeatherStatistics>
        </Panel>

        <br/>
</div>
</template>