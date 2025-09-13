<script setup>

import { ref, computed, onMounted } from 'vue';
import Panel from 'primevue/panel'
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import FloatLabel from 'primevue/floatlabel';
import { getNthWeekday, getNthToLastWeekday, getWeekdayAndN, getWeekdayAndNToLast } from './dateHelper.js';


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

const selectedDateRangesSummary = computed(() => {
    return 'Selected ' + yearNum.value + " " + (dayDelta.value > 0 ? 'date range' : 'date') + (yearNum.value > 1 ? "s" : "");
})

defineExpose({
    selectedDateRanges, dayDelta
})

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

        selectedDateRanges.value.sort( (r1, r2) => r1.start - r2.start );
    }
}

function updateAll() {
    updateModes();
    updateSelectedDateRanges();
}

onMounted(() => {
    updateAll();
});

</script>

<template>

    <div id="dateSelector">
        <span id="baseDateSelector">
            <FloatLabel variant="in">
                <DatePicker fluid inputId="baseDateSelector" v-model="baseDate" :show-icon="true" @update:model-value="updateAll" />
                <label for="baseDateSelector">Base date</label>
            </FloatLabel>
        </span>

        <span id="dayDeltaSelector">
            <FloatLabel variant="in">
                <InputNumber fluid inputId="dayDeltaSelector" v-model="dayDelta" :min="0" :max="180" mode="decimal" show-buttons buttonLayout="horizontal" :step="1" :allowEmtpy="false" @update:model-value="updateAll" />
                <label for="dayDeltaSelector">Day delta</label>
            </FloatLabel>
        </span>

        <span id="yearNumSelector">
            <FloatLabel variant="in">
                <InputNumber fluid inputId="yearNumSelector" v-model="yearNum" :min="1" mode="decimal" show-buttons buttonLayout="horizontal" :step="1" @update:model-value="updateAll" />
                <label for="yearNumSelector">Number of years</label>
            </FloatLabel>
        </span>

        <span id="modeSelector">
            <FloatLabel variant="in">
                <Select fluid inputId="modeSelector" v-model="mode" :options="modes" option-label="name" checkmark @update:model-value="updateAll" />
                <label for="modeSelector">Day calculation mode</label>
            </FloatLabel>
        </span>
    </div>

    <br/>

    <panel :header="selectedDateRangesSummary" toggleable collapsed @update:collapsed="console.log(selectedDateRangesSummary)">
        <ul>
            <li v-if="dayDelta == 0" v-for="range in selectedDateRanges" :key="range.start.toISOString()">
                {{ range.start.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
            </li>
            <li v-if="dayDelta > 0" v-for="range in selectedDateRanges" :key="range.start.toISOString()">
                {{ range.start.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
                &ndash;
                {{ range.end.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
            </li>
        </ul>
    </panel>

</template>

<style scoped>
    #dateSelector {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
    }

    #baseDateSelector {
        flex-basis: 12rem;
    }

    #dayDeltaSelector {
        flex-basis: 12rem;
    }

    #yearNumSelector {
        flex-basis: 12rem;
    }

    #modeSelector {
        flex-grow: 1;
        min-width: 16rem;
    }

</style>
