<script setup>

import { ref } from 'vue'
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import { FloatLabel } from 'primevue';
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
            limit: 10
        }
    }).then(response => {
        selectedLocationSuggestions.value = response.data.features.map(f => ({
            osm_id: f.properties.osm_id,
            name: f.properties.name,
            type: f.properties.osm_value,
            country: f.properties.country,
            display_name: f.properties.name + ' (' + f.properties.type + ' in ' + f.properties.country + ')',
            lon: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
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
    setLocation(newLon, newLat)
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
        <span id="locationText">
            <FloatLabel variant="in">
                <AutoComplete
                    id="locationInput"
                    v-model="selectedLocation" 
                    :delay="1000" 
                    :suggestions="selectedLocationSuggestions" 
                    
                    dropdown 
                    fluid
                    optionLabel="display_name" 
                    @complete="searchLocation" 
                    @option-select="setLocation(selectedLocation.lon, selectedLocation.lat)" />
                <label for="locationInput">Search place by name</label>
            </FloatLabel>
        </span>
        <Button id="searchButton" label="Search" icon="pi pi-search" @click=''></Button>
        <Button v-if="!setLocationToUserInProgress" id="locateButton" label="Find me" icon="pi pi-map-marker" @click='setLocationToUser'></Button>
        <Button v-if="setLocationToUserInProgress" id="locateButton" label="Find me" icon="pi pi-spin pi-spinner" @click='setLocationToUser'></Button>
    </div>
    <div id="coordinates">Lat: {{ selectedLocation.lat }}, Lon: {{ selectedLocation.lon }}</div>
    <Map ref="mapComponent" @set-location-to-user-complete="setLocationToUserComplete" @set-location-to-user-error="setLocationToUserError"></Map>
</template>

<style scoped>
    #locator {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    #locationText {
        flex-grow: 1;
        min-width: 16rem;
    }

    #searchButton {
        flex-basis: 8rem;
    }

    #locateButton {
        flex-basis: 8rem;
    }

    #coordinates {
        margin-bottom: 0.5rem;
    }

    button {
        min-height: 3.2rem;
    }
</style>
