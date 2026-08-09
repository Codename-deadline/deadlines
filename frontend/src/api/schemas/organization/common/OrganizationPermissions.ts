import z from "zod";

export const OrganizationPermissionsSchema = z.object({
  update: z.boolean(),
  delete: z.boolean(),
  manageRoles: z.boolean(),
  invite: z.boolean(),
  createThreads: z.boolean(),
});

export type OrganizationPermissions = z.infer<typeof OrganizationPermissionsSchema>;
