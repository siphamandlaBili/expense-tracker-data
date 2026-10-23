// All date maths is in UTC so results don't shift with the viewer's
// timezone.

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfUtcMonth(date: Date, monthOffset = 0) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1),
  );
}

/** YYYY-MM-DD */
export function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** YYYY-MM */
export function toIsoMonth(date: Date) {
  return date.toISOString().slice(0, 7);
}

/** Parses YYYY-MM-DD as the start of that UTC day. */
export function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
