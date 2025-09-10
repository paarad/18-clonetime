const formatHours = (hours: number) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}min`
  }
  // Always show hours, never days - even Facebook takes hours to build
  return `${hours.toFixed(1)}h`
}
