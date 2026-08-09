import type z from "zod";
import { MemberSchema } from "../common/Member";
import { OrganizationRoleSchema } from "./common/OrganizationRole";

export const OrganizationMemberSchema = MemberSchema.safeExtend({
  role: OrganizationRoleSchema,
});

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;
