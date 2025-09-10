<script setup>

import { ref } from 'vue';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import FloatLabel from 'primevue/floatlabel';


const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

const baseDate = ref(new Date());
const dayDelta = ref(3)
const yearNum = ref(10)
const modes = ref([
    { id: 0, name: 'Same month and day' },
    { id: 1, name: 'First Saturday of December' },
    { id: 2, name: 'Second to last Saturday of December' },
]);
const mode = ref(modes.value[0]);

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" })
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" })

const selectedDateRanges = ref([])

defineExpose({
    selectedDateRanges, dayDelta
})

// return the weekday and its number in the month, eg { 7, 2 } for second Saturday of any month
function getWeekdayAndN(date) {
    return { 
        weekday: date.getDay(), 
        n: Math.floor((date.getDate() - 1) / 7)
    }
}

// return the weekday and its number in the month from the end, eg { 7, 2 } for second to last Saturday of any month
function getWeekdayAndNToLast(date) {
    const daysLeftInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() - date.getDate();
    return {
        weekday: date.getDay(),
        n: Math.floor(daysLeftInMonth / 7)
    }
}

function getNthWeekday(year, month, n, weekday) {
    const firstWeekday = new Date(year, month, 1).getDay();
    return new Date(year, month, (weekday - firstWeekday + 7) % 7 + 1 + n * 7);
}

function getNthToLastWeekday(year, month, n, weekday) {
    const lastDate = new Date(year, month + 1, 0);
    const lastDay = lastDate.getDate();
    const lastWeekday = lastDate.getDay();
    return new Date(year, month, lastDay - (lastWeekday - weekday + 7) % 7 - n * 7)
}

function updateModes() {
    const weekdayAndN = getWeekdayAndN(baseDate.value)
    const weekdayAndNToLast = getWeekdayAndNToLast(baseDate.value)
    const weekdayString = weekdayFormatter.format(baseDate.value);

    modes.value[1].name = `${ordinals[weekdayAndN.n]} ${weekdayString} of ${monthFormatter.format(baseDate.value)}`;
    if (weekdayAndNToLast.n == 0) {
        modes.value[2].name = `Last ${weekdayString} of ${monthFormatter.format(baseDate.value)}`;
    } else {
        modes.value[2].name = `${ordinals[weekdayAndNToLast.n]} to last ${weekdayString} of ${monthFormatter.format(baseDate.value)}`;
    }
}

function updateSelectedDateRanges() {
    selectedDateRanges.value = [];
    const baseWeekdayN = getWeekdayAndN(baseDate.value);
    const baseWeekdayAndNToLast = getWeekdayAndNToLast(baseDate.value);
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let year = baseDate.value.getFullYear(); selectedDateRanges.value.length < yearNum.value; year--) {
        let date;
        switch (mode.value.id) {
            case 0: // Same month and day
                date = new Date(year, baseDate.value.getMonth(), baseDate.value.getDate());
                break;
            case 1: // First nth weekday of month
                date = getNthWeekday(year, baseDate.value.getMonth(), baseWeekdayN.n, baseWeekdayN.weekday)
                break;
            case 2: // Nth to last weekday of month
                date = getNthToLastWeekday(year, baseDate.value.getMonth(), baseWeekdayAndNToLast.n, baseWeekdayAndNToLast.weekday)
                break;
        }

        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayDelta.value);
        const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayDelta.value);
        if (endDate < today) {
            selectedDateRanges.value.push( { start: startDate, end: endDate } );
        }

        // selectedDateRanges.reverse();
    }
}

function updateAll() {
    updateModes();
    updateSelectedDateRanges();
}

updateAll();
</script>

<template>

    <div id="dateSelector">
        <div>
        <FloatLabel variant="in">
            <DatePicker fluid inputId="baseDateSelector" v-model="baseDate" :show-icon="true" @update:model-value="updateAll" />
            <label for="baseDateSelector">Base date</label>
        </FloatLabel>
    </div>

        <FloatLabel variant="in">
            <InputNumber fluid inputId="dayDeltaSelector" v-model="dayDelta" :min="0" :max="180" mode="decimal" show-buttons buttonLayout="horizontal" :step="1" :allowEmtpy="false" @update:model-value="updateAll" />
            <label for="dayDeltaSelector">Day delta</label>
        </FloatLabel>

        <FloatLabel variant="in">
            <InputNumber fluid inputId="yearNumSelector" v-model="yearNum" :min="1" mode="decimal" show-buttons buttonLayout="horizontal" :step="1" @update:model-value="updateAll" />
            <label for="yearNumSelector">Number of years</label>
        </FloatLabel>

        <FloatLabel variant="in">
            <Select fluid inputId="modeSelector" v-model="mode" :options="modes" option-label="name" checkmark @update:model-value="updateAll" />
            <label for="modeSelector">Day calculation mode</label>
        </FloatLabel>
    </div>

    <br/>

    <div>
        <span>Selected {{ dayDelta > 0 ? "date ranges:" : "dates:" }}</span>
        <ul>
            <li v-if="dayDelta == 0" v-for="range in selectedDateRanges" :key="range.start.toISOString()">
                {{ range.start.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
            </li>
            <li v-if="dayDelta > 0" v-for="range in selectedDateRanges" :key="range.start.toISOString()">
                {{ range.start.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
                -
                {{ range.end.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
            </li>
        </ul>
    </div>

</template>

<style scoped>
    span.test {
        background-color: red;
    }

    #dateSelector {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 2fr;
        column-gap: 8px;
        row-gap: 8px;
    }


</style>