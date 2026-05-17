export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatMetricValue(value: number | null) {
  return value === null ? 'No definido' : String(value);
}

export function formatBrakeBiasSplit(value: number | null) {
  if (value === null) {
    return 'No definido';
  }

  return `${value.toFixed(1)}:${(100 - value).toFixed(1)}`;
}

export function formatLapTime(value: number | null) {
  if (value === null) {
    return 'No definido';
  }

  const totalMilliseconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(totalMilliseconds / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${minutes}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
}
