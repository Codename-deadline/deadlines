import z from "zod";

export const ChangeOrganizationOwnerRequestSchema = z.object({
  newOwnerUsername: z.string().trim(),
});

export type ChangeOrganizationOwnerRequest = z.infer<typeof ChangeOrganizationOwnerRequestSchema>;
