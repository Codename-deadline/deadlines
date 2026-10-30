import { setInfiniteQueryData, type UseInfiniteQueryData, type useQueryCache } from "@pinia/colada";
import {
  getGetInvitationQueryKey,
  getGetNumberOfPendingInvitationQueryKey,
} from "@/api/generated/endpoints/invitations/invitations";
import type {
  OrganizationInvitationResponse,
  PaginationResponseOrganizationInvitationResponse,
} from "@/api/generated/models";
import { clearQueryEntries } from "./queryCache";
import { receivedInvitationsPrefix, sentInvitationsPrefix } from "./useInvitations";

type QueryCache = ReturnType<typeof useQueryCache>;
const invitationDetailsPrefix = getGetInvitationQueryKey(0).slice(0, -1);

export function refreshInvitations(cache: QueryCache) {
  return Promise.all([
    cache.invalidateQueries({ key: receivedInvitationsPrefix }).catch(() => {}),
    cache.invalidateQueries({ key: sentInvitationsPrefix }).catch(() => {}),
    cache.invalidateQueries({ key: getGetNumberOfPendingInvitationQueryKey() }, "all").catch(() => {}),
    cache.invalidateQueries({ key: invitationDetailsPrefix }, "all").catch(() => {}),
  ]);
}

export function removeInvitationRows(
  cache: QueryCache,
  matches: (invitation: OrganizationInvitationResponse) => boolean,
) {
  for (const key of [receivedInvitationsPrefix, sentInvitationsPrefix]) {
    for (const entry of cache.getEntries({
      key,
      predicate: (entry) => entry.key[entry.key.length - 1] === "infinite",
    })) {
      const list = entry.state.value.data as
        | UseInfiniteQueryData<PaginationResponseOrganizationInvitationResponse, number>
        | undefined;
      if (!list) continue;

      setInfiniteQueryData(cache, entry.key, {
        ...list,
        pages: list.pages.map((page) => ({ ...page, data: page.data.filter((item) => !matches(item)) })),
      });
    }
  }
}

export function clearOrganizationInvitations(cache: QueryCache, organizationId: number) {
  removeInvitationRows(cache, (item) => item.organization.id === organizationId);

  for (const entry of cache.getEntries({ key: invitationDetailsPrefix })) {
    const dto = entry.state.value.data as OrganizationInvitationResponse | undefined;
    if (dto?.organization.id === organizationId) clearQueryEntries(cache, entry.key);
  }
}
