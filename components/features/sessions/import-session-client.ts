'use client';

export type MatchState = 'idle' | 'matched' | 'needs-selection' | 'invalid';

type DriverSummary = {
  name: string;
  hasValidLap: boolean;
};

export function normalizeDriverName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

export function extractDrivers(xmlContent: string) {
  const drivers: DriverSummary[] = [];
  const driverPattern = /<Driver>([\s\S]*?)<\/Driver>/g;

  for (const match of xmlContent.matchAll(driverPattern)) {
    const driverBlock = match[1] ?? '';
    const nameMatch = driverBlock.match(/<Name>([\s\S]*?)<\/Name>/i);
    const driverName = nameMatch?.[1]?.trim();
    const hasValidLap = /<Lap\b[^>]*>(?!\s*--\.----\s*<\/Lap>)[\s\S]*?<\/Lap>/i.test(driverBlock);

    if (driverName) {
      drivers.push({
        name: driverName,
        hasValidLap,
      });
    }
  }

  return drivers;
}

export function extractDriverNames(xmlContent: string) {
  return extractDrivers(xmlContent).map((driver) => driver.name);
}

export function extractDriverNamesWithValidLaps(xmlContent: string) {
  return extractDrivers(xmlContent)
    .filter((driver) => driver.hasValidLap)
    .map((driver) => driver.name);
}

export function findPreferredDriverName(
  availableDriverNames: string[],
  preferredDriverNames: string[],
) {
  for (const preferredName of preferredDriverNames) {
    const normalizedPreferredName = normalizeDriverName(preferredName);
    const matchedDriverName = availableDriverNames.find(
      (driverName) => normalizeDriverName(driverName) === normalizedPreferredName,
    );

    if (matchedDriverName) {
      return matchedDriverName;
    }
  }

  for (const preferredName of preferredDriverNames) {
    const normalizedPreferredName = normalizeDriverName(preferredName);
    const preferredTokens = normalizedPreferredName.split(' ').filter(Boolean);

    if (preferredTokens.length < 2) {
      continue;
    }

    const matchedDriverName = availableDriverNames.find((driverName) => {
      const normalizedDriverName = normalizeDriverName(driverName);

      return preferredTokens.every((token) => normalizedDriverName.includes(token));
    });

    if (matchedDriverName) {
      return matchedDriverName;
    }
  }

  return '';
}

export async function computeXmlHash(xmlContent: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(xmlContent);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function extractSessionDateTime(xmlContent: string) {
  const timeStringMatch = xmlContent.match(/<TimeString>([\s\S]*?)<\/TimeString>/i);
  const timeString = timeStringMatch?.[1]?.trim();

  if (!timeString) {
    return null;
  }

  const match = timeString.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const timestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}
