import { useInfiniteScroll, useVirtualList } from "@vueuse/core";
import { type ComputedRef, computed } from "vue";
import type { PagedResponse } from "@/api/common/PaginationResponse";
import { LIST_STORE_INITIAL_TOTAL_PAGES, type ListType, useInfiniteListStore } from "@/stores/InfiniteListStore";
import type { SafeApiCall } from "@/types/api";
import { displayApiError, displayFormErrors } from "@/utils";
import { useApi } from "./useApi";

export function useInfiniteVirtualList<T extends { id: number }>(
  type: ListType,
  fetcher: (page: number) => Promise<SafeApiCall<PagedResponse<T>>>,
  options: {
    itemsPerRow: ComputedRef<number>;
    itemHeight: number;
    distance?: number;
  },
) {
  const { makeRequest } = useApi();
  const store = useInfiniteListStore();
  const distance = options.distance ?? 200;

  const fetcherClosure = async (page: number) => {
    return await makeRequest(() => fetcher(page), displayFormErrors, displayApiError);
  };

  const state = computed(() => store.stateMap[type]);
  const items = computed<T[]>(() => state.value.items as T[]);
  const rows = computed(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.value.length; i += options.itemsPerRow.value) {
      result.push(items.value.slice(i, i + options.itemsPerRow.value));
    }
    return result;
  });

  const virtual = useVirtualList(rows, {
    itemHeight: options.itemHeight,
  });

  useInfiniteScroll(virtual.containerProps.ref, () => store.loadMore<T>(type, fetcherClosure), { distance });

  const loading = computed(() => state.value.loading);
  const showSkeleton = computed(
    () => loading.value || (state.value.totalPages === LIST_STORE_INITIAL_TOTAL_PAGES && items.value.length === 0),
  );

  return {
    containerProps: virtual.containerProps,
    wrapperProps: virtual.wrapperProps,
    virtualItems: virtual.list,
    scrollTo: virtual.scrollTo,

    loading,
    showSkeleton,
    hasMore: computed(() => store.hasMore(type)),

    loadMore: () => store.loadMore<T>(type, fetcherClosure),
    $reset: () => store.$reset(type),
  };
}
