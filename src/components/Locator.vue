<script setup>

import { ref, computed, onMounted } from 'vue'
import Panel from 'primevue/panel'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import { FloatLabel } from 'primevue'
import Map from './Map.vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { statParams } from './statParams'

const route = useRoute();

const selectedLocation = ref({
  name: '',
  lon: 0.0,
  lat: 0.0
})
const panelHeader = computed(() => {
  return `1. Location (Lat: ${ statParams.lat.toFixed(3) }, Lon: ${ statParams.lon.toFixed(3) })`
})
const selectedLocationSuggestions = ref([])
const panelCollapsed = ref(false)

const searchLocationInProgress = ref(false)
const setLocationToUserInProgress = ref(false)

const mapComponent = ref(null)

const setLocation = () => {
  console.log(`Setting location to ${ selectedLocation.value.lon } (${ typeof(selectedLocation.value.lon) }), ${ selectedLocation.value.lat } (${ typeof(selectedLocation.value.lat) })`)
    statParams.lon = selectedLocation.value.lon
    statParams.lat = selectedLocation.value.lat
    mapComponent.value.setLocation(selectedLocation.value.lon, selectedLocation.value.lat)
}

const searchLocation = () => {
    searchLocationInProgress.value = true

    const query = typeof(selectedLocation.value) === 'string' ? selectedLocation.value : selectedLocation.value.name

    axios.get('https://photon.komoot.io/api/', {
        params: {
            q: query,
            limit: 10
        }
    }).then(response => {
        selectedLocationSuggestions.value = response.data.features.map(f => ({
            name: f.properties.name + ' (' + f.properties.type + ' in ' + f.properties.country + ')',
            lon: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1]
        }))
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
    selectedLocation.value = {
      name: 'Current location',
      lon: newLon,
      lat: newLat
    }
    setLocation()
}

const setLocationToUserError = (message, code) => {
    setLocationToUserInProgress.value = false
}

onMounted(() => {
  if (route.query.lat) {
    var urlLat = Number.parseFloat(route.query.lat);
    if ((-90 <= urlLat) && (urlLat <= 90)) {
      if (route.query.lon) {
        var urlLon = Number.parseFloat(route.query.lon);
        if ((-180 <= urlLon) && (urlLon <= 180)) {
          selectedLocation.value.lon = urlLon;
          selectedLocation.value.lat = urlLat;
          panelCollapsed.value = true;
          setLocation();
          statParams.locatorParamsFound = true;
        }
      }
    }
  }
})
</script>

<template>
  <Panel :header="panelHeader" toggleable :collapsed="panelCollapsed">
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
            optionLabel="name" 
            @complete="searchLocation" 
            @option-select="setLocation" />
          <label for="locationInput">Search place by name</label>
        </FloatLabel>
      </span>
      <Button id="searchButton" label="Search" icon="pi pi-search" @click='searchLocation'></Button>
      <Button v-if="!setLocationToUserInProgress" id="locateButton" label="Find me" icon="pi pi-map-marker" @click='setLocationToUser'></Button>
      <Button v-if="setLocationToUserInProgress" id="locateButton" label="Find me" icon="pi pi-spin pi-spinner" @click='setLocationToUser'></Button>
    </div>
    <div id="coordinates">Lat: {{ statParams.lat }}, Lon: {{ statParams.lon }}</div>
    <Map ref="mapComponent" @set-location-to-user-complete="setLocationToUserComplete" @set-location-to-user-error="setLocationToUserError"></Map>
  </Panel>
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
