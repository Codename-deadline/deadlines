import z from "zod";
import { ThreadRoleSchema } from "./common/ThreadRole";

export const ThreadInvitationSchema = z.object({
  username: z.string(),
  role: ThreadRoleSchema,
});

export type ThreadInvitation = z.infer<typeof ThreadInvitationSchema>;
