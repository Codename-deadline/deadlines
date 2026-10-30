import { defineQuery } from "@pinia/colada";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type InvitationModel, toInvitation } from "@/api/adapters/invitation";
import {
  getGetPendingInvitationsByUserQueryKey,
  getGetPendingSentInvitationsByUserQueryKey,
  getPendingInvitationsByUser,
  getPendingSentInvitationsByUser,
  useGetNumberOfPendingInvitation,
} from "@/api/generated/endpoints/invitations/invitations";
import type { OrganizationInvitationResponse } from "@/api/generated/models";
import { usePagedList } from "@/composables/shared/usePagedList";

export const receivedInvitationsPrefix = getGetPendingInvitationsByUserQueryKey({ page: 0 }).slice(0, -1);
export const sentInvitationsPrefix = getGetPendingSentInvitationsByUserQueryKey({ page: 0 }).slice(0, -1);
export const receivedInvitationsKey = [...receivedInvitationsPrefix, "infinite"] as const;
export const sentInvitationsKey = [...sentInvitationsPrefix, "infinite"] as const;

export function useReceivedInvitations(enabled: MaybeRefOrGetter<boolean> = true) {
  return usePagedList<OrganizationInvitationResponse, InvitationModel>(() => ({
    key: receivedInvitationsKey,
    enabled: toValue(enabled),
    fetchPage: (page, signal) => getPendingInvitationsByUser({ page }, { signal }),
    map: toInvitation,
  }));
}

export function useSentInvitations(enabled: MaybeRefOrGetter<boolean> = true) {
  return usePagedList<OrganizationInvitationResponse, InvitationModel>(() => ({
    key: sentInvitationsKey,
    enabled: toValue(enabled),
    fetchPage: (page, signal) => getPendingSentInvitationsByUser({ page }, { signal }),
    map: toInvitation,
  }));
}

export const usePendingInvitationCount = defineQuery(() => {
  const query = useGetNumberOfPendingInvitation();
  const pendingCount = computed(() => query.data.value?.pending ?? 0);

  return { ...query, pendingCount };
});
