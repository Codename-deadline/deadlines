import type z from "zod";
import { MemberSchema } from "../common/Member";
import { DeadlineRoleSchema } from "./common/DeadlineRole";

export const DeadlineMemberSchema = MemberSchema.safeExtend({
  role: DeadlineRoleSchema,
});

export type DeadlineMember = z.infer<typeof DeadlineMemberSchema>;
