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

export function formatSessionType(value: string | null | undefined) {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  if (normalized === 'race') {
    return 'Carrera';
  }

  if (normalized === 'qualify' || normalized === 'qualifying') {
    return 'Qualy';
  }

  if (normalized.startsWith('practice')) {
    return 'Práctica';
  }

  return value?.trim() || 'No definida';
}
