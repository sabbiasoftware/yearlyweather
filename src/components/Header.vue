<script setup>
import Panel from 'primevue/panel'
</script>

<template>
    <Panel header="Yearly Weather" toggleable collapsed>
      <p>Ever wonder what the weather was like on your birthdays? Whether it rained on Thanksgiving in the past 10
        years? Or how about historical weather on first Saturdays of October, on the day of your favorite running race?
        Seek no more. This little app is (hopefully) for you.</p>
      <p>Feel free to send any feedback to <a href="mailto://sabbiasoftware.gmail.com">sabbiasoftware@gmail.com</a>.</p>
      <p>Credits:</p>
      <ul>
        <li>Geocoding: <a href="https://photon.komoot.io">photon.komoot.io</a></li>
        <li>Mapping: <a href="https://openstreetmap.org">openstreetmap.org</a></li>
        <li>Weather: <a href="https://open-meteo.com">open-meteo.com</a></li>
        <li>Favicon: <a href="https://www.flaticon.com/free-icons/clouds-and-sun" title="clouds and sun icons">Clouds and sun icons created by riajulislam - Flaticon</a></li>
      </ul>
      <p><span class="strong">Note</span>: This page is NOT intended to forecast weather. It presents purely historical
        weather data.</p>
    </Panel>
</template>
