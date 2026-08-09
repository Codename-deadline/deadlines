import { client } from "./client";
import type { PagedResponse } from "./common/PaginationResponse";
import { getEndpoint } from "./endpoints";
import { EmptySchema } from "./schemas/common/Empty";
import {
  type PagedThreadWithRole,
  PagedThreadWithRoleSchema,
  type Thread,
  ThreadSchema,
} from "./schemas/thread/common/Thread";
import { type CreateThreadRequest, CreateThreadRequestSchema } from "./schemas/thread/create/CreateThreadRequest";
import { CreateThreadResponseSchema } from "./schemas/thread/create/CreateThreadResponse";
import { type ThreadInvitation, ThreadInvitationSchema } from "./schemas/thread/Invitation";
import type { ThreadMember } from "./schemas/thread/Member";
import { type PatchThreadRequest, PatchThreadRequestSchema } from "./schemas/thread/patch/PatchThreadRequest";
import { validateAndRequest, validateWith } from "./utils";

export const getOrganizationThreads = async (orgId: number, page: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<PagedThreadWithRole>(
      getEndpoint("ORGANIZATION_THREADS", {
        pathParams: { orgId: orgId },
        queryParams: { page },
      }),
      {
        validate: validateWith(PagedThreadWithRoleSchema),
      },
    ),
  );

export const getMyThreads = async (page: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<PagedThreadWithRole>(
      getEndpoint("THREAD_GET_MY", {
        queryParams: { page },
      }),
      {
        validate: validateWith(PagedThreadWithRoleSchema),
      },
    ),
  );

export const getThread = async (thrId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<Thread>(getEndpoint("THREAD_GET", { pathParams: { thrId } }), {
      validate: validateWith(ThreadSchema),
    }),
  );

export const createThread = async (orgId: number, request: CreateThreadRequest) =>
  validateAndRequest(CreateThreadRequestSchema, request, (validated) =>
    client.post(getEndpoint("THREAD_CREATE", { pathParams: { orgId } }), validated, {
      validate: validateWith(CreateThreadResponseSchema),
    }),
  );

export const deleteThread = async (thrId: number) =>
  validateAndRequest(EmptySchema, {}, () => client.delete(getEndpoint("THREAD_DELETE", { pathParams: { thrId } })));

export const patchThread = async (thrId: number, request: PatchThreadRequest) =>
  validateAndRequest(PatchThreadRequestSchema, request, (validated) =>
    client.patch(getEndpoint("THREAD_PATCH", { pathParams: { thrId } }), validated),
  );

export const getThreadAssignees = async (thrId: number, page: number, size: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<PagedResponse<ThreadMember>>(
      getEndpoint("THREAD_ASSIGNEES", {
        pathParams: { thrId },
        queryParams: { page, size },
      }),
    ),
  );

export const addThreadAssignee = async (thrId: number, data: ThreadInvitation) =>
  validateAndRequest(ThreadInvitationSchema, data, (validated) =>
    client.post(getEndpoint("THREAD_ADD_ASSIGNEE", { pathParams: { thrId } }), validated),
  );

export const removeThreadAssignee = async (thrId: number, username: string) =>
  validateAndRequest(EmptySchema, {}, (validated) =>
    client.delete(
      getEndpoint("THREAD_REMOVE_ASSIGNEE", {
        pathParams: { thrId, username: username },
      }),
      validated,
    ),
  );
