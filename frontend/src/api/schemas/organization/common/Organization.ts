import z from "zod";
import { paginationResponseSchema as pagedResponseSchema } from "@/api/common/PaginationResponse";
import { IsoAsMsSchema } from "@/api/schemas/common/IsoUtcDate";
import { OrganizationStatsSchema } from "@/api/schemas/organization/common/OrganizationStats";
import { OrganizationTypeSchema } from "@/api/schemas/organization/common/OrganizationType";
import { OrganizationPermissionsSchema } from "./OrganizationPermissions";
import { OrganizationRoleSchema } from "./OrganizationRole";

export const OrganizationSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  type: OrganizationTypeSchema,
  createdAt: IsoAsMsSchema,
});
export const OrganizationWithStatsSchema = OrganizationSchema.safeExtend({
  stats: OrganizationStatsSchema,
  permissions: OrganizationPermissionsSchema,
});

export const PagedOrganizationWithStatsSchema = pagedResponseSchema(OrganizationWithStatsSchema);
export type OrganizationWithStats = z.infer<typeof OrganizationWithStatsSchema>;
export type PagedOrganizationWithStats = z.infer<typeof PagedOrganizationWithStatsSchema>;

export const OrganizationWithStatsAndRoleSchema = OrganizationWithStatsSchema.extend({
  role: OrganizationRoleSchema,
});

export const PagedOrganizationWithStatsAndRoleSchema = pagedResponseSchema(OrganizationWithStatsAndRoleSchema);
export type OrganizationWithStatsAndRole = z.infer<typeof OrganizationWithStatsAndRoleSchema>;
export type PagedOrganizationWithStatsAndRole = z.infer<typeof PagedOrganizationWithStatsAndRoleSchema>;
