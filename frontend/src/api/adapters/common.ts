import { isoToMs } from "@/utils/date";

/** Accept existing application timestamps as well as wire-format instants. */
export function toTimestamp(value: string | number): number {
  const timestamp = typeof value === "number" ? value : isoToMs(value);
  if (!Number.isFinite(timestamp)) throw new TypeError("Invalid timestamp");
  return timestamp;
}

export function mapPage<T, U>(page: { data: T[]; totalPages: number }, map: (item: T) => U) {
  return { ...page, data: page.data.map(map) };
}
