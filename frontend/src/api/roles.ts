import { client } from "@/api/client";
import { getEndpoint } from "@/api/endpoints";
import { EmptySchema } from "@/api/schemas/common/Empty";
import { type RolesMetadata, RolesMetadataSchema } from "./schemas/roles/metadata";
import {
  type ChangeDeadlineRoleRequest,
  ChangeDeadlineRoleRequestSchema,
} from "./schemas/roles/requests/ChangeDeadlineRoleRequest";
import {
  type ChangeOrganizationOwnerRequest,
  ChangeOrganizationOwnerRequestSchema,
} from "./schemas/roles/requests/ChangeOrganizationOwnerRequest";
import {
  type ChangeOrganizationRoleRequest,
  ChangeOrganizationRoleRequestSchema,
} from "./schemas/roles/requests/ChangeOrganizationRoleRequest";
import {
  type ChangeThreadRoleRequest,
  ChangeThreadRoleRequestSchema,
} from "./schemas/roles/requests/ChangeThreadRoleRequest";
import { validateAndRequest, validateWith } from "./utils";

export const getRolesMetadata = async () =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<RolesMetadata>(getEndpoint("ROLES_METADATA"), {
      validate: validateWith(RolesMetadataSchema),
    }),
  );

export const changeOrganizationMemberRole = async (organizationId: number, request: ChangeOrganizationRoleRequest) =>
  validateAndRequest(ChangeOrganizationRoleRequestSchema, request, () =>
    client.post(getEndpoint("ROLES_CHANGE_ORGANIZATION", { pathParams: { orgId: organizationId } }), request),
  );

export const changeOrganizationOwner = async (organizationId: number, request: ChangeOrganizationOwnerRequest) =>
  validateAndRequest(ChangeOrganizationOwnerRequestSchema, request, (validated) =>
    client.post(getEndpoint("ROLES_CHANGE_ORGANIZATION_OWNER", { pathParams: { orgId: organizationId } }), validated),
  );

export const changeThreadAssigneeRole = async (threadId: number, request: ChangeThreadRoleRequest) =>
  validateAndRequest(ChangeThreadRoleRequestSchema, request, () =>
    client.post(getEndpoint("ROLES_CHANGE_THREAD", { pathParams: { threadId } }), request),
  );

export const changeDeadlineAssigneeRole = async (deadlineId: number, request: ChangeDeadlineRoleRequest) =>
  validateAndRequest(ChangeDeadlineRoleRequestSchema, request, () =>
    client.post(getEndpoint("ROLES_CHANGE_DEADLINE", { pathParams: { deadlineId } }), request),
  );
