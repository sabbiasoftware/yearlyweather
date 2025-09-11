function dateToISO(date) {
    return date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0")
}

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

export { dateToISO, getWeekdayAndN, getWeekdayAndNToLast, getNthWeekday, getNthToLastWeekday };