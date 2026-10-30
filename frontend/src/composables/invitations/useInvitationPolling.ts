import { useQueryCache } from "@pinia/colada";
import { watch } from "vue";
import { useDefaultQueryEnabled } from "@/composables/shared/useDefaultQueryEnabled";
import { refreshInvitations } from "./invitationCache";
import { usePendingInvitationCount } from "./useInvitations";

export const INVITATION_POLL_INTERVAL_MS = 5 * 60 * 1000;

/** Mount once at application level; badge consumers share the count without owning timers. */
export function useInvitationPolling() {
  const cache = useQueryCache();
  const enabled = useDefaultQueryEnabled();
  usePendingInvitationCount();

  watch(
    enabled,
    (active, _previous, onCleanup) => {
      if (!active) return;

      const timer = setInterval(() => {
        if (enabled()) refreshInvitations(cache);
      }, INVITATION_POLL_INTERVAL_MS);

      onCleanup(() => clearInterval(timer));
    },
    { immediate: true },
  );
}
