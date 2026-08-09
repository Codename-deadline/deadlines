import z from "zod";

export const DeadlineAttachmentPermissionsSchema = z.object({
  update: z.boolean(),
  delete: z.boolean(),
});
export type DeadlineAttachmentPermissions = z.infer<typeof DeadlineAttachmentPermissionsSchema>;
