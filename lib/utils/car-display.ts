export function getCarDisplayName(carName: string, manufacturerName?: string | null) {
  const trimmedCarName = carName.trim();
  const trimmedManufacturerName = manufacturerName?.trim() ?? '';

  if (!trimmedManufacturerName) {
    return trimmedCarName;
  }

  const normalizedCarName = trimmedCarName.toLocaleLowerCase();
  const normalizedManufacturerName = trimmedManufacturerName.toLocaleLowerCase();

  if (normalizedCarName.includes(normalizedManufacturerName)) {
    return trimmedCarName;
  }

  return `${trimmedManufacturerName} ${trimmedCarName}`;
}
