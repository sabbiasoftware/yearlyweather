import { reactive } from 'vue'

export const statParams = reactive({
  lat: 0.0,
  lon: 0.0,
  baseDate: new Date(),
  dayDelta: 3,
  yearNum: 10,
  yearMode: 0,
  selectedDateRanges: [],
  useMockData: false
})

