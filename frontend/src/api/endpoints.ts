const endpointPrefix: string = "/api";
const endpoints = {
  AUTH_SIGN_UP: {
    path: "/auth/register-otp",
  },
  AUTH_SIGN_IN: {
    path: "/auth/otp",
  },
  AUTH_VERIFY_OTP: {
    path: "/auth/otp/verify",
  },
  AUTH_VERIFY_PASSWORD: {
    path: "/auth/verify-password",
  },
  AUTH_CHANGE_PASSWORD: {
    path: "/auth/change-password",
  },
  AUTH_REFRESH_TOKEN: {
    path: "/auth/refresh-token",
  },
  USER_ME: {
    path: "/user",
  },
  USER_PATCH: {
    path: "/user",
  },
  USER_LINKED_ACCOUNTS: {
    path: "/user/linked-accounts",
  },
  USER_MY_ORGANIZATIONS: {
    path: "/organizations",
    queryParams: {} as { page: number },
  },
  USER_USERNAME_HINTS: {
    path: "/user/hints",
    queryParams: {} as { startsWith: string },
  },
  USER_SIGN_OUT: {
    path: "/auth/sign-out",
  },
  USER_DELETE: {
    path: "/user",
  },
  INTEGRATION_ACCOUNT_LINK: {
    path: "/integration/accounts",
  },
  INTEGRATION_ACCOUNT_UNLINK: {
    path: "/integration/accounts",
  },
  ORGANIZATION_GET: {
    path: "/organizations/{orgId}",
    pathParams: {} as { orgId: number },
  },
  ORGANIZATION_CREATE: {
    path: "/organizations",
    pathParams: {} as { orgId: number },
  },
  ORGANIZATION_DELETE: {
    path: "/organizations/{orgId}",
    pathParams: {} as { orgId: number },
  },
  ORGANIZATION_PATCH: {
    path: "/organizations/{orgId}",
    pathParams: {} as { orgId: number },
  },
  ORGANIZATION_CHANGE_VISIBILITY: {
    path: "/organizations/{orgId}/change-visibility",
    pathParams: {} as { orgId: number },
  },
  ORGANIZATION_MEMBERS: {
    path: "/organizations/{orgId}/members",
    pathParams: {} as { orgId: number },
    queryParams: {} as { page: number; size: number },
  },
  ORGANIZATION_INVITE_MEMBER: {
    path: "/organizations/{orgId}/invitations",
    pathParams: {} as { orgId: number },
  },
  ORGANIZATION_REMOVE_MEMBER: {
    path: "/organizations/{orgId}/members/{username}",
    pathParams: {} as { orgId: number; username: string },
  },
  ORGANIZATION_MEMBER_HINTS: {
    path: "/organizations/{orgId}/members/hints",
    pathParams: {} as { orgId: number },
    queryParams: {} as { startsWith: string },
  },
  ORGANIZATION_THREADS: {
    path: "/organizations/{orgId}/threads",
    pathParams: {} as { orgId: number },
    queryParams: {} as { page: number },
  },
  THREAD_CREATE: {
    path: "/organizations/{orgId}/threads",
    pathParams: {} as { orgId: number },
  },
  THREAD_GET_MY: {
    path: "/threads/me",
    queryParams: {} as { page: number },
  },
  THREAD_GET: {
    path: "/threads/{thrId}",
    pathParams: {} as { thrId: number },
  },
  THREAD_DELETE: {
    path: "/threads/{thrId}",
    pathParams: {} as { thrId: number },
  },
  THREAD_PATCH: {
    path: "/threads/{thrId}",
    pathParams: {} as { thrId: number },
  },
  THREAD_ASSIGNEES: {
    path: "/threads/{thrId}/assignees",
    pathParams: {} as { thrId: number },
    queryParams: {} as { page: number; size: number },
  },
  THREAD_ADD_ASSIGNEE: {
    path: "/threads/{thrId}/assignees",
    pathParams: {} as { thrId: number },
  },
  THREAD_REMOVE_ASSIGNEE: {
    path: "/threads/{thrId}/assignees/{username}",
    pathParams: {} as { thrId: number; username: string },
  },
  THREAD_DEADLINES: {
    path: "/threads/{thrId}/deadlines",
    pathParams: {} as { thrId: number },
    queryParams: {} as { page: number },
  },
  DEADLINE_CREATE: {
    path: "/threads/{thrId}/deadlines",
    pathParams: {} as { thrId: number },
  },
  DEADLINE_GET: {
    path: "/deadlines/{ddlId}",
    pathParams: {} as { ddlId: number },
  },
  DEADLINE_GET_MY: {
    path: "/deadlines/me",
    queryParams: {} as { page: number },
  },
  DEADLINE_DELETE: {
    path: "/deadlines/{ddlId}",
    pathParams: {} as { ddlId: number },
  },
  DEADLINE_PATCH: {
    path: "/deadlines/{ddlId}",
    pathParams: {} as { ddlId: number },
  },
  DEADLINE_ASSIGNEES: {
    path: "/deadlines/{ddlId}/assignees",
    pathParams: {} as { ddlId: number },
  },
  DEADLINE_ADD_ASSIGNEE: {
    path: "/deadlines/{ddlId}/assignees",
    pathParams: {} as { ddlId: number },
  },
  DEADLINE_REMOVE_ASSIGNEE: {
    path: "/deadlines/{ddlId}/assignees/{username}",
    pathParams: {} as { ddlId: number; username: string },
  },
  ROLES_METADATA: {
    path: "/roles/metadata",
    pathParams: {} as never,
  },
  ROLES_CHANGE_ORGANIZATION: {
    path: "/roles/organization/{orgId}",
    pathParams: {} as { orgId: number },
  },
  ROLES_CHANGE_ORGANIZATION_OWNER: {
    path: "/roles/organization/{orgId}/change-owner",
    pathParams: {} as { orgId: number },
  },
  ROLES_CHANGE_THREAD: {
    path: "/roles/thread/{threadId}",
    pathParams: {} as { threadId: number },
  },
  ROLES_CHANGE_DEADLINE: {
    path: "/roles/deadline/{deadlineId}",
    pathParams: {} as { deadlineId: number },
  },
  METADATA_GET: {
    path: "/metadata",
    pathParams: {} as never,
  },
  METADATA_BOTS_GET: {
    path: "/metadata/bots",
  },
  INVITATION_ACCEPT: {
    path: "/invitation/{invitationId}/accept",
    pathParams: {} as { invitationId: number },
  },
  INVITATION_DECLINE: {
    path: "/invitation/{invitationId}/decline",
    pathParams: {} as { invitationId: number },
  },
  INVITATION_USER_PENDING_RECEIVED_NUMBER: {
    path: "/invitation/me/pending-received-number",
    queryParams: {} as { page: number },
  },
  INVITATION_USER_PENDING_RECEIVED: {
    path: "/invitation/me/pending-received",
    queryParams: {} as { page: number },
  },
  INVITATION_USER_PENDING_SENT: {
    path: "/invitation/me/pending-sent",
    queryParams: {} as { page: number },
  },
  INVITATION_REVOKE: {
    path: "/invitation/{invitationId}/revoke",
    pathParams: {} as { invitationId: number },
  },
  DEADLINE_ATTACHMENTS_METADATA_GET: {
    path: "/deadlines/{ddlId}/attachments",
    pathParams: {} as { ddlId: number },
  },
  DEADLINE_ATTACHMENT_POST: {
    path: "/deadlines/{ddlId}/attachments",
    pathParams: {} as { ddlId: number },
  },
  DEADLINE_ATTACHMENT_GET: {
    path: "/attachments/{attachmentId}",
    pathParams: {} as { attachmentId: number },
    queryParams: {} as { disposition: string },
  },
  DEADLINE_ATTACHMENT_METADATA_PATCH: {
    path: "/attachments/{attachmentId}/metadata",
    pathParams: {} as { attachmentId: number },
  },
  DEADLINE_ATTACHMENT_PUT: {
    path: "/attachments/{attachmentId}",
    pathParams: {} as { attachmentId: number },
  },
  DEADLINE_ATTACHMENT_DELETE: {
    path: "/attachments/{attachmentId}",
    pathParams: {} as { attachmentId: number },
  },
} as const;

