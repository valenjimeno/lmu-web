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
