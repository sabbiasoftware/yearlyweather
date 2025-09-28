<script setup>

import Header from './Header.vue'
import Locator from './Locator.vue'
import DateSelector from './DateSelector.vue'
import WeatherStatistics from './WeatherStatistics.vue'
import Footer from './Footer.vue'

</script>

<template>
  <div>
    <Header></Header>
    <Locator></Locator>
    <DateSelector></DateSelector>
    <WeatherStatistics></WeatherStatistics>
    <Footer></Footer>
  </div>
</template>

<style scoped>
div {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
</style>
