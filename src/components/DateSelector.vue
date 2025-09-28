<script setup>

import { ref, watch, computed, onMounted } from 'vue'
import { statParams } from './statParams.js'
import Panel from 'primevue/panel'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import FloatLabel from 'primevue/floatlabel'
import { useRoute } from 'vue-router'
import { getNthWeekday, getNthToLastWeekday, getWeekdayAndN, getWeekdayAndNToLast, dateToISO } from './dateHelper.js';

const route = useRoute()

const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

const yearModes = ref([
    { id: 0, name: 'Same month and day' },
    { id: 1, name: 'First Saturday of December' },
    { id: 2, name: 'Second to last Saturday of December' },
]);
const yearMode = ref(yearModes.value[statParams.yearMode]);

watch (yearMode, () => { if (yearMode.value.id != statParams.yearMode) { statParams.yearMode = yearMode.value.id; updateYearModes(); } })
watch (statParams, () => { if (statParams.yearMode != yearMode.value.id) { yearMode.value = yearModes[statParams.yearMode]; updateYearModes(); }})

const panelHeader = computed(() => {
  return `2. Time (${ statParams.yearNum } years from ${ dateToISO(statParams.baseDate) })`
})
const panelCollapsed = ref(false)

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" })
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" })

const selectedDateRangesSummary = computed(() => {
    return 'Selected ' + statParams.yearNum + " " + (statParams.dayDelta > 0 ? 'date range' : 'date') + (statParams.yearNum > 1 ? "s" : "");
})

function updateYearModes() {
    const weekdayAndN = getWeekdayAndN(statParams.baseDate)
    const weekdayAndNToLast = getWeekdayAndNToLast(statParams.baseDate)
    const weekdayString = weekdayFormatter.format(statParams.baseDate);

    yearModes.value[1].name = `${ordinals[weekdayAndN.n]} ${weekdayString} of ${monthFormatter.format(statParams.baseDate)}`;
    if (weekdayAndNToLast.n == 0) {
        yearModes.value[2].name = `Last ${weekdayString} of ${monthFormatter.format(statParams.baseDate)}`;
    } else {
        yearModes.value[2].name = `${ordinals[weekdayAndNToLast.n]} to last ${weekdayString} of ${monthFormatter.format(statParams.baseDate)}`;
    }
}

function updateSelectedDateRanges() {
    statParams.selectedDateRanges = [];
    const baseWeekdayN = getWeekdayAndN(statParams.baseDate);
    const baseWeekdayAndNToLast = getWeekdayAndNToLast(statParams.baseDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let year = statParams.baseDate.getFullYear(); statParams.selectedDateRanges.length < statParams.yearNum; year--) {
        let date;
        switch (yearMode.value.id) {
            case 0: // Same month and day
                date = new Date(year, statParams.baseDate.getMonth(), statParams.baseDate.getDate());
                break;
            case 1: // First nth weekday of month
                date = getNthWeekday(year, statParams.baseDate.getMonth(), baseWeekdayN.n, baseWeekdayN.weekday)
                break;
            case 2: // Nth to last weekday of month
                date = getNthToLastWeekday(year, statParams.baseDate.getMonth(), baseWeekdayAndNToLast.n, baseWeekdayAndNToLast.weekday)
                break;
        }

        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - statParams.dayDelta);
        const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + statParams.dayDelta);
        if (endDate < today) {
            statParams.selectedDateRanges.push( { start: startDate, end: endDate } );
        }

        statParams.selectedDateRanges.sort( (r1, r2) => r1.start - r2.start );
    }
}

function updateAll() {
    updateYearModes();
    updateSelectedDateRanges();
}

onMounted(() => {
  var urlQueryNum = 0

  // baseDate
  if (route.query.bd) {
    const d = new Date(route.query.bd)
    if (d.valueOf() != NaN) {
      statParams.baseDate = d
      urlQueryNum++
    }
  }

  // dayDelta
  if (route.query.dd) {
    const d = Number.parseInt(route.query.dd)
    if (d != NaN) {
      statParams.dayDelta = d
      urlQueryNum++
    }
  }
  // yearNum
  if (route.query.yn) {
    const n = Number.parseInt(route.query.yn)
    if (n != NaN) {
      statParams.yearNum = n
      urlQueryNum++
    }
  }
  // yearMode
  if (route.query.m) {
    const m = Number.parseInt(route.query.m)
    if ((m != NaN) && (0 <= m) && (m < yearModes.value.length)) {
      yearMode.value = yearModes.value[m]
      urlQueryNum++
    }
  }

  if (urlQueryNum == 4) {
    panelCollapsed.value = true
  }
  updateAll();
});

</script>

<template>
  <Panel :header="panelHeader" toggleable :collapsed="panelCollapsed">
    <div id="dateSelector">
      <span id="baseDateSelector">
        <FloatLabel variant="in">
          <DatePicker fluid inputId="baseDateSelector" v-model="statParams.baseDate" :show-icon="true" @update:model-value="updateAll" />
          <label for="baseDateSelector">Base date</label>
        </FloatLabel>
      </span>

      <span id="dayDeltaSelector">
        <FloatLabel variant="in">
          <InputNumber fluid inputId="dayDeltaSelector" v-model="statParams.dayDelta" :min="0" :max="180" mode="decimal" show-buttons buttonLayout="horizontal" :step="1" :allowEmtpy="false" @update:model-value="updateAll" />
          <label for="dayDeltaSelector">Day delta</label>
        </FloatLabel>
      </span>

      <span id="yearNumSelector">
        <FloatLabel variant="in">
          <InputNumber fluid inputId="yearNumSelector" v-model="statParams.yearNum" :min="1" mode="decimal" show-buttons buttonLayout="horizontal" :step="1" @update:model-value="updateAll" />
          <label for="yearNumSelector">Number of years</label>
        </FloatLabel>
      </span>

      <span id="modeSelector">
        <FloatLabel variant="in">
          <Select fluid inputId="modeSelector" v-model="yearMode" :options="yearModes" option-label="name" checkmark @update:model-value="updateAll" />
          <label for="yearModeSelector">Day calculation mode</label>
        </FloatLabel>
      </span>
    </div>

    <br/>

    <panel :header="selectedDateRangesSummary" toggleable collapsed>
      <ul>
        <li v-if="statParams.dayDelta == 0" v-for="range in statParams.selectedDateRanges" :key="range.start.toISOString()">
          {{ range.start.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
        </li>
        <li v-if="statParams.dayDelta > 0" v-for="range in statParams.selectedDateRanges" :key="range.start.toISOString()">
          {{ range.start.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
          &ndash;
          {{ range.end.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" } ) }}
        </li>
      </ul>
    </panel>

  </Panel>
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

    #yearModeSelector {
        flex-grow: 1;
        min-width: 16rem;
    }

</style>
