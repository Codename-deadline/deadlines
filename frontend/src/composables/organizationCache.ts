import type { useQueryCache } from "@pinia/colada";
import {
  getGetMembersQueryKey,
  getGetMemberUsernamesStartingWithQueryKey,
  getGetOrganizationMetadataQueryKey,
} from "@/api/generated/endpoints/organizations/organizations";
import { refreshOrganizationThreads } from "./threadCache";
import { organizationsListPrefix } from "./useOrganizations";

export const organizationMembersPrefix = (id: number) => getGetMembersQueryKey(id, { page: 0, size: 5 }).slice(0, -1);
export const organizationHintsPrefix = (id: number) =>
  getGetMemberUsernamesStartingWithQueryKey(id, { startsWith: "" }).slice(0, -1);

export function refreshOrganization(cache: ReturnType<typeof useQueryCache>, organizationId: number, members = false) {
  return Promise.all([
    cache.invalidateQueries({ key: organizationsListPrefix }).catch(() => {}),
    // Scope readers can consume the detail cache without mounting a query observer.
    cache.invalidateQueries({ key: getGetOrganizationMetadataQueryKey(organizationId) }, "all").catch(() => {}),
    ...(members
      ? [
          cache.invalidateQueries({ key: organizationMembersPrefix(organizationId) }).catch(() => {}),
          cache.invalidateQueries({ key: organizationHintsPrefix(organizationId) }).catch(() => {}),
          refreshOrganizationThreads(cache, organizationId),
        ]
      : []),
  ]);
}
