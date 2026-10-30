import { type EntryKey, setInfiniteQueryData, type UseInfiniteQueryData, type useQueryCache } from "@pinia/colada";
import { getGetThreadAssigneesQueryKey, getGetThreadQueryKey } from "@/api/generated/endpoints/threads/threads";
import type { PaginationResponseThreadResponseWithRole, ThreadResponse } from "@/api/generated/models";
import { QUERY_EMPTY_PENDING_STATE } from "@/plugins/api";
import { clearThreadDeadlines, refreshDeadlineAccess } from "./deadlineCache";
import { organizationThreadsPrefix, userAssignedThreadsPrefix } from "./useThreads";

type QueryCache = ReturnType<typeof useQueryCache>;
const threadPrefix = getGetThreadQueryKey(0).slice(0, -1);

/** Organization roles and visibility also determine inherited thread access. */
export function refreshOrganizationThreads(cache: QueryCache, organizationId: number) {
  const details = cache.getEntries({ key: threadPrefix }).filter((entry) => {
    const dto = entry.state.value.data as ThreadResponse | undefined;
    return !dto || dto.organizationId === organizationId;
  });

  return Promise.all([
    refreshDeadlineAccess(cache),
    cache.invalidateQueries({ key: userAssignedThreadsPrefix }).catch(() => {}),
    cache.invalidateQueries({ key: organizationThreadsPrefix(organizationId) }).catch(() => {}),
    ...details.map((entry) => cache.invalidateQueries({ key: entry.key, exact: true }, "all").catch(() => {})),
  ]);
}

export function clearOrganizationThreads(cache: QueryCache, organizationId: number) {
  const keys: EntryKey[] = [organizationThreadsPrefix(organizationId)];
  const threadIds = new Set<number>();

  for (const prefix of [organizationThreadsPrefix(organizationId), userAssignedThreadsPrefix]) {
    for (const entry of cache.getEntries({
      key: prefix,
      predicate: (entry) => entry.key[entry.key.length - 1] === "infinite",
    })) {
      const list = entry.state.value.data as
        | UseInfiniteQueryData<PaginationResponseThreadResponseWithRole, number>
        | undefined;
      for (const page of list?.pages ?? []) {
        for (const thread of page.data) {
          if (thread.organizationId === organizationId) threadIds.add(thread.id);
        }
      }
    }
  }
  for (const entry of cache.getEntries({ key: threadPrefix })) {
    const dto = entry.state.value.data as ThreadResponse | undefined;
    if (dto?.organizationId === organizationId) {
      threadIds.add(dto.id);
      keys.push([...getGetThreadQueryKey(dto.id)], getGetThreadAssigneesQueryKey(dto.id, { page: 0 }).slice(0, -1));
    }
  }

  for (const key of keys) {
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

  for (const entry of cache.getEntries({
    key: userAssignedThreadsPrefix,
    predicate: (entry) => entry.key[entry.key.length - 1] === "infinite",
  })) {
    const list = entry.state.value.data as
      | UseInfiniteQueryData<PaginationResponseThreadResponseWithRole, number>
      | undefined;
    if (list)
      setInfiniteQueryData(cache, entry.key, {
        ...list,
        pages: list.pages.map((page) => ({
          ...page,
          data: page.data.filter((item) => item.organizationId !== organizationId),
        })),
      });
  }
  return Promise.all([
    cache.invalidateQueries({ key: userAssignedThreadsPrefix }).catch(() => {}),
    ...[...threadIds].map((id) => clearThreadDeadlines(cache, id)),
  ]);
}
