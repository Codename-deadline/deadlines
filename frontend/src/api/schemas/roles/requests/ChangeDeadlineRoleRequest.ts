import type z from "zod";
import { DeadlineRoleSchema } from "@/api/schemas/deadline/common/DeadlineRole";
import { createRoleChangeRequest } from "@/api/schemas/roles/common/createRoleChangeRequest";

export const ChangeDeadlineRoleRequestSchema = createRoleChangeRequest(DeadlineRoleSchema);

export type ChangeDeadlineRoleRequest = z.infer<typeof ChangeDeadlineRoleRequestSchema>;
