import z from "zod";
import { LanguageSchema } from "@/api/schemas/common/LanguageSchema";
import { TimeZoneSchema } from "@/api/schemas/common/TimeZoneSchema";

export const PatchUserRequestSchema = z
  .object({
    username: z.string().trim(),
    fullName: z.string().trim(),
    language: LanguageSchema,
    timeZone: TimeZoneSchema,
  })
  .partial();

export type PatchUserRequest = z.infer<typeof PatchUserRequestSchema>;
