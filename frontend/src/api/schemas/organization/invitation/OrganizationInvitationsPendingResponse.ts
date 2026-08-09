import z from "zod";

export const OrganizationInvitationsPendingResponseSchema = z.object({
  pending: z.number().nonnegative(),
});
export type OrganizationInvitationsPendingResponse = z.infer<typeof OrganizationInvitationsPendingResponseSchema>;
