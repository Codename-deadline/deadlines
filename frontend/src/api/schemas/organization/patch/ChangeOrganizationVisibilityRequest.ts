import z from "zod";
import { OrganizationTypeSchema } from "@/api/schemas/organization/common/OrganizationType";

export const ChangeOrganizationVisibilityRequestSchema = z.strictObject({
  type: OrganizationTypeSchema,
});

export type ChangeOrganizationVisibilityRequest = z.infer<typeof ChangeOrganizationVisibilityRequestSchema>;
