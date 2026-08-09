import z from "zod";

export const ThreadStatsSchema = z.object({
  assignees: z.number().nonnegative(),
  deadlines: z.number().nonnegative(),
  completedDeadlines: z.number().nonnegative(),
});

export type ThreadStats = z.infer<typeof ThreadStatsSchema>;
