import type z from "zod";
import { OrganizationRoleSchema } from "@/api/schemas/organization/common/OrganizationRole";
import { createRoleChangeRequest } from "@/api/schemas/roles/common/createRoleChangeRequest";

export const ChangeOrganizationRoleRequestSchema = createRoleChangeRequest(OrganizationRoleSchema);

export type ChangeOrganizationRoleRequest = z.infer<typeof ChangeOrganizationRoleRequestSchema>;
