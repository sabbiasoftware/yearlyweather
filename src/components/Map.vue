<script setup>

import leaflet from 'leaflet'
import { onMounted } from 'vue';
import { GestureHandling } from "leaflet-gesture-handling";
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";

var map = null
var marker = null

const setLocation = (lon, lat) => {
    marker.setLatLng( { lat: lat, lng: lon } )
    map.flyTo(new L.LatLng(lat, lon), 10)
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
    L.Map.addInitHook("addHandler", "GestureHandling", GestureHandling);
    map = L.map("mapComponent", {
        center: [0, 0],
        zoom: 4,
        gestureHandling: true,
        gestureHandlingOptions: {
            text: {
                touch: "Use two fingers to pan",
                scroll: "Use ctrl + scroll to zoom",
                scrollMac: "Use \u2318 + scroll to zoom"
            }
        }
    });

    map.on('locationfound', locationFound)
    map.on('locationerror', locationError)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    marker = L.marker( { lat: 0, lng: 0 } ).addTo(map)

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
