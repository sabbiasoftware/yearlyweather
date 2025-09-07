<script setup>

import leaflet from 'leaflet'
import { onMounted } from 'vue';

var map = null
var marker = null

const setLocation = (lon, lat) => {
    if (marker) {
        marker.setLatLng([lon, lat])
    }
    else {
        marker = L.marker([lon, lat]).addTo(map)
    }
    map.flyTo(new L.LatLng(lon, lat), 10)
}

const setLocationToUser = () => {
    console.log('Trying to locate user...')
    map.locate({ setView: false, maxZoom: 10 })
}

defineExpose({ setLocation, setLocationToUser })

const emit = defineEmits(["setLocationToUserComplete", "setLocationToUserError"])

const locationFound = (e) => {
    console.log('location found: ' + e.latlng.lng + ", " + e.latlng.lat)
    emit("setLocationToUserComplete", e.latlng.lng, e.latlng.lat)
}

const locationError = (e) => {
    console.log(e.message + ' ' + e.code)
    emit("setLocationToUserError", e.message, e.code)
}

onMounted(() => {
    map = leaflet.map("mapComponent").setView([0, 0], 4)

    map.on('locationfound', locationFound)
    map.on('locationerror', locationError)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

});

</script>

<template>
    <div id="mapComponent"></div>
</template>

<style>
    @import "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    #mapComponent { 
        height: 360px;
        width: 100%;
        grid-row: 3;
        grid-column: 1 / 4;
    }
</style>