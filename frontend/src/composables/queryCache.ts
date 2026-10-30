import {
  type EntryKey,
  setInfiniteQueryData,
  type UseInfiniteQueryData,
  type UseQueryEntryFilter,
  type useQueryCache,
} from "@pinia/colada";
import { QUERY_EMPTY_PENDING_STATE } from "@/plugins/api";

type QueryCache = ReturnType<typeof useQueryCache>;

export function clearQueryEntries(cache: QueryCache, key: EntryKey) {
  for (const entry of cache.getEntries({ key })) {
    if (!entry.active) {
      cache.cancel(entry);
      cache.remove(entry);
    } else {
      entry.placeholderData = null;
      cache.setEntryState(entry, QUERY_EMPTY_PENDING_STATE);
      cache.invalidate(entry);
    }
  }
}

/** Refetch errors belong to query state and must not reject an already committed write. */
export function refreshQueryEntries(cache: QueryCache, filters: UseQueryEntryFilter, refetch: boolean | "all" = true) {
  return cache.invalidateQueries(filters, refetch).catch(() => {});
}

/** Only accumulated-page keys are safe to edit with this data shape. */
export function removeInfiniteQueryItems<T>(
  cache: QueryCache,
  prefixes: readonly EntryKey[],
  matches: (item: T) => boolean,
) {
  for (const key of prefixes) {
    for (const entry of cache.getEntries({
      key,
      predicate: (entry) => entry.key[entry.key.length - 1] === "infinite",
    })) {
      const list = entry.state.value.data as UseInfiniteQueryData<{ data: T[] }, number> | undefined;
      if (!list) continue;

      setInfiniteQueryData(cache, entry.key, {
        ...list,
        pages: list.pages.map((page) => ({ ...page, data: page.data.filter((item) => !matches(item)) })),
      });
    }
  }
}
