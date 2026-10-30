import { useQueryCache } from "@pinia/colada";
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
import type { OrganizationResponseWithRole } from "@/api/generated/models";
import { clearOrganizationInvitations, refreshInvitations } from "@/composables/invitations/invitationCache";
import { clearQueryEntries, refreshQueryEntries, removeInfiniteQueryItems } from "@/composables/shared/queryCache";
import { clearOrganizationThreads } from "@/composables/threads/threadCache";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { organizationHintsPrefix, organizationMembersPrefix, refreshOrganization } from "./organizationCache";
import { organizationsListPrefix } from "./useOrganizations";

export function useOrganizationMutations() {
  const cache = useQueryCache();
  const scope = useCurrentScopeStore();

  const refreshAffectedOrganization = (id: number, members = false) =>
    Promise.all([refreshOrganization(cache, id, members), refreshInvitations(cache)]);

  const create = useCreateOrganization({
    mutation: {
      onSuccess: () =>
        Promise.all([refreshQueryEntries(cache, { key: organizationsListPrefix }), refreshInvitations(cache)]),
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
        removeInfiniteQueryItems(
          cache,
          [organizationsListPrefix],
          (item: OrganizationResponseWithRole) => item.id === organizationId,
        );

        for (const key of [
          getGetOrganizationMetadataQueryKey(organizationId),
          organizationMembersPrefix(organizationId),
          organizationHintsPrefix(organizationId),
        ]) {
          clearQueryEntries(cache, key);
        }

        clearOrganizationInvitations(cache, organizationId);

        if (scope.organizationId === organizationId) scope.$reset();
        return Promise.all([
          refreshQueryEntries(cache, { key: organizationsListPrefix }),
          refreshInvitations(cache),
          clearOrganizationThreads(cache, organizationId),
        ]);
      },
    },
  });

  return { create, patch, remove, visibility, ownership, role, removeMember, invite };
}
