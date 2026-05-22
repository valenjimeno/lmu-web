export type SessionTypeFilter = 'all' | 'race' | 'qualify' | 'practice';

export function detectSessionTypeFromXml(xmlContent: string) {
  const normalizedXml = xmlContent.trim();

  if (/<Race\b/i.test(normalizedXml)) {
    return 'Race';
  }

  if (/<Qualify\b/i.test(normalizedXml)) {
    return 'Qualify';
  }

  if (/<Practice\d*\b/i.test(normalizedXml)) {
    return 'Practice';
  }

  return null;
}

export function normalizeSessionType(value: string | null | undefined) {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  if (normalized === 'race') {
    return 'race';
  }

  if (normalized === 'qualify' || normalized === 'qualifying') {
    return 'qualify';
  }

  if (normalized.startsWith('practice')) {
    return 'practice';
  }

  return null;
}

export function doesSessionTypeMatchFilter(
  sessionType: string | null | undefined,
  filter: SessionTypeFilter,
) {
  if (filter === 'all') {
    return true;
  }

  return normalizeSessionType(sessionType) === filter;
}

export function formatSessionTypeFilter(value: SessionTypeFilter) {
  if (value === 'all') {
    return 'Todas';
  }

  if (value === 'race') {
    return 'Carrera';
  }

  if (value === 'qualify') {
    return 'Clasificación';
  }

  return 'Práctica';
}

export function formatSessionType(value: string | null | undefined) {
  const normalized = normalizeSessionType(value);

  if (normalized === 'race') {
    return 'Carrera';
  }

  if (normalized === 'qualify') {
    return 'Qualy';
  }

  if (normalized === 'practice') {
    return 'Práctica';
  }

  return value?.trim() || 'No definida';
}
