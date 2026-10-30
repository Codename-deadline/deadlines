import { useQueryCache } from "@pinia/colada";
import { type MaybeRefOrGetter, toValue } from "vue";
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useRevokeInvitation,
} from "@/api/generated/endpoints/invitations/invitations";
import { refreshOrganization } from "@/composables/organizations/organizationCache";
import { refreshInvitations, removeInvitationRows } from "./invitationCache";

type ParentContext = { organizationId: number };

export function useInvitationActions(organizationId: MaybeRefOrGetter<number>) {
  const cache = useQueryCache();

  const finishInvitation = (id: number) => {
    removeInvitationRows(cache, (item) => item.id === id);

    return refreshInvitations(cache);
  };

  const accept = useAcceptInvitation<Error, ParentContext>({
    mutation: {
      onMutate: () => ({ organizationId: toValue(organizationId) }),
      onSuccess: (_, { invitationId }, parent) =>
        Promise.all([finishInvitation(invitationId), refreshOrganization(cache, parent.organizationId, true)]),
    },
  });

  const decline = useDeclineInvitation({
    mutation: { onSuccess: (_, { invitationId }) => finishInvitation(invitationId) },
  });

  const revoke = useRevokeInvitation({
    mutation: { onSuccess: (_, { invitationId }) => finishInvitation(invitationId) },
  });

  return { accept, decline, revoke };
}
