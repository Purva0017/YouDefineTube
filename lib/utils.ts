export const formatMinutes = (m: number) => {
  const hours = Math.floor(m / 60)
  const minutes = m % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export const formatDuration = (ms: number) => {
  return formatMinutes(Math.floor(ms / 60000))
}

export const formatTimeStr = (timeStr: string) => {
  if (!timeStr) return ""
  const [hStr, mStr] = timeStr.split(":")
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return timeStr
  const ampm = h >= 12 ? "PM" : "AM"
  const displayH = h % 12 === 0 ? 12 : h % 12
  const displayM = m < 10 ? `0${m}` : m
  return `${displayH}:${displayM} ${ampm}`
}

