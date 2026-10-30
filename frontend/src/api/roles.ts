import { client } from "@/api/client";
import { getEndpoint } from "@/api/endpoints";
import {
  type ChangeDeadlineRoleRequest,
  ChangeDeadlineRoleRequestSchema,
} from "./schemas/roles/requests/ChangeDeadlineRoleRequest";
import { validateAndRequest } from "./utils";

export const changeDeadlineAssigneeRole = async (deadlineId: number, request: ChangeDeadlineRoleRequest) =>
  validateAndRequest(ChangeDeadlineRoleRequestSchema, request, () =>
    client.post(getEndpoint("ROLES_CHANGE_DEADLINE", { pathParams: { deadlineId } }), request),
  );
