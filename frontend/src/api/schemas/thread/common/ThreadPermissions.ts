import z from "zod";

export const ThreadPermissionsSchema = z.object({
  update: z.boolean(),
  delete: z.boolean(),
  manageAssignees: z.boolean(),
  createDeadlines: z.boolean(),
});

export type ThreadPermissions = z.infer<typeof ThreadPermissionsSchema>;
