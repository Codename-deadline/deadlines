import { type EntryKey, useInfiniteQuery } from "@pinia/colada";
import { computed, shallowRef } from "vue";
import { useDefaultQueryEnabled } from "./useDefaultQueryEnabled";

/** Cache raw pages and derive UI rows independently of rendering and virtualization. */
export function usePagedList<T extends { id: number }, TModel extends { id: number }>(
  options: () => {
    key: EntryKey;
    enabled?: boolean;
    fetchPage: (page: number, signal: AbortSignal) => Promise<{ data: T[]; totalPages: number }>;
    map: (dto: T) => TModel;
  },
) {
  const defaultEnabled = useDefaultQueryEnabled();
  const enabled = () => defaultEnabled() && options().enabled !== false;
  const nextPageError = shallowRef<unknown>(null);

  const query = useInfiniteQuery<{ data: T[]; totalPages: number }, Error, number>(() => {
    const current = options();
    return {
      key: current.key,
      enabled: enabled(),
      initialPageParam: 0,
      query: ({ pageParam, signal }) => current.fetchPage(pageParam, signal),
      getNextPageParam: (page, _pages, pageParam) => (pageParam + 1 < page.totalPages ? pageParam + 1 : null),
    };
  });
  const uniqueItems = computed(() => {
    const unique = new Map<number, TModel>();
    for (const page of query.data.value?.pages ?? []) {
      for (const dto of page.data) {
        unique.set(dto.id, options().map(dto));
      }
    }
    return [...unique.values()];
  });

  const loadMore = async () => {
    if (!enabled() || query.isLoading.value || query.error.value || !query.hasNextPage.value) return;
    await query.loadNextPage({ cancelRefetch: false });
    nextPageError.value = query.error.value;
  };
  const retry = async () => {
    if (!enabled() || query.isLoading.value) return;

    if (nextPageError.value && nextPageError.value === query.error.value && query.data.value) {
      await query.loadNextPage({ cancelRefetch: false });
      nextPageError.value = query.error.value;
    } else {
      await query.refetch();
    }
  };
  return { ...query, items: uniqueItems, loadMore, retry };
}
