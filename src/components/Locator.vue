<script setup>

import { ref } from 'vue'
import AutoComplete from 'primevue/autocomplete';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Map from './Map.vue'
import axios from 'axios';

const locationText = ref('')
const selectedLocation = ref(null)
const selectedLocationSuggestions = ref([])
const lon = ref(0.0)
const lat = ref(0.0)

const searchLocationInProgress = ref(false)
const setLocationToUserInProgress = ref(false)

const mapComponent = ref(null)

const setLocation = (lon, lat) => {
    console.log('Setting location to ' + lon + ", " + lat)
    mapComponent.value.setLocation(lon, lat)
}

const searchLocation = () => {
    searchLocationInProgress.value = true

    axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
            q: selectedLocation.value,
            format: 'json',
            limit: 5
        }
    }).then(response => {
        selectedLocationSuggestions.value = response.data
    }).catch(error => {
        console.error('Error searching location:', error)
    }).finally(() => {
        searchLocationInProgress.value = false
    })
}

const setLocationToUser = () => {
    setLocationToUserInProgress.value = true
    mapComponent.value.setLocationToUser()
}

const setLocationToUserComplete = (newLon, newLat) => {
    setLocationToUserInProgress.value = false
    lon.value = newLon
    lat.value = newLat
}

const setLocationToUserError = (message, code) => {
    setLocationToUserInProgress.value = false
}

</script>

<template>
    <div id="locator">
        <AutoComplete id="locationText" v-model="selectedLocation" :delay="1000" :suggestions="selectedLocationSuggestions" datakey="place_id" optionLabel="display_name" @change="searchLocation" @select="setLocation(selectedLocation.lon, selectedLocation.lat)" />
        <Button id="searchButton" @click=''>Search</Button>
        <InputNumber id="lonText" :max-fraction-digits="15" :min="-180" :max="180" v-model="lon" @value-change="setLocation(lon, lat)" />
        <InputNumber id="latText" :max-fraction-digits="15" :min="-90"  :max="90" v-model="lat" />
        <Button id="locateButton" @click='setLocationToUser'>
            <i v-if="setLocationToUserInProgress" class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
            Find me
        </Button>
        <Map ref="mapComponent" @set-location-to-user-complete="setLocationToUserComplete" @set-location-to-user-error="setLocationToUserError"></Map>
    </div>
</template>

<style scoped>
    #locator {
        display: grid;
        grid-template-columns: 1fr 1fr 120px;
        column-gap: 8px;
        row-gap: 8px;
    }

    #locationText {
        grid-row: 1;
        grid-column: 1 / 3;
    }

    #searchButton {
        grid-row: 1;
        grid-column: 3;
    }

    #lonText {
        grid-row: 2;
        grid-column: 1;
    }

    #latText {
        grid-row: 2;
        grid-column: 2;
    }

    #locateButton {
        grid-row: 2;
        grid-column: 3;
    }

    #map {
        grid-column: 1 / 3;
    }
</style>