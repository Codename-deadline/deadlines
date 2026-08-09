import { client } from "./client";
import { getEndpoint } from "./endpoints";
import { EmptySchema } from "./schemas/common/Empty";
import { PagedOrganizationInvitationSchema } from "./schemas/organization/invitation/Invitation";
import { OrganizationInvitationsPendingResponseSchema } from "./schemas/organization/invitation/OrganizationInvitationsPendingResponse";
import { validateAndRequest, validateWith } from "./utils";

export const getPendingInvitations = async (page: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get(getEndpoint("INVITATION_USER_PENDING_RECEIVED", { queryParams: { page } }), {
      validate: validateWith(PagedOrganizationInvitationSchema),
    }),
  );

export const getNumberOfPendingInvitations = async () =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get(getEndpoint("INVITATION_USER_PENDING_RECEIVED_NUMBER"), {
      validate: validateWith(OrganizationInvitationsPendingResponseSchema),
    }),
  );

export const acceptInvitation = async (invitationId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.post(getEndpoint("INVITATION_ACCEPT", { pathParams: { invitationId } })),
  );

export const declineInvitation = async (invitationId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.post(getEndpoint("INVITATION_DECLINE", { pathParams: { invitationId } })),
  );

export const getSentInvitations = async (page: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get(getEndpoint("INVITATION_USER_PENDING_SENT", { queryParams: { page } }), {
      validate: validateWith(PagedOrganizationInvitationSchema),
    }),
  );

export const revokeInvitation = async (invitationId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.post(getEndpoint("INVITATION_REVOKE", { pathParams: { invitationId } })),
  );
