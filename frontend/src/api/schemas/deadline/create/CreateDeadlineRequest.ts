import z from "zod";
import { IsoUtcDateSchema } from "../../common/IsoUtcDate";
import { DeadlineInvitationSchema } from "../Invitation";

export const CreateDeadlineRequestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  due: IsoUtcDateSchema,
  invitations: z.array(DeadlineInvitationSchema),
});

export type CreateDeadlineRequest = z.infer<typeof CreateDeadlineRequestSchema>;
