import z from "zod";

export const OrganizationStatsSchema = z.object({
  members: z.number(),
  threads: z.number(),
});

export type OrganizationStats = z.infer<typeof OrganizationStatsSchema>;
