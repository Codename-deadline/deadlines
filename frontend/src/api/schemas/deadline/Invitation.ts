import z from "zod";
import { DeadlineRoleSchema } from "./common/DeadlineRole";

export const DeadlineInvitationSchema = z.object({
  username: z.string(),
  role: DeadlineRoleSchema,
});

export type DeadlineInvitation = z.infer<typeof DeadlineInvitationSchema>;
