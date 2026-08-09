import z from "zod";
import { OrganizationRoleSchema } from "@/api/schemas/organization/common/OrganizationRole";

export const CreateOrganizationInvitationRequestSchema = z.object({
  username: z.string(),
  role: OrganizationRoleSchema,
});

export type CreateOrganizationInvitationRequest = z.infer<typeof CreateOrganizationInvitationRequestSchema>;
