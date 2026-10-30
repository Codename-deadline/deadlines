import { type EntryKey, setInfiniteQueryData, type UseInfiniteQueryData, useQueryCache } from "@pinia/colada";
import { useSendInvitation } from "@/api/generated/endpoints/invitations/invitations";
import {
  getGetOrganizationMetadataQueryKey,
  useChangeOrganizationVisibility,
  useCreateOrganization,
  useDeleteOrganization,
  usePatchOrganization,
  useRemoveMember,
} from "@/api/generated/endpoints/organizations/organizations";
import { useChangeOrganizationOwner, useChangeOrganizationRole } from "@/api/generated/endpoints/roles/roles";
import type { PaginationResponseOrganizationResponseWithRole } from "@/api/generated/models";
import { QUERY_EMPTY_PENDING_STATE } from "@/plugins/api";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { clearOrganizationInvitations, refreshInvitations } from "./invitationCache";
import { organizationHintsPrefix, organizationMembersPrefix, refreshOrganization } from "./organizationCache";
import { clearOrganizationThreads } from "./threadCache";
import { organizationsListKey, organizationsListPrefix } from "./useOrganizations";

export function useOrganizationMutations() {
  const cache = useQueryCache();
  const scope = useCurrentScopeStore();

  // Read failures stay in query state; a failed refetch must not turn a committed write into a failed mutation.
  const invalidate = (key: EntryKey, all = false) =>
    cache.invalidateQueries({ key }, all ? "all" : true).catch(() => {});

  const refreshAffectedOrganization = (id: number, members = false) =>
    Promise.all([refreshOrganization(cache, id, members), refreshInvitations(cache)]);

  const create = useCreateOrganization({
    mutation: {
      onSuccess: () => Promise.all([invalidate(organizationsListPrefix), refreshInvitations(cache)]),
    },
  });
  const patch = usePatchOrganization({
    mutation: { onSuccess: (_data, { organizationId }) => refreshAffectedOrganization(organizationId) },
  });
  const visibility = useChangeOrganizationVisibility({
    mutation: { onSuccess: (_data, { organizationId }) => refreshAffectedOrganization(organizationId, true) },
  });
  const ownership = useChangeOrganizationOwner({
    mutation: { onSuccess: (_data, { organizationId }) => refreshAffectedOrganization(organizationId, true) },
  });
  const role = useChangeOrganizationRole({
    mutation: { onSuccess: (_data, { organizationId }) => refreshAffectedOrganization(organizationId, true) },
  });
  const removeMember = useRemoveMember({
    mutation: { onSuccess: (_data, { organizationId }) => refreshAffectedOrganization(organizationId, true) },
  });
  const invite = useSendInvitation({ mutation: { onSuccess: () => refreshInvitations(cache) } });
  const remove = useDeleteOrganization({
    mutation: {
      onSuccess: (_data, { organizationId }) => {
        const list =
          cache.getQueryData<UseInfiniteQueryData<PaginationResponseOrganizationResponseWithRole, number>>(
            organizationsListKey,
          );
        if (list) {
          setInfiniteQueryData(cache, organizationsListKey, {
            ...list,
            pages: list.pages.map((page) => ({
              ...page,
              data: page.data.filter((item) => item.id !== organizationId),
            })),
          });
        }

        for (const key of [
          getGetOrganizationMetadataQueryKey(organizationId),
          organizationMembersPrefix(organizationId),
          organizationHintsPrefix(organizationId),
        ]) {
          for (const entry of cache.getEntries({ key })) {
            cache.cancel(entry);
            entry.placeholderData = null;
            cache.setEntryState(entry, QUERY_EMPTY_PENDING_STATE);
            cache.invalidate(entry);
            if (!entry.active) cache.remove(entry);
          }
        }
        clearOrganizationInvitations(cache, organizationId);

        if (scope.organizationId === organizationId) scope.$reset();
        return Promise.all([
          invalidate(organizationsListPrefix),
          refreshInvitations(cache),
          clearOrganizationThreads(cache, organizationId),
        ]);
      },
    },
  });

  return { create, patch, remove, visibility, ownership, role, removeMember, invite };
}
