import { type EntryKey, setInfiniteQueryData, type UseInfiniteQueryData, useQueryCache } from "@pinia/colada";
import {
  getGetNumberOfPendingInvitationQueryKey,
  getGetPendingInvitationsByUserQueryKey,
  getGetPendingSentInvitationsByUserQueryKey,
  useSendInvitation,
} from "@/api/generated/endpoints/invitations/invitations";
import {
  getGetMembersQueryKey,
  getGetMemberUsernamesStartingWithQueryKey,
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
import { clearOrganizationThreads, refreshOrganizationThreads } from "./threadCache";
import { organizationsListKey, organizationsListPrefix } from "./useOrganizations";

export function useOrganizationMutations() {
  const cache = useQueryCache();
  const scope = useCurrentScopeStore();

  // Read failures stay in query state; a failed refetch must not turn a committed write into a failed mutation.
  const invalidate = (key: EntryKey, all = false) =>
    cache.invalidateQueries({ key }, all ? "all" : true).catch(() => {});

  const refreshInvitations = () =>
    Promise.all([
      invalidate(getGetPendingSentInvitationsByUserQueryKey({ page: 0 }).slice(0, -1)),
      invalidate(getGetPendingInvitationsByUserQueryKey({ page: 0 }).slice(0, -1)),
      invalidate(getGetNumberOfPendingInvitationQueryKey()),
    ]);

  const memberPrefix = (id: number) => getGetMembersQueryKey(id, { page: 0, size: 5 }).slice(0, -1);
  const hintPrefix = (id: number) => getGetMemberUsernamesStartingWithQueryKey(id, { startsWith: "" }).slice(0, -1);
  const refreshOrganization = async (id: number, members = false) =>
    Promise.all([
      invalidate(organizationsListPrefix),
      // Scope readers consume cached DTOs without mounting another query observer.
      invalidate(getGetOrganizationMetadataQueryKey(id), true),
      ...(members
        ? [invalidate(memberPrefix(id)), invalidate(hintPrefix(id)), refreshOrganizationThreads(cache, id)]
        : []),
    ]);

  const create = useCreateOrganization({
    mutation: {
      onSuccess: () => Promise.all([invalidate(organizationsListPrefix), refreshInvitations()]),
    },
  });
  const patch = usePatchOrganization({
    mutation: { onSuccess: (_data, { organizationId }) => refreshOrganization(organizationId) },
  });
  const visibility = useChangeOrganizationVisibility({
    mutation: { onSuccess: (_data, { organizationId }) => refreshOrganization(organizationId, true) },
  });
  const ownership = useChangeOrganizationOwner({
    mutation: { onSuccess: (_data, { organizationId }) => refreshOrganization(organizationId, true) },
  });
  const role = useChangeOrganizationRole({
    mutation: { onSuccess: (_data, { organizationId }) => refreshOrganization(organizationId, true) },
  });
  const removeMember = useRemoveMember({
    mutation: { onSuccess: (_data, { organizationId }) => refreshOrganization(organizationId, true) },
  });
  const invite = useSendInvitation({ mutation: { onSuccess: () => refreshInvitations() } });
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
          memberPrefix(organizationId),
          hintPrefix(organizationId),
        ]) {
          for (const entry of cache.getEntries({ key })) {
            cache.cancel(entry);
            entry.placeholderData = null;
            cache.setEntryState(entry, QUERY_EMPTY_PENDING_STATE);
            cache.invalidate(entry);
            if (!entry.active) cache.remove(entry);
          }
        }
        if (scope.organizationId === organizationId) scope.$reset();
        return Promise.all([
          invalidate(organizationsListPrefix),
          refreshInvitations(),
          clearOrganizationThreads(cache, organizationId),
        ]);
      },
    },
  });

  return { create, patch, remove, visibility, ownership, role, removeMember, invite };
}
