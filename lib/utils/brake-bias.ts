export function buildBrakeBiasValues(min = 0, max = 100) {
  const values: number[] = [];

  for (let whole = min; whole < max; whole += 1) {
    values.push(whole, whole + 0.2, whole + 0.5, whole + 0.8);
  }

  values.push(max);

  return values
    .filter((value) => value >= min && value <= max)
    .map((value) => Number(value.toFixed(1)));
}
