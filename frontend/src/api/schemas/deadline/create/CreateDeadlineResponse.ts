import z from "zod";
import { AnyRoleSchema } from "@/api/common/AnyRole";

export const CreateDeadlineResponseSchema = z.object({
  deadlineId: z.number(),
  assignees: z.number(),
  globalRole: AnyRoleSchema,
});

export type CreateDeadlineResponse = z.infer<typeof CreateDeadlineResponseSchema>;
