import type z from "zod";
import { MemberSchema } from "../common/Member";
import { ThreadRoleSchema } from "./common/ThreadRole";

export const ThreadMemberSchema = MemberSchema.safeExtend({
  role: ThreadRoleSchema,
});

export type ThreadMember = z.infer<typeof ThreadMemberSchema>;
