import type { useQueryCache } from "@pinia/colada";
import {
  getGetMembersQueryKey,
  getGetMemberUsernamesStartingWithQueryKey,
  getGetOrganizationMetadataQueryKey,
} from "@/api/generated/endpoints/organizations/organizations";
import { refreshQueryEntries } from "@/composables/shared/queryCache";
import { refreshOrganizationThreads } from "@/composables/threads/threadCache";
import { organizationsListPrefix } from "./useOrganizations";

export const organizationMembersPrefix = (id: number) => getGetMembersQueryKey(id, { page: 0, size: 5 }).slice(0, -1);
export const organizationHintsPrefix = (id: number) =>
  getGetMemberUsernamesStartingWithQueryKey(id, { startsWith: "" }).slice(0, -1);

export function refreshOrganization(cache: ReturnType<typeof useQueryCache>, organizationId: number, members = false) {
  return Promise.all([
    refreshQueryEntries(cache, { key: organizationsListPrefix }),
    // Scope readers can consume the detail cache without mounting a query observer.
    refreshQueryEntries(cache, { key: getGetOrganizationMetadataQueryKey(organizationId) }, "all"),
    ...(members
      ? [
          refreshQueryEntries(cache, { key: organizationMembersPrefix(organizationId) }),
          refreshQueryEntries(cache, { key: organizationHintsPrefix(organizationId) }),
          refreshOrganizationThreads(cache, organizationId),
        ]
      : []),
  ]);
}
