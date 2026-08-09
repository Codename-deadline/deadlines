import z from "zod";
import { AuthMethod } from "@/types/api";
import { LanguageSchema } from "../common/LanguageSchema";
import { TimeZoneSchema } from "../common/TimeZoneSchema";

export const SignUpRequestSchema = z.object({
  identifier: z.string().min(1).max(255),
  username: z.string().min(1).max(255),
  fullName: z.string().min(1).max(255),
  language: LanguageSchema,
  timeZone: TimeZoneSchema,
  channel: z.enum(Object.keys(AuthMethod)),
});

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
