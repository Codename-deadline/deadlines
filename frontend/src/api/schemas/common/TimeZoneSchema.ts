import z from "zod";
import { normalizeTimeZone } from "@/utils/timeZone";

const isIanaTimeZone = (value: string) => {
  if (/^[+-]/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export const TimeZoneSchema = z
  .string()
  .min(1)
  .max(64)
  .transform(normalizeTimeZone)
  .refine(isIanaTimeZone, "Invalid IANA time zone");
