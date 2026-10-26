import { client } from "@/api/client";
import { getEndpoint } from "@/api/endpoints";
import {
  type ChangeDeadlineRoleRequest,
  ChangeDeadlineRoleRequestSchema,
} from "./schemas/roles/requests/ChangeDeadlineRoleRequest";
import {
  type ChangeThreadRoleRequest,
  ChangeThreadRoleRequestSchema,
} from "./schemas/roles/requests/ChangeThreadRoleRequest";
import { validateAndRequest } from "./utils";

export const changeThreadAssigneeRole = async (threadId: number, request: ChangeThreadRoleRequest) =>
  validateAndRequest(ChangeThreadRoleRequestSchema, request, () =>
    client.post(getEndpoint("ROLES_CHANGE_THREAD", { pathParams: { threadId } }), request),
  );

export const changeDeadlineAssigneeRole = async (deadlineId: number, request: ChangeDeadlineRoleRequest) =>
  validateAndRequest(ChangeDeadlineRoleRequestSchema, request, () =>
    client.post(getEndpoint("ROLES_CHANGE_DEADLINE", { pathParams: { deadlineId } }), request),
  );
