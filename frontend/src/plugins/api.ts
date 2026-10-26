import { type DataState, PiniaColada, type UseQueryEntry, useMutationCache, useQueryCache } from "@pinia/colada";
import type { Pinia } from "pinia";
import { type App, nextTick, toValue, watch } from "vue";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useGlobalStateStore } from "@/stores/GlobalStateStore";
import { type ListType, useInfiniteListStore } from "@/stores/InfiniteListStore";
import { useTokenStore } from "@/stores/TokenStore";
import { sessionMutationGuard } from "./pinia/sessionMutations";

declare module "@pinia/colada" {
  interface TypesConfig {
    queryMeta: {
      // Public data can survive session changes. Execution still depends on enabled.
      sessionBound?: boolean;
      [key: string]: unknown;
    };
  }
}

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
  const interruptedPublic = new Set<UseQueryEntry>();
  let stopped = false;

  const stopWatch = watch(
    () => tokens.sessionVersion,
    (version) => {
      for (const entry of queries.getEntries()) {
        if (!entry.meta.sessionBound) {
          if (entry.pending) {
            // The transport aborts all requests from the previous session, including public ones.
            interruptedPublic.add(entry);
            queries.invalidate(entry);
          }
          continue;
        }

        queries.cancel(entry);
        // Also clear data held by an observer that has not unmounted yet.
        entry.placeholderData = null;
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

      // updateTokens() installs credentials after incrementing sessionVersion. Let it and
      // enabled/key watchers finish first; refresh() reuses fetches already started by them.
      void nextTick().then(() => {
        if (stopped || tokens.sessionVersion !== version) return;

        const publicEntries = new Set(interruptedPublic);
        interruptedPublic.clear();
        for (const entry of queries.getEntries({ active: true })) {
          if (stopped || tokens.sessionVersion !== version) break;

          const isPublic = !entry.meta.sessionBound;
          if (isPublic ? !publicEntries.has(entry) : !(tokens.accessToken || tokens.refreshToken)) continue;
          if (entry.options && toValue(entry.options.enabled)) {
            // Failures remain visible in query state, as with useQuery's automatic refresh.
            void queries.refresh(entry).catch(() => {});
          }
        }
      });
    },
    { flush: "sync" },
  );

  const stop = () => {
    stopped = true;
    stopWatch();
    interruptedPublic.clear();
  };
  app.onUnmount(stop);
  return stop;
}
