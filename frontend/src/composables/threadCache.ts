import type { EntryKey, UseInfiniteQueryData, useQueryCache } from "@pinia/colada";
import { getGetThreadAssigneesQueryKey, getGetThreadQueryKey } from "@/api/generated/endpoints/threads/threads";
import type {
  PaginationResponseThreadResponseWithRole,
  ThreadResponse,
  ThreadResponseWithRole,
} from "@/api/generated/models";
import { clearThreadDeadlines, refreshDeadlineAccess } from "./deadlineCache";
import { clearQueryEntries, refreshQueryEntries, removeInfiniteQueryItems } from "./queryCache";
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
    refreshQueryEntries(cache, { key: userAssignedThreadsPrefix }),
    refreshQueryEntries(cache, { key: organizationThreadsPrefix(organizationId) }),
    ...details.map((entry) => refreshQueryEntries(cache, { key: entry.key, exact: true }, "all")),
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
    clearQueryEntries(cache, key);
  }
  removeInfiniteQueryItems(
    cache,
    [userAssignedThreadsPrefix],
    (item: ThreadResponseWithRole) => item.organizationId === organizationId,
  );

  return Promise.all([
    refreshQueryEntries(cache, { key: userAssignedThreadsPrefix }),
    ...[...threadIds].map((id) => clearThreadDeadlines(cache, id)),
  ]);
}
