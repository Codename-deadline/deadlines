import z from "zod";

export const PatchOrganizationRequestSchema = z
  .strictObject({
    title: z.string(),
    description: z.string(),
  })
  .partial();

export type PatchOrganizationRequest = z.infer<typeof PatchOrganizationRequestSchema>;
