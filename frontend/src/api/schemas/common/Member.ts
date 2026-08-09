import z from "zod";
import type { AnyRole } from "@/api/common/AnyRole";
import { UserSchema } from "../user/common/User";
import { IsoUtcDateSchema } from "./IsoUtcDate";

export const MemberSchema = z.object({
  user: UserSchema,
  assignedAt: IsoUtcDateSchema,
});

export type Member = z.infer<typeof MemberSchema>;
export type MemberWithRole = Member & { role: AnyRole };
