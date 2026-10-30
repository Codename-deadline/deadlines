import type { useQueryCache } from "@pinia/colada";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type ThreadWithRoleModel, toThread, toThreadWithRole } from "@/api/adapters/thread";
import { toMember } from "@/api/adapters/user";
import {
  getGetThreadQueryOptions,
  getGetThreadsQueryKey,
  getGetUserThreadsQueryKey,
  getThreads,
  getUserThreads,
  useGetThread,
  useGetThreadAssignees,
} from "@/api/generated/endpoints/threads/threads";
import type { ThreadResponseWithRole } from "@/api/generated/models";
import { useDefaultQueryEnabled } from "@/composables/shared/useDefaultQueryEnabled";
import { usePagedList } from "@/composables/shared/usePagedList";

export const userAssignedThreadsPrefix = getGetUserThreadsQueryKey({ page: 0 }).slice(0, -1);
export const organizationThreadsPrefix = (id: number) => getGetThreadsQueryKey(id, { page: 0 }).slice(0, -1);
export const threadPrefix = getGetThreadsQueryKey(0, { page: 0 }).slice(0, -2);
// "infinite" separates accumulated pages from generated single-page query data.
export const userAssignedThreadsKey = [...userAssignedThreadsPrefix, "infinite"] as const;
export const organizationThreadsKey = (id: number) => [...organizationThreadsPrefix(id), "infinite"] as const;

export function useUserAssignedThreads(enabled: MaybeRefOrGetter<boolean> = true) {
  return usePagedList<ThreadResponseWithRole, ThreadWithRoleModel>(() => ({
    key: userAssignedThreadsKey,
    enabled: toValue(enabled),
    fetchPage: (page, signal) => getUserThreads({ page }, { signal }),
    map: toThreadWithRole,
  }));
}

export function useOrganizationThreads(organizationId: MaybeRefOrGetter<number>) {
  return usePagedList<ThreadResponseWithRole, ThreadWithRoleModel>(() => {
    const id = toValue(organizationId);
    return {
      key: organizationThreadsKey(id),
      enabled: id > 0,
      fetchPage: (page, signal) => getThreads(id, { page }, { signal }),
      map: toThreadWithRole,
    };
  });
}

export function useThread(threadId: MaybeRefOrGetter<number>) {
  const defaultEnabled = useDefaultQueryEnabled();
  const query = useGetThread(threadId, () => ({
    query: { enabled: defaultEnabled() && toValue(threadId) > 0 },
  }));
  return { ...query, thread: computed(() => (query.data.value ? toThread(query.data.value) : undefined)) };
}

export async function resolveThread(threadId: number, cache: ReturnType<typeof useQueryCache>) {
  const entry = cache.ensure(getGetThreadQueryOptions(threadId, { query: { enabled: true } }));
  const state = await cache.refresh(entry);
  return state.data ? toThread(state.data) : null;
}

export function useThreadAssignees(threadId: MaybeRefOrGetter<number>, page: MaybeRefOrGetter<number>) {
  const defaultEnabled = useDefaultQueryEnabled();
  const query = useGetThreadAssignees(
    threadId,
    () => ({ page: toValue(page) }),
    () => ({
      query: { enabled: defaultEnabled() && toValue(threadId) > 0 },
    }),
  );
  return {
    ...query,
    members: computed(() => query.data.value?.data.map(toMember) ?? []),
    totalPages: computed(() => query.data.value?.totalPages ?? 0),
  };
}
