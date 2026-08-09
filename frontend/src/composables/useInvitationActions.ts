import { useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import { acceptInvitation, declineInvitation, revokeInvitation } from "@/api/invitation";
import { useApi } from "@/composables/useApi";
import { useInfiniteListStore } from "@/stores/InfiniteListStore";

export function useInvitationActions(variant: "received" | "sent") {
  const { t } = useI18n();
  const { makeRequest } = useApi();
  const message = useMessage();
  const store = useInfiniteListStore();

  const listType = variant === "received" ? "invitations_received" : "invitations_sent";

  const removeFromStore = (invitationId: number) => {
    store.removeItem(listType, invitationId);
  };

  const accept = async (invitationId: number) => {
    const res = await makeRequest(() => acceptInvitation(invitationId));
    if (!res.ok) return;
    removeFromStore(invitationId);
    message.success(t("scopes.toasts.invitation-accepted"));
  };

  const decline = async (invitationId: number) => {
    const res = await makeRequest(() => declineInvitation(invitationId));
    if (!res.ok) return;
    removeFromStore(invitationId);
    message.success(t("scopes.toasts.invitation-declined"));
  };

  const revoke = async (invitationId: number) => {
    const res = await makeRequest(() => revokeInvitation(invitationId));
    if (!res.ok) return;
    removeFromStore(invitationId);
    message.success(t("scopes.toasts.invitation-revoked"));
  };

  return { accept, decline, revoke };
}
