import type z from "zod";
import { createRoleChangeRequest } from "@/api/schemas/roles/common/createRoleChangeRequest";
import { ThreadRoleSchema } from "@/api/schemas/thread/common/ThreadRole";

export const ChangeThreadRoleRequestSchema = createRoleChangeRequest(ThreadRoleSchema);

export type ChangeThreadRoleRequest = z.infer<typeof ChangeThreadRoleRequestSchema>;
