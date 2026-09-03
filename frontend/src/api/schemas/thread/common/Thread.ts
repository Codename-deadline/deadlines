import z from "zod";
import { paginationResponseSchema as pagedResponseSchema } from "@/api/common/PaginationResponse";
import { IsoAsMsSchema } from "@/api/schemas/common/IsoUtcDate";
import { ThreadPermissionsSchema } from "./ThreadPermissions";
import { ThreadOrOrganizationRoleSchema, ThreadRoleSchema } from "./ThreadRole";
import { ThreadStatsSchema } from "./ThreadStats";

export const ThreadSchema = z.compile(
  z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().optional(),
    organizationId: z.number(),
    createdAt: IsoAsMsSchema,
    stats: ThreadStatsSchema,
    permissions: ThreadPermissionsSchema,
  }),
);

export const PagedThreadSchema = pagedResponseSchema(ThreadSchema);
export type Thread = z.infer<typeof ThreadSchema>;
export type PagedThread = z.infer<typeof PagedThreadSchema>;

export const ThreadWithRoleSchema = ThreadSchema.extend({
  role: ThreadRoleSchema.nullable(),
  globalRole: ThreadOrOrganizationRoleSchema.nullable(),
});

export const PagedThreadWithRoleSchema = pagedResponseSchema(ThreadWithRoleSchema);
export type ThreadWithRole = z.infer<typeof ThreadWithRoleSchema>;
export type PagedThreadWithRole = z.infer<typeof PagedThreadWithRoleSchema>;
