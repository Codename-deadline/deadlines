import z from "zod";
import { ThreadInvitationSchema } from "../Invitation";

export const CreateThreadRequestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  invitations: z.array(ThreadInvitationSchema),
});

export type CreateThreadRequest = z.infer<typeof CreateThreadRequestSchema>;
