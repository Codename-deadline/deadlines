import { type DataState, PiniaColada, useMutationCache, useQueryCache } from "@pinia/colada";
import type { Pinia } from "pinia";
import { type App, watch } from "vue";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useGlobalStateStore } from "@/stores/GlobalStateStore";
import { type ListType, useInfiniteListStore } from "@/stores/InfiniteListStore";
import { useTokenStore } from "@/stores/TokenStore";
import { sessionMutationGuard } from "./pinia/sessionMutations";

// Empty state as described in https://pinia-colada.esm.dev/guide/queries.html
export const QUERY_EMPTY_PENDING_STATE: DataState<undefined, null> = {
  status: "pending",
  data: undefined,
  error: null,
};

export function installApi(app: App, pinia: Pinia) {
  const tokens = useTokenStore(pinia);
  app.use(PiniaColada, {
    plugins: [sessionMutationGuard()],
    queryOptions: {
      staleTime: 30_000,
      // Public queries can explicitly opt in with enabled: true.
      enabled: () => Boolean(tokens.accessToken || tokens.refreshToken),
    },
  });

  const queries = useQueryCache(pinia);
  const mutations = useMutationCache(pinia);
  const lists = useInfiniteListStore(pinia);

  const stop = watch(
    () => tokens.sessionVersion,
    () => {
      queries.cancelQueries();

      for (const entry of queries.getEntries()) {
        // Also clear data held by an observer that has not unmounted yet.
        queries.setEntryState(entry, QUERY_EMPTY_PENDING_STATE);
        queries.invalidate(entry);
        if (!entry.active) queries.remove(entry);
      }
      for (const entry of mutations.getEntries()) {
        mutations.setEntryState(entry, QUERY_EMPTY_PENDING_STATE);
        mutations.remove(entry);
      }

      useCurrentScopeStore(pinia).$reset();
      useGlobalStateStore(pinia).$reset();

      for (const type of Object.keys(lists.stateMap) as ListType[]) {
        lists.$reset(type);
      }
    },
    { flush: "sync" },
  );

  app.onUnmount(stop);
  return stop;
}
