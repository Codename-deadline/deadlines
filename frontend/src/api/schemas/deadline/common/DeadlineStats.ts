import z from "zod";

export const DeadlineStatsSchema = z.object({
  assignees: z.number().nonnegative(),
  attachments: z.number().nonnegative(),
});

export type DeadlineStats = z.infer<typeof DeadlineStatsSchema>;
