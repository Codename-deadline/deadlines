import { type EntryKey, setInfiniteQueryData, type UseInfiniteQueryData, useQueryCache } from "@pinia/colada";
import { type MaybeRefOrGetter, toValue } from "vue";
import { getGetOrganizationMetadataQueryKey } from "@/api/generated/endpoints/organizations/organizations";
import { useChangeThreadRole } from "@/api/generated/endpoints/roles/roles";
import {
  getGetThreadAssigneesQueryKey,
  getGetThreadQueryKey,
  useAddThreadAssignee,
  useCreateThread,
  useDeleteThread,
  usePatchThread,
  useRemoveThreadAssignee,
} from "@/api/generated/endpoints/threads/threads";
import type { PaginationResponseThreadResponseWithRole } from "@/api/generated/models";
import { QUERY_EMPTY_PENDING_STATE } from "@/plugins/api";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { organizationsListPrefix } from "./useOrganizations";
import { organizationThreadsPrefix, threadPrefix, userAssignedThreadsPrefix } from "./useThreads";

type ParentContext = { organizationId: number };

export function useThreadMutations(organizationId: MaybeRefOrGetter<number>) {
  const cache = useQueryCache();
  const scope = useCurrentScopeStore();

  const captureParent = (): ParentContext => ({ organizationId: toValue(organizationId) });

  const invalidate = (key: EntryKey, all = false) =>
    cache.invalidateQueries({ key }, all ? "all" : true).catch(() => {});
  const refreshLists = (id: number) =>
    Promise.all([invalidate(userAssignedThreadsPrefix), invalidate(organizationThreadsPrefix(id))]);
  const refreshParent = (id: number) =>
    Promise.all([invalidate(organizationsListPrefix), invalidate(getGetOrganizationMetadataQueryKey(id), true)]);
  const refreshThread = (id: number, parent: number, assignees = false) =>
    Promise.all([
      refreshLists(parent),
      invalidate(getGetThreadQueryKey(id), true),
      ...(assignees ? [invalidate(getGetThreadAssigneesQueryKey(id, { page: 0 }).slice(0, -1))] : []),
    ]);

  const create = useCreateThread({
    mutation: {
      onSuccess: (_, { organizationId }) => Promise.all([refreshLists(organizationId), refreshParent(organizationId)]),
    },
  });
  const patch = usePatchThread<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { threadId }, parent) => refreshThread(threadId, parent.organizationId),
    },
  });
  const addAssignee = useAddThreadAssignee<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { threadId }, parent) => refreshThread(threadId, parent.organizationId, true),
    },
  });
  const removeAssignee = useRemoveThreadAssignee<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { threadId }, parent) => refreshThread(threadId, parent.organizationId, true),
    },
  });
  const role = useChangeThreadRole<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { threadId }, parent) => refreshThread(threadId, parent.organizationId, true),
    },
  });
  const remove = useDeleteThread<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { threadId }, parent) => {
        for (const prefix of [userAssignedThreadsPrefix, threadPrefix]) {
          for (const entry of cache.getEntries({
            key: prefix,
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
                  data: page.data.filter((item) => item.id !== threadId),
                })),
              });
          }
        }
        for (const key of [
          getGetThreadQueryKey(threadId),
          getGetThreadAssigneesQueryKey(threadId, { page: 0 }).slice(0, -1),
        ]) {
          for (const entry of cache.getEntries({ key })) {
            cache.cancel(entry);
            entry.placeholderData = null;
            cache.setEntryState(entry, QUERY_EMPTY_PENDING_STATE);
            cache.invalidate(entry);
            if (!entry.active) cache.remove(entry);
          }
        }
        if (scope.threadId === threadId || scope.deadline?.threadId === threadId) scope.exitScope("thread");
        return Promise.all([refreshLists(parent.organizationId), refreshParent(parent.organizationId)]);
      },
    },
  });
  return { create, patch, remove, addAssignee, removeAssignee, role };
}