export type EndpointSpec<K extends EndpointKey> = {
  path: string;
} & (PathParams<K> extends never ? Record<string, never> : { pathParams: PathParams<K> }) &
  (QueryParams<K> extends never ? Record<string, never> : { queryParams: QueryParams<K> });

type EndpointKey = keyof typeof endpoints;

type PathParams<K extends EndpointKey> = (typeof endpoints)[K] extends { readonly pathParams: infer P } ? P : never;
type QueryParams<K extends EndpointKey> = (typeof endpoints)[K] extends { readonly queryParams: infer Q } ? Q : never;

const buildPath = (path: string, pathParams?: Record<string, string | number>): string => {
  if (!pathParams) return `${endpointPrefix}${path}`;

  let result = path;
  for (const [key, value] of Object.entries(pathParams)) {
    result = result.replace(`{${key}}`, encodeURIComponent(String(value)));
  }

  return `${endpointPrefix}${result}`;
};

const buildQuery = (query?: Record<string, string | number>): string => {
  if (!query) return "";

  const pathParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    pathParams.append(key, String(value));
  }
  return `?${pathParams.toString()}`;
};

export const getEndpoint = <K extends EndpointKey>(
  key: K,
  options?: {
    pathParams?: PathParams<K>;
    queryParams?: QueryParams<K>;
  },
): string => {
  const spec = endpoints[key];

  const path = buildPath(spec.path, options?.pathParams as Record<string, string | number>);
  const query = buildQuery(options?.queryParams as Record<string, string | number>);
  return `${path}${query}`;
};
