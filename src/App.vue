<script setup>


import Panel from 'primevue/panel';
import Locator from './components/Locator.vue'
import DateSelector from './components/DateSelector.vue';

</script>

<template>
    <div>
        <Panel header="Step 1: select location">
            <Locator></Locator>
        </Panel>

        <br/>

        <Panel header="Step 2: select date">
            <DateSelector></DateSelector>
        </Panel>
    </div>
</template>