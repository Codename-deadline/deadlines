import type { useQueryCache } from "@pinia/colada";
import {
  getGetInvitationQueryKey,
  getGetNumberOfPendingInvitationQueryKey,
} from "@/api/generated/endpoints/invitations/invitations";
import type { OrganizationInvitationResponse } from "@/api/generated/models";
import { clearQueryEntries, refreshQueryEntries, removeInfiniteQueryItems } from "./queryCache";
import { receivedInvitationsPrefix, sentInvitationsPrefix } from "./useInvitations";

type QueryCache = ReturnType<typeof useQueryCache>;
const invitationDetailsPrefix = getGetInvitationQueryKey(0).slice(0, -1);

export function refreshInvitations(cache: QueryCache) {
  return Promise.all([
    refreshQueryEntries(cache, { key: receivedInvitationsPrefix }),
    refreshQueryEntries(cache, { key: sentInvitationsPrefix }),
    refreshQueryEntries(cache, { key: getGetNumberOfPendingInvitationQueryKey() }, "all"),
    refreshQueryEntries(cache, { key: invitationDetailsPrefix }, "all"),
  ]);
}

export function removeInvitationRows(cache: QueryCache, matches: (item: OrganizationInvitationResponse) => boolean) {
  removeInfiniteQueryItems(cache, [receivedInvitationsPrefix, sentInvitationsPrefix], matches);
}

export function clearOrganizationInvitations(cache: QueryCache, organizationId: number) {
  removeInvitationRows(cache, (item) => item.organization.id === organizationId);

  for (const entry of cache.getEntries({ key: invitationDetailsPrefix })) {
    const dto = entry.state.value.data as OrganizationInvitationResponse | undefined;
    if (dto?.organization.id === organizationId) clearQueryEntries(cache, entry.key);
  }
}
