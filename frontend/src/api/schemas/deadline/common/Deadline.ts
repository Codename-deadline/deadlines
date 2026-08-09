import z from "zod";
import { AnyRoleSchema } from "@/api/common/AnyRole";
import { paginationResponseSchema as pagedResponseSchema } from "@/api/common/PaginationResponse";
import { IsoAsMsSchema } from "@/api/schemas/common/IsoUtcDate";
import { DeadlinePermissionsSchema } from "./DeadlinePermissions";
import { DeadlineRoleSchema } from "./DeadlineRole";
import { DeadlineStatsSchema } from "./DeadlineStats";

export const DeadlineSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  threadId: z.number(),
  createdAt: IsoAsMsSchema,
  due: IsoAsMsSchema,
  isCompleted: z.boolean(),
  stats: DeadlineStatsSchema,
  permissions: DeadlinePermissionsSchema,
});

export const PagedDeadlineSchema = pagedResponseSchema(DeadlineSchema);
export type Deadline = z.infer<typeof DeadlineSchema>;
export type PagedDeadline = z.infer<typeof PagedDeadlineSchema>;

export const DeadlineWithRoleSchema = DeadlineSchema.extend({
  role: DeadlineRoleSchema.nullable(),
  globalRole: AnyRoleSchema.nullable(),
});

export const PagedDeadlineWithRoleSchema = pagedResponseSchema(DeadlineWithRoleSchema);
export type DeadlineWithRole = z.infer<typeof DeadlineWithRoleSchema>;
export type PagedDeadlineWithRole = z.infer<typeof PagedDeadlineWithRoleSchema>;
