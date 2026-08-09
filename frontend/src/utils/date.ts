import { Temporal } from "temporal-polyfill";
import type { ShortLongTimeFormat } from "@/types/time";

export function msToIso(ms: number): string {
  return Temporal.Instant.fromEpochMilliseconds(ms).toString();
}

export function isoToMs(iso: string): number {
  return Temporal.Instant.from(iso).epochMilliseconds;
}

export function instantToWallTime(ms: number, timeZone: string): Temporal.PlainDateTime {
  return Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(timeZone).toPlainDateTime();
}

export function wallTimeToInstant(
  wallTime: Temporal.PlainDateTime | string,
  timeZone: string,
  disambiguation: "earlier" | "later" | "reject" = "reject",
): number {
  return Temporal.PlainDateTime.from(wallTime).toZonedDateTime(timeZone, { disambiguation }).toInstant()
    .epochMilliseconds;
}

export type WallTimeCandidate = {
  instant: number;
  offset: string;
};

export function resolveWallTime(wallTime: Temporal.PlainDateTime | string, timeZone: string): WallTimeCandidate[] {
  const plainDateTime = Temporal.PlainDateTime.from(wallTime);
  const earlier = plainDateTime.toZonedDateTime(timeZone, { disambiguation: "earlier" });
  const later = plainDateTime.toZonedDateTime(timeZone, { disambiguation: "later" });

  const candidates = [earlier, later].filter((candidate) => candidate.toPlainDateTime().equals(plainDateTime));
  if (candidates.length === 2 && candidates[0]?.epochMilliseconds === candidates[1]?.epochMilliseconds) {
    candidates.pop();
  }
  return candidates.map((candidate) => ({ instant: candidate.epochMilliseconds, offset: candidate.offset }));
}

export function formatInstant(ms: number, locale: string, timeZone: string): ShortLongTimeFormat {
  const dateTime = Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(timeZone);
  const short = dateTime.toLocaleString(locale, { dateStyle: "short" });
  const long = dateTime.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
  return { short, long };
}

export const msToReadable = formatInstant;

export function getRelativeTimeString(ms: number, locale: string): string {
  const now = Date.now();
  const diffMs = now - ms;

  if (diffMs < 0) return "";

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });

  if (diffSeconds < 60) return rtf.format(-diffSeconds, "second");
  if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  if (diffDays < 7) return rtf.format(-diffDays, "day");

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return rtf.format(-diffWeeks, "week");

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return rtf.format(-diffMonths, "month");

  const diffYears = Math.floor(diffDays / 365);
  return rtf.format(-diffYears, "year");
}
