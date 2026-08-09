import z from "zod";
import { IsoUtcDateSchema } from "../../common/IsoUtcDate";

export const PatchDeadlineRequestSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    due: IsoUtcDateSchema,
    isCompleted: z.boolean(),
  })
  .partial();

export type PatchDeadlineRequest = z.infer<typeof PatchDeadlineRequestSchema>;
