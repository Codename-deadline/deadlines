import { useInfiniteScroll, useVirtualList } from "@vueuse/core";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

/** Render rows and signal scroll demand; pagination and server state belong to the caller. */
export function useInfiniteVirtualList<T>(
  items: MaybeRefOrGetter<readonly T[]>,
  options: {
    itemsPerRow: MaybeRefOrGetter<number>;
    itemHeight: number;
    distance?: number;
    loading: MaybeRefOrGetter<boolean>;
    hasMore: MaybeRefOrGetter<boolean>;
    error: MaybeRefOrGetter<unknown>;
    loadMore: () => Promise<unknown>;
  },
) {
  const rows = computed(() => {
    const source = toValue(items);
    const count = Math.max(1, toValue(options.itemsPerRow));
    const result: T[][] = [];
    for (let i = 0; i < source.length; i += count) result.push(source.slice(i, i + count));
    return result;
  });
  const virtual = useVirtualList(rows, { itemHeight: options.itemHeight });
  useInfiniteScroll(
    virtual.containerProps.ref,
    async () => {
      await options.loadMore();
    },
    {
      distance: options.distance ?? 200,
      canLoadMore: () => toValue(options.hasMore) && !toValue(options.loading) && !toValue(options.error),
    },
  );
  return {
    containerProps: virtual.containerProps,
    wrapperProps: virtual.wrapperProps,
    virtualItems: virtual.list,
    scrollTo: virtual.scrollTo,
  };
}
