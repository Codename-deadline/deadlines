import z from "zod";
import { AnyRoleSchema } from "@/api/common/AnyRole";

export const CreateThreadResponseSchema = z.object({
  threadId: z.number(),
  assignees: z.number(),
  globalRole: AnyRoleSchema,
});

export type CreateThreadResponse = z.infer<typeof CreateThreadResponseSchema>;
