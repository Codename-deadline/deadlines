export const UTC_TIME_ZONE = "Etc/UTC";

export function normalizeTimeZone(timeZone: string): string {
  return timeZone === "UTC" ? UTC_TIME_ZONE : timeZone;
}

export function detectTimeZone(): string {
  return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || UTC_TIME_ZONE);
}

export function getSupportedTimeZones(): string[] {
  // fixes: error TS2339: Property 'supportedValuesOf' does not exist on type 'typeof Intl'.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf
  const intl = Intl as typeof Intl & { supportedValuesOf(key: "timeZone"): string[] };
  return intl.supportedValuesOf("timeZone").map(normalizeTimeZone);
}
