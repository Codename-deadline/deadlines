import z from "zod";
import { IsoAsMsSchema } from "../../common/IsoUtcDate";
import { LanguageSchema } from "../../common/LanguageSchema";
import { TimeZoneSchema } from "../../common/TimeZoneSchema";

export const MinimalUserSchema = z.object({
  username: z.string(),
  fullName: z.string(),
});
export type MinimalUser = z.infer<typeof MinimalUserSchema>;

export const UserSchema = MinimalUserSchema.safeExtend({
  id: z.number(),
  joinedAt: IsoAsMsSchema,
  language: LanguageSchema,
  timeZone: TimeZoneSchema,
});
export type User = z.infer<typeof UserSchema>;
