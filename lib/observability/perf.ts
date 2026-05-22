type PerfTraceDetails = Record<string, unknown>;

function isPerfTracingEnabled() {
  return process.env.PERF_TRACE === '1' || process.env.NODE_ENV === 'development';
}

function sanitizePerfTraceDetails(details: PerfTraceDetails) {
  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
}

export function createPerfTrace(label: string, initialDetails: PerfTraceDetails = {}) {
  const enabled = isPerfTracingEnabled();
  const startedAt = Date.now();

  return {
    log(message: string, details: PerfTraceDetails = {}) {
      if (!enabled) {
        return;
      }

      console.info(`[perf] ${label}:${message}`, sanitizePerfTraceDetails(details));
    },
    finish(details: PerfTraceDetails = {}) {
      if (!enabled) {
        return;
      }

      console.info(
        `[perf] ${label}:done`,
        sanitizePerfTraceDetails({
          durationMs: Date.now() - startedAt,
          ...initialDetails,
          ...details,
        }),
      );
    },
  };
}
