import z from "zod";

export const CreateOrganizationResponseSchema = z.object({
  organizationId: z.number(),
});

export type CreateOrganizationResponse = z.infer<typeof CreateOrganizationResponseSchema>;
