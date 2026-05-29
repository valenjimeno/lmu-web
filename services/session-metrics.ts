export type SessionMetricsLapInput = {
  lapTimeSeconds: number | null;
  sector1Seconds: number | null;
  sector2Seconds: number | null;
  sector3Seconds: number | null;
  topSpeedKph: number | null;
  fuelUsed: number | null;
  tireWearFl: number | null;
  tireWearFr: number | null;
  tireWearRl: number | null;
  tireWearRr: number | null;
  frontCompound: string | null;
  rearCompound: string | null;
  pitFlag: boolean;
  isValidLap: boolean;
};

type DeriveSessionMetricsContext = {
  positionGain?: number | null;
  finishPos?: number | null;
};

export type DerivedSessionMetrics = {
  averageLapMs: number | null;
  optimalLapMs: number | null;
  lapConsistencyMs: number | null;
  bestThreeLapAverageMs: number | null;
  lastThreeLapAverageMs: number | null;
  paceFadeMs: number | null;
  validLapCount: number;
  validLapRate: number | null;
  averageFuelUsedPerLap: number | null;
  fuelMinPerLap: number | null;
  fuelMaxPerLap: number | null;
  projectedFuel20Minutes: number | null;
  projectedFuel30Minutes: number | null;
  projectedFuel45Minutes: number | null;
  peakTopSpeedKph: number | null;
  tireDropFront: number | null;
  tireDropRear: number | null;
  tireDropFrontPerLap: number | null;
  tireDropRearPerLap: number | null;
  frontRearWearRatio: number | null;
  leftRightWearRatio: number | null;
  compounds: {
    front: string | null;
    rear: string | null;
  };
  insights: string[];
};

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStdDeviation(values: number[]) {
  if (values.length < 2) {
    return null;
  }

  const mean = average(values);

  if (mean === null) {
    return null;
  }

  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateRollingAverage(values: number[], windowSize: number, mode: 'best' | 'last') {
  if (values.length < windowSize) {
    return null;
  }

  const windowAverages: number[] = [];

  for (let index = 0; index <= values.length - windowSize; index += 1) {
    const window = values.slice(index, index + windowSize);
    const windowAverage = average(window);

    if (windowAverage !== null) {
      windowAverages.push(windowAverage);
    }
  }

  if (windowAverages.length === 0) {
    return null;
  }

  return mode === 'best' ? Math.min(...windowAverages) : windowAverages[windowAverages.length - 1];
}

function calculateOpeningStintAverage(values: number[], windowSize: number) {
  if (values.length < windowSize) {
    return null;
  }

  // Ignore the first valid lap when there is enough sample, since it is often
  // skewed by start traffic, tire warmup, or stint settling.
  const openingWindow =
    values.length >= windowSize + 1 ? values.slice(1, windowSize + 1) : values.slice(0, windowSize);

  return average(openingWindow);
}

function calculateValidLapRate(laps: SessionMetricsLapInput[]) {
  const timedLaps = laps.filter((lap) => !lap.pitFlag && lap.lapTimeSeconds !== null);

  if (timedLaps.length === 0) {
    return null;
  }

  const validTimedLaps = timedLaps.filter((lap) => lap.isValidLap);
  return validTimedLaps.length / timedLaps.length;
}

function calculateFuelProjection(
  averageFuelUsedPerLap: number | null,
  averageLapMs: number | null,
  minutes: number,
) {
  if (averageFuelUsedPerLap === null || averageLapMs === null || averageLapMs <= 0) {
    return null;
  }

  const projectedLapCount = (minutes * 60_000) / averageLapMs;
  return averageFuelUsedPerLap * projectedLapCount;
}

function calculateTireDrop(laps: SessionMetricsLapInput[]) {
  const validStintLaps = laps.filter((lap) => lap.isValidLap && !lap.pitFlag);

  if (validStintLaps.length < 2) {
    return { front: null, rear: null };
  }

  const firstLap = validStintLaps[0];
  const lastLap = validStintLaps[validStintLaps.length - 1];
  const firstFront =
    firstLap.tireWearFl !== null && firstLap.tireWearFr !== null
      ? (firstLap.tireWearFl + firstLap.tireWearFr) / 2
      : null;
  const lastFront =
    lastLap.tireWearFl !== null && lastLap.tireWearFr !== null
      ? (lastLap.tireWearFl + lastLap.tireWearFr) / 2
      : null;
  const firstRear =
    firstLap.tireWearRl !== null && firstLap.tireWearRr !== null
      ? (firstLap.tireWearRl + firstLap.tireWearRr) / 2
      : null;
  const lastRear =
    lastLap.tireWearRl !== null && lastLap.tireWearRr !== null
      ? (lastLap.tireWearRl + lastLap.tireWearRr) / 2
      : null;

  return {
    front: firstFront !== null && lastFront !== null ? firstFront - lastFront : null,
    rear: firstRear !== null && lastRear !== null ? firstRear - lastRear : null,
  };
}

function calculateWearProfile(laps: SessionMetricsLapInput[]) {
  const validStintLaps = laps.filter((lap) => lap.isValidLap && !lap.pitFlag);

  if (validStintLaps.length < 2) {
    return {
      frontDropPerLap: null,
      rearDropPerLap: null,
      frontRearWearRatio: null,
      leftRightWearRatio: null,
    };
  }

  const firstLap = validStintLaps[0];
  const lastLap = validStintLaps[validStintLaps.length - 1];
  const lapCount = validStintLaps.length - 1;
  const frontLeftDrop =
    firstLap.tireWearFl !== null && lastLap.tireWearFl !== null
      ? firstLap.tireWearFl - lastLap.tireWearFl
      : null;
  const frontRightDrop =
    firstLap.tireWearFr !== null && lastLap.tireWearFr !== null
      ? firstLap.tireWearFr - lastLap.tireWearFr
      : null;
  const rearLeftDrop =
    firstLap.tireWearRl !== null && lastLap.tireWearRl !== null
      ? firstLap.tireWearRl - lastLap.tireWearRl
      : null;
  const rearRightDrop =
    firstLap.tireWearRr !== null && lastLap.tireWearRr !== null
      ? firstLap.tireWearRr - lastLap.tireWearRr
      : null;
  const leftDrop =
    frontLeftDrop !== null && rearLeftDrop !== null ? (frontLeftDrop + rearLeftDrop) / 2 : null;
  const rightDrop =
    frontRightDrop !== null && rearRightDrop !== null ? (frontRightDrop + rearRightDrop) / 2 : null;
  const tireDrop = calculateTireDrop(validStintLaps);

  return {
    frontDropPerLap: tireDrop.front !== null && lapCount > 0 ? tireDrop.front / lapCount : null,
    rearDropPerLap: tireDrop.rear !== null && lapCount > 0 ? tireDrop.rear / lapCount : null,
    frontRearWearRatio:
      tireDrop.front !== null && tireDrop.rear !== null && tireDrop.rear > 0
        ? tireDrop.front / tireDrop.rear
        : null,
    leftRightWearRatio:
      rightDrop !== null && leftDrop !== null && leftDrop > 0 ? rightDrop / leftDrop : null,
  };
}

function calculateOptimalLapMs(laps: SessionMetricsLapInput[]) {
  const sector1Values = laps
    .map((lap) => lap.sector1Seconds)
    .filter((value): value is number => value !== null && value > 0);
  const sector2Values = laps
    .map((lap) => lap.sector2Seconds)
    .filter((value): value is number => value !== null && value > 0);
  const sector3Values = laps
    .map((lap) => lap.sector3Seconds)
    .filter((value): value is number => value !== null && value > 0);

  if (sector1Values.length === 0 || sector2Values.length === 0 || sector3Values.length === 0) {
    return null;
  }

  return Math.round(
    (Math.min(...sector1Values) + Math.min(...sector2Values) + Math.min(...sector3Values)) * 1000,
  );
}

function buildSessionInsights({
  positionGain,
  finishPos,
  validLapRate,
  paceFadeMs,
  frontRearWearRatio,
  leftRightWearRatio,
  fuelMinPerLap,
  fuelMaxPerLap,
}: {
  positionGain: number | null;
  finishPos: number | null;
  validLapRate: number | null;
  paceFadeMs: number | null;
  frontRearWearRatio: number | null;
  leftRightWearRatio: number | null;
  fuelMinPerLap: number | null;
  fuelMaxPerLap: number | null;
}) {
  const insights: string[] = [];

  if (positionGain !== null && positionGain > 0) {
    insights.push(
      `Buena ejecución de carrera: ganó ${positionGain} posiciones${finishPos ? ` y acabó P${finishPos}` : ''}.`,
    );
  }

  if (validLapRate !== null) {
    if (validLapRate >= 0.9) {
      insights.push('Stint limpio: casi todas las vueltas cronometradas fueron válidas.');
    } else if (validLapRate < 0.75) {
      insights.push('Hubo bastantes vueltas no válidas o de transición; hay margen de limpieza.');
    }
  }

  if (paceFadeMs !== null) {
    if (paceFadeMs > 1500) {
      insights.push(
        'El ritmo cae al final del stint; el coche sufre más con desgaste o combustible.',
      );
    } else if (paceFadeMs < -500) {
      insights.push(
        'El stint va a mejor con el paso de las vueltas; el coche crece cuando baja peso.',
      );
    } else {
      insights.push('Ritmo bastante estable entre el inicio y el final del stint.');
    }
  }

  if (frontRearWearRatio !== null) {
    if (frontRearWearRatio > 1.12) {
      insights.push('La degradación se concentra en el eje delantero.');
    } else if (frontRearWearRatio < 0.9) {
      insights.push('La degradación se concentra más en el eje trasero.');
    }
  }

  if (leftRightWearRatio !== null) {
    if (leftRightWearRatio > 1.08) {
      insights.push('El lado derecho trabaja más que el izquierdo en este stint.');
    } else if (leftRightWearRatio < 0.92) {
      insights.push('El lado izquierdo está soportando más carga que el derecho.');
    }
  }

  if (
    fuelMinPerLap !== null &&
    fuelMaxPerLap !== null &&
    fuelMaxPerLap > 0 &&
    fuelMaxPerLap - fuelMinPerLap <= 0.004
  ) {
    insights.push('El consumo es muy estable vuelta a vuelta.');
  }

  return insights.slice(0, 5);
}

export function deriveSessionMetrics(
  laps: SessionMetricsLapInput[],
  context: DeriveSessionMetricsContext = {},
): DerivedSessionMetrics {
  const validLaps = laps.filter(
    (lap) => lap.isValidLap && !lap.pitFlag && lap.lapTimeSeconds !== null,
  );
  const lapTimesMs = validLaps.map((lap) => Math.round((lap.lapTimeSeconds ?? 0) * 1000));
  const fuelValues = validLaps
    .map((lap) => lap.fuelUsed)
    .filter((value): value is number => value !== null && value > 0);
  const topSpeeds = laps
    .map((lap) => lap.topSpeedKph)
    .filter((value): value is number => value !== null);
  const compounds = validLaps[0]
    ? {
        front: validLaps[0].frontCompound,
        rear: validLaps[0].rearCompound,
      }
    : {
        front: null,
        rear: null,
      };
  const tireDrop = calculateTireDrop(laps);
  const wearProfile = calculateWearProfile(laps);
  const averageLapMs = average(lapTimesMs);
  const optimalLapMs = calculateOptimalLapMs(laps);
  const bestThreeLapAverageMs = calculateRollingAverage(lapTimesMs, 3, 'best');
  const lastThreeLapAverageMs = calculateRollingAverage(lapTimesMs, 3, 'last');
  const firstThreeLapAverageMs = calculateOpeningStintAverage(lapTimesMs, 3);
  const paceFadeMs =
    firstThreeLapAverageMs !== null && lastThreeLapAverageMs !== null
      ? lastThreeLapAverageMs - firstThreeLapAverageMs
      : null;
  const averageFuelUsedPerLap = average(fuelValues);
  const fuelMinPerLap = fuelValues.length > 0 ? Math.min(...fuelValues) : null;
  const fuelMaxPerLap = fuelValues.length > 0 ? Math.max(...fuelValues) : null;
  const validLapRate = calculateValidLapRate(laps);
  const insights = buildSessionInsights({
    positionGain: context.positionGain ?? null,
    finishPos: context.finishPos ?? null,
    validLapRate,
    paceFadeMs,
    frontRearWearRatio: wearProfile.frontRearWearRatio,
    leftRightWearRatio: wearProfile.leftRightWearRatio,
    fuelMinPerLap,
    fuelMaxPerLap,
  });

  return {
    averageLapMs: averageLapMs !== null ? Math.round(averageLapMs) : null,
    optimalLapMs,
    lapConsistencyMs:
      calculateStdDeviation(lapTimesMs) !== null
        ? roundTo(calculateStdDeviation(lapTimesMs) ?? 0, 2)
        : null,
    bestThreeLapAverageMs:
      bestThreeLapAverageMs !== null ? Math.round(bestThreeLapAverageMs) : null,
    lastThreeLapAverageMs:
      lastThreeLapAverageMs !== null ? Math.round(lastThreeLapAverageMs) : null,
    paceFadeMs: paceFadeMs !== null ? Math.round(paceFadeMs) : null,
    validLapCount: validLaps.length,
    validLapRate: validLapRate !== null ? roundTo(validLapRate, 4) : null,
    averageFuelUsedPerLap:
      averageFuelUsedPerLap !== null ? roundTo(averageFuelUsedPerLap, 4) : null,
    fuelMinPerLap: fuelMinPerLap !== null ? roundTo(fuelMinPerLap, 4) : null,
    fuelMaxPerLap: fuelMaxPerLap !== null ? roundTo(fuelMaxPerLap, 4) : null,
    projectedFuel20Minutes: roundOrNull(
      calculateFuelProjection(averageFuelUsedPerLap, averageLapMs, 20),
      4,
    ),
    projectedFuel30Minutes: roundOrNull(
      calculateFuelProjection(averageFuelUsedPerLap, averageLapMs, 30),
      4,
    ),
    projectedFuel45Minutes: roundOrNull(
      calculateFuelProjection(averageFuelUsedPerLap, averageLapMs, 45),
      4,
    ),
    peakTopSpeedKph: topSpeeds.length > 0 ? roundTo(Math.max(...topSpeeds), 2) : null,
    tireDropFront: tireDrop.front !== null ? roundTo(tireDrop.front, 4) : null,
    tireDropRear: tireDrop.rear !== null ? roundTo(tireDrop.rear, 4) : null,
    tireDropFrontPerLap:
      wearProfile.frontDropPerLap !== null ? roundTo(wearProfile.frontDropPerLap, 4) : null,
    tireDropRearPerLap:
      wearProfile.rearDropPerLap !== null ? roundTo(wearProfile.rearDropPerLap, 4) : null,
    frontRearWearRatio:
      wearProfile.frontRearWearRatio !== null ? roundTo(wearProfile.frontRearWearRatio, 4) : null,
    leftRightWearRatio:
      wearProfile.leftRightWearRatio !== null ? roundTo(wearProfile.leftRightWearRatio, 4) : null,
    compounds,
    insights,
  };
}

function roundOrNull(value: number | null, decimals: number) {
  return value !== null ? roundTo(value, decimals) : null;
}
