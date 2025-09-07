<script setup>

import { ref } from 'vue'
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Map from './Map.vue'
import axios from 'axios';

const emptyLocation = {
    osm_id: 0,
    name: '?',
    type: '?',
    country: '?',
    display_name: '',
    lon: 0.0,
    lat: 0.0,
}

const selectedLocation = ref(emptyLocation)
const selectedLocationSuggestions = ref([])

const searchLocationInProgress = ref(false)
const setLocationToUserInProgress = ref(false)

const mapComponent = ref(null)

const setLocation = (lon, lat) => {
    console.log('Setting location to ' + lon + ", " + lat)
    mapComponent.value.setLocation(lon, lat)
}

const searchLocation = () => {
    searchLocationInProgress.value = true

    const query = typeof(selectedLocation.value) === 'string' ? selectedLocation.value : selectedLocation.value.name

    //console.log('Searching location: ' + typeof(selectedLocation.value))

    axios.get('https://photon.komoot.io/api/', {
        params: {
            q: query,
            //format: 'json',
            limit: 5
        }
    }).then(response => {
        selectedLocationSuggestions.value = response.data.features.map(f => ({
            osm_id: f.properties.osm_id,
            name: f.properties.name,
            type: f.properties.osm_value,
            country: f.properties.country,
            display_name: f.properties.name + ' (' + f.properties.type + ' in ' + f.properties.country + ')',
            lon: f.geometry.coordinates[1],
            lat: f.geometry.coordinates[0],
        }))
        //console.log(selectedLocationSuggestions.value)
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
    
    selectedLocation.value = emptyLocation;
    selectedLocation.value.lon = newLon
    selectedLocation.value.lat = newLat
    selectedLocation.value.display_name = 'Current location'
    setLocation(newLat, newLon)
}

const setLocationToUserError = (message, code) => {
    setLocationToUserInProgress.value = false
}

defineExpose({
    selectedLocation
})

</script>

<template>
    <div id="locator">
        <AutoComplete
            id="locationText" 
            v-model="selectedLocation" 
            :delay="1000" 
            :suggestions="selectedLocationSuggestions" 
            
            dropdown 
            fluid
            optionLabel="display_name" 
            @complete="searchLocation" 
            @option-select="setLocation(selectedLocation.lon, selectedLocation.lat)" />
        <Button id="searchButton" @click=''>Search</Button>
        <span id="coordinates">Selected coordinates: {{ selectedLocation.lat }}, {{ selectedLocation.lon }}</span>
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
        grid-template-columns: 1fr 120px 120px;
        column-gap: 8px;
        row-gap: 8px;
    }

    #locationText {
        grid-row: 1;
        grid-column: 1 / 2;
    }

    #searchButton {
        grid-row: 1;
        grid-column: 2;
    }

    #coordinates {
        grid-row: 2;
        grid-column: 1 / 4;
    }

    #locateButton {
        grid-row: 1;
        grid-column: 3;
    }

    #map {
        grid-column: 1 / 3;
    }
</style>