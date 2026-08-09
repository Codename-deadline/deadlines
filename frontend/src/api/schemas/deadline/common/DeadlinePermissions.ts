import z from "zod";

export const DeadlinePermissionsSchema = z.object({
  update: z.boolean(),
  delete: z.boolean(),
  manageAssignees: z.boolean(),
  manageAttachments: z.boolean(),
});

export type DeadlinePermissions = z.infer<typeof DeadlinePermissionsSchema>;
