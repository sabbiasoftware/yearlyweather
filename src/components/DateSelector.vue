<script setup>

import { ref } from 'vue';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';

const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

const baseDate = ref(new Date());
const yearNum = ref(10)
const modes = ref([
    { id: 0, name: 'Same month and day' },
    { id: 1, name: 'First Saturday of December' },
    { id: 2, name: 'Second to last Saturday of December' },
]);
const mode = ref(modes.value[0]);

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" })
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" })

const selectedDates = ref([]);

defineExpose({
    selectedDates
})

function updateModes() {
    //const weekday = baseDate.value.getDay(); // 0 (Sun) to 6 (Sat)
    const n = Math.floor((baseDate.value.getDate() - 1) / 7); // 0 to 4
    const daysLeftInMonth = new Date(baseDate.value.getFullYear(), baseDate.value.getMonth() + 1, 0).getDate() - baseDate.value.getDate();
    const nn = Math.floor(daysLeftInMonth / 7); // 0 to 4
    const weekdayString = weekdayFormatter.format(baseDate.value);
    modes.value[1].name = `${ordinals[n]} ${weekdayString} of ${monthFormatter.format(baseDate.value)}`;
    if (nn == 0) {
        modes.value[2].name = `Last ${weekdayString} of ${monthFormatter.format(baseDate.value)}`;
    } else {
        modes.value[2].name = `${ordinals[nn]} to last ${weekdayString} of ${monthFormatter.format(baseDate.value)}`;
    }
}

function updateSelectedDates() {
    selectedDates.value = [];
    const baseYear = baseDate.value.getFullYear();
    for (let year = baseYear - yearNum.value; year < baseYear; year++) {
        let date;
        switch (mode.value.id) {
            case 0: // Same month and day
                date = new Date(year, baseDate.value.getMonth(), baseDate.value.getDate());
                break;
            case 1: // First weekday of month
                date = new Date(year, baseDate.value.getMonth(), 1);
                while (date.getDay() != baseDate.value.getDay()) {
                    date.setDate(date.getDate() + 1);
                }
                break;
            case 2: // Second to last weekday of month
                date = new Date(year, baseDate.value.getMonth() + 1, 0); // Last day of month
                while (date.getDay() != baseDate.value.getDay()) {
                    date.setDate(date.getDate() - 1);
                }
                if (date.getDate() > 7) {
                    date.setDate(date.getDate() - 7);
                }
                break;
        }
        selectedDates.value.push(date);
    }
}

function updateAll() {
    updateModes();
    updateSelectedDates();
}

updateAll();
</script>

<template>

    <div id="dateSelector">
        <DatePicker v-model="baseDate" :show-icon="true" @update:model-value="updateAll"/>
        <InputNumber v-model="yearNum" :min="1" mode="decimal" show-buttons buttonLayout="horizontal" :step="1" @update:model-value="updateAll" />
        <Select v-model="mode" :options="modes" option-label="name" checkmark @update:model-value="updateAll" />
    </div>

    <br/>

    <div>
        <span>Selected dates:</span>
        <ul>
            <li v-for="date in selectedDates" :key="date.toISOString()">{{ date.toDateString() }}</li>
        </ul>
    </div>

</template>

<style scoped>
    #dateSelector {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        column-gap: 8px;
        row-gap: 8px;
    }

    .p-datepicker {
        grid-row: 1;
        grid-column: 1 / 2;
    }

    .p-inputnumber {
        grid-row: 1;
        grid-column: 2 / 3;
    }

    .p-listbox {
        grid-row: 1;
        grid-column: 3 / 4;
    }

</style>