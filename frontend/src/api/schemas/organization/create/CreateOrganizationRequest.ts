import z from "zod";
import { OrganizationTypeSchema } from "@/api/schemas/organization/common/OrganizationType";
import { CreateOrganizationInvitationRequestSchema } from "../invitation/create/CreateOrganizationInvitationRequest";

export const CreateOrganizationRequestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  type: OrganizationTypeSchema,
  invitations: z.array(CreateOrganizationInvitationRequestSchema),
});

export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;
