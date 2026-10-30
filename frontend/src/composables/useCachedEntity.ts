import { type EntryKey, useQueryCache } from "@pinia/colada";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

/** Derive a model from existing cached data without starting another query. */
export function useCachedEntity<TData, TModel>(
  id: MaybeRefOrGetter<number | null>,
  key: (id: number) => EntryKey,
  map: (dto: TData) => TModel,
) {
  const cache = useQueryCache();

  return computed(() => {
    const entityId = toValue(id);
    if (!entityId) return null;

    const dto = cache.getQueryData<TData>(key(entityId));

    return dto ? map(dto) : null;
  });
}
