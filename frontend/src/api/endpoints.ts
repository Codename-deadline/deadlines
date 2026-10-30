const endpointPrefix: string = "/api";
const endpoints = {
  INVITATION_ACCEPT: {
    path: "/invitation/{invitationId}/accept",
    pathParams: {} as { invitationId: number },
  },
  INVITATION_DECLINE: {
    path: "/invitation/{invitationId}/decline",
    pathParams: {} as { invitationId: number },
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
