import type { EntryKey, useQueryCache } from "@pinia/colada";
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
