import type { useQueryCache } from "@pinia/colada";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type DeadlineModel, toDeadline } from "@/api/adapters/deadline";
import { toMember } from "@/api/adapters/user";
import {
  getDeadlines,
  getGetDeadlineQueryOptions,
  getGetDeadlinesQueryKey,
  getGetUserDeadlinesQueryKey,
  getUserDeadlines,
  useGetDeadline,
  useGetDeadlineAssignees,
} from "@/api/generated/endpoints/deadlines/deadlines";
import type { DeadlineResponseWithRole } from "@/api/generated/models";
import { useDefaultQueryEnabled } from "./useDefaultQueryEnabled";
import { usePagedList } from "./usePagedList";

export const userAssignedDeadlinesPrefix = getGetUserDeadlinesQueryKey({ page: 0 }).slice(0, -1);
export const threadDeadlinesPrefix = (id: number) => getGetDeadlinesQueryKey(id, { page: 0 }).slice(0, -1);
export const deadlineListsPrefix = getGetDeadlinesQueryKey(0, { page: 0 }).slice(0, -2);
export const userAssignedDeadlinesKey = [...userAssignedDeadlinesPrefix, "infinite"] as const;
export const threadDeadlinesKey = (id: number) => [...threadDeadlinesPrefix(id), "infinite"] as const;

export function useUserAssignedDeadlines(enabled: MaybeRefOrGetter<boolean> = true) {
  return usePagedList<DeadlineResponseWithRole, DeadlineModel>(() => ({
    key: userAssignedDeadlinesKey,
    enabled: toValue(enabled),
    fetchPage: (page, signal) => getUserDeadlines({ page }, { signal }),
    map: toDeadline,
  }));
}

export function useThreadDeadlines(threadId: MaybeRefOrGetter<number>) {
  return usePagedList<DeadlineResponseWithRole, DeadlineModel>(() => {
    const id = toValue(threadId);

    return {
      key: threadDeadlinesKey(id),
      enabled: id > 0,
      fetchPage: (page, signal) => getDeadlines(id, { page }, { signal }),
      map: toDeadline,
    };
  });
}

export function useDeadline(deadlineId: MaybeRefOrGetter<number>) {
  const enabled = useDefaultQueryEnabled();
  const query = useGetDeadline(deadlineId, () => ({
    query: { enabled: enabled() && toValue(deadlineId) > 0 },
  }));

  return { ...query, deadline: computed(() => (query.data.value ? toDeadline(query.data.value) : undefined)) };
}

export async function resolveDeadline(deadlineId: number, cache: ReturnType<typeof useQueryCache>) {
  const entry = cache.ensure(getGetDeadlineQueryOptions(deadlineId, { query: { enabled: true } }));
  const state = await cache.refresh(entry);

  return state.data ? toDeadline(state.data) : null;
}

export function useDeadlineAssignees(deadlineId: MaybeRefOrGetter<number>) {
  const enabled = useDefaultQueryEnabled();
  const query = useGetDeadlineAssignees(deadlineId, () => ({
    query: { enabled: enabled() && toValue(deadlineId) > 0 },
  }));

  return { ...query, members: computed(() => query.data.value?.map(toMember) ?? []) };
}
