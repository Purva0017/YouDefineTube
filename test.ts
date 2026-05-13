import { getLocalDateKey, getNextLocalMidnight } from "./lib/time-tracking"

const date = getNextLocalMidnight(Date.now())

console.log(date)