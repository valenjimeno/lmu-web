type PerfTraceDetails = Record<string, unknown>;

function isPerfTracingEnabled() {
  return process.env.PERF_TRACE === '1' || process.env.NODE_ENV === 'development';
}

function sanitizePerfTraceDetails(details: PerfTraceDetails) {
  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
}

function writePerfTrace(label: string, details: PerfTraceDetails) {
  const serializedDetails = JSON.stringify(sanitizePerfTraceDetails(details));
  process.stderr.write(`${label} ${serializedDetails}\n`);
}

export function createPerfTrace(label: string, initialDetails: PerfTraceDetails = {}) {
  const enabled = isPerfTracingEnabled();
  const startedAt = Date.now();

  return {
    log(message: string, details: PerfTraceDetails = {}) {
      if (!enabled) {
        return;
      }

      writePerfTrace(`[perf] ${label}:${message}`, details);
    },
    finish(details: PerfTraceDetails = {}) {
      if (!enabled) {
        return;
      }

      writePerfTrace(`[perf] ${label}:done`, {
        durationMs: Date.now() - startedAt,
        ...initialDetails,
        ...details,
      });
    },
  };
}
