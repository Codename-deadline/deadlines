import { client } from "./client";
import { getEndpoint } from "./endpoints";
import { EmptySchema } from "./schemas/common/Empty";
import {
  type DeadlineWithRole,
  DeadlineWithRoleSchema,
  type PagedDeadlineWithRole,
  PagedDeadlineWithRoleSchema,
} from "./schemas/deadline/common/Deadline";
import {
  type CreateDeadlineRequest,
  CreateDeadlineRequestSchema,
} from "./schemas/deadline/create/CreateDeadlineRequest";
import { CreateDeadlineResponseSchema } from "./schemas/deadline/create/CreateDeadlineResponse";
import { type DeadlineInvitation, DeadlineInvitationSchema } from "./schemas/deadline/Invitation";
import type { DeadlineMember } from "./schemas/deadline/Member";
import { type PatchDeadlineRequest, PatchDeadlineRequestSchema } from "./schemas/deadline/patch/PatchDeadlineRequest";
import { validateAndRequest, validateWith } from "./utils";

export const getThreadDeadlines = async (thrId: number, page: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<PagedDeadlineWithRole>(
      getEndpoint("THREAD_DEADLINES", {
        pathParams: { thrId },
        queryParams: { page },
      }),
      {
        validate: validateWith(PagedDeadlineWithRoleSchema),
      },
    ),
  );

export const getMyDeadlines = async (page: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<PagedDeadlineWithRole>(
      getEndpoint("DEADLINE_GET_MY", {
        queryParams: { page },
      }),
      {
        validate: validateWith(PagedDeadlineWithRoleSchema),
      },
    ),
  );

export const createDeadline = async (thrId: number, request: CreateDeadlineRequest) =>
  validateAndRequest(CreateDeadlineRequestSchema, request, (validated) =>
    client.post(getEndpoint("DEADLINE_CREATE", { pathParams: { thrId: thrId } }), validated, {
      validate: validateWith(CreateDeadlineResponseSchema),
    }),
  );

export const getDeadline = async (ddlId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<DeadlineWithRole>(
      getEndpoint("DEADLINE_GET", {
        pathParams: { ddlId },
      }),
      {
        validate: validateWith(DeadlineWithRoleSchema),
      },
    ),
  );

export const deleteDeadline = async (ddlId: number) =>
  validateAndRequest(EmptySchema, {}, () => client.delete(getEndpoint("DEADLINE_DELETE", { pathParams: { ddlId } })));

export const patchDeadline = async (ddlId: number, request: PatchDeadlineRequest) =>
  validateAndRequest(PatchDeadlineRequestSchema, request, (validated) =>
    client.patch(getEndpoint("DEADLINE_PATCH", { pathParams: { ddlId } }), validated),
  );

export const getAllDeadlineAssignees = async (ddlId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<DeadlineMember[]>(
      getEndpoint("DEADLINE_ASSIGNEES", {
        pathParams: { ddlId },
      }),
    ),
  );

export const addDeadlineAssignee = async (ddlId: number, data: DeadlineInvitation) =>
  validateAndRequest(DeadlineInvitationSchema, data, (validated) =>
    client.post(getEndpoint("DEADLINE_ADD_ASSIGNEE", { pathParams: { ddlId } }), validated),
  );

export const removeDeadlineAssignee = async (ddlId: number, username: string) =>
  validateAndRequest(EmptySchema, {}, (validated) =>
    client.delete(
      getEndpoint("DEADLINE_REMOVE_ASSIGNEE", {
        pathParams: { ddlId, username: username },
      }),
      validated,
    ),
  );
