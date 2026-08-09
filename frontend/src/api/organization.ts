import z from "zod";
import { client } from "./client";
import type { PagedResponse } from "./common/PaginationResponse";
import { getEndpoint } from "./endpoints";
import { EmptySchema } from "./schemas/common/Empty";
import { type OrganizationWithStats, OrganizationWithStatsSchema } from "./schemas/organization/common/Organization";
import {
  type CreateOrganizationRequest,
  CreateOrganizationRequestSchema,
} from "./schemas/organization/create/CreateOrganizationRequest";
import { CreateOrganizationResponseSchema } from "./schemas/organization/create/CreateOrganizationResponse";
import {
  type CreateOrganizationInvitationRequest,
  CreateOrganizationInvitationRequestSchema,
} from "./schemas/organization/invitation/create/CreateOrganizationInvitationRequest";
import type { OrganizationMember } from "./schemas/organization/Member";
import {
  type ChangeOrganizationVisibilityRequest,
  ChangeOrganizationVisibilityRequestSchema,
} from "./schemas/organization/patch/ChangeOrganizationVisibilityRequest";
import {
  type PatchOrganizationRequest,
  PatchOrganizationRequestSchema,
} from "./schemas/organization/patch/PatchOrganizationRequest";
import { validateAndRequest, validateWith } from "./utils";

export const createOrganization = async (request: CreateOrganizationRequest) =>
  validateAndRequest(CreateOrganizationRequestSchema, request, (validated) =>
    client.post(getEndpoint("ORGANIZATION_CREATE"), validated, {
      validate: validateWith(CreateOrganizationResponseSchema),
    }),
  );

export const getOrganization = async (organizationId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<OrganizationWithStats>(getEndpoint("ORGANIZATION_GET", { pathParams: { orgId: organizationId } }), {
      validate: validateWith(OrganizationWithStatsSchema),
    }),
  );

export const deleteOrganization = async (organizationId: number) =>
  validateAndRequest(EmptySchema, {}, (validated) =>
    client.delete(getEndpoint("ORGANIZATION_DELETE", { pathParams: { orgId: organizationId } }), validated),
  );

export const patchOrganization = async (organizationId: number, data: PatchOrganizationRequest) =>
  validateAndRequest(PatchOrganizationRequestSchema, data, (validated) =>
    client.patch(getEndpoint("ORGANIZATION_PATCH", { pathParams: { orgId: organizationId } }), validated),
  );

export const changeOrganizationVisibility = async (organizationId: number, data: ChangeOrganizationVisibilityRequest) =>
  validateAndRequest(ChangeOrganizationVisibilityRequestSchema, data, (validated) =>
    client.patch(getEndpoint("ORGANIZATION_CHANGE_VISIBILITY", { pathParams: { orgId: organizationId } }), validated),
  );

export const getOrganizationMembers = async (organizationId: number, page: number, size: number) =>
  validateAndRequest(EmptySchema, {}, (validated) =>
    client.get<PagedResponse<OrganizationMember>>(
      getEndpoint("ORGANIZATION_MEMBERS", {
        pathParams: { orgId: organizationId },
        queryParams: { page, size },
      }),
      validated,
    ),
  );

export const inviteMemberToOrganization = async (organizationId: number, data: CreateOrganizationInvitationRequest) =>
  validateAndRequest(CreateOrganizationInvitationRequestSchema, data, (validated) =>
    client.post(getEndpoint("ORGANIZATION_INVITE_MEMBER", { pathParams: { orgId: organizationId } }), validated),
  );

export const removeOrganizationMember = async (organizationId: number, username: string) =>
  validateAndRequest(EmptySchema, {}, (validated) =>
    client.delete(
      getEndpoint("ORGANIZATION_REMOVE_MEMBER", {
        pathParams: { orgId: organizationId, username: username },
      }),
      validated,
    ),
  );

export const getOrganizationMembersWithUsernameStartingWith = async (organizationId: number, startsWith: string) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<string[]>(
      getEndpoint("ORGANIZATION_MEMBER_HINTS", {
        pathParams: { orgId: organizationId },
        queryParams: { startsWith },
      }),
      {
        validate: validateWith(z.array(z.string())),
      },
    ),
  );
