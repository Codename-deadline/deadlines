import z from "zod";
import { paginationResponseSchema as createPagedResponseSchema } from "@/api/common/PaginationResponse";
import { IsoAsMsSchema } from "../../common/IsoUtcDate";
import { MinimalUserSchema } from "../../user/common/User";
import { OrganizationSchema } from "../common/Organization";
import { OrganizationRoleSchema } from "../common/OrganizationRole";

export const OrganizationInvitationSchema = z.object({
  id: z.number(),
  invitedBy: MinimalUserSchema,
  invitedUser: MinimalUserSchema,
  organization: OrganizationSchema,
  status: z.literal(["ACCEPTED", "DECLINED", "PENDING"]),
  role: OrganizationRoleSchema,
  createdAt: IsoAsMsSchema,
  answeredAt: IsoAsMsSchema.nullable(),
});

export type OrganizationInvitation = z.infer<typeof OrganizationInvitationSchema>;

export const PagedOrganizationInvitationSchema = createPagedResponseSchema(OrganizationInvitationSchema);
export type PagedOrganizationInvitation = z.infer<typeof PagedOrganizationInvitationSchema>;
