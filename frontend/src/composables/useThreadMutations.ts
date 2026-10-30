import { useQueryCache } from "@pinia/colada";
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
import type { ThreadResponseWithRole } from "@/api/generated/models";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { clearThreadDeadlines, refreshDeadlineAccess } from "./deadlineCache";
import { clearQueryEntries, refreshQueryEntries, removeInfiniteQueryItems } from "./queryCache";
import { organizationsListPrefix } from "./useOrganizations";
import { organizationThreadsPrefix, threadPrefix, userAssignedThreadsPrefix } from "./useThreads";

type ParentContext = { organizationId: number };

export function useThreadMutations(organizationId: MaybeRefOrGetter<number>) {
  const cache = useQueryCache();
  const scope = useCurrentScopeStore();

  const captureParent = (): ParentContext => ({ organizationId: toValue(organizationId) });

  const refreshLists = (id: number) =>
    Promise.all([
      refreshQueryEntries(cache, { key: userAssignedThreadsPrefix }),
      refreshQueryEntries(cache, { key: organizationThreadsPrefix(id) }),
    ]);

  const refreshParent = (id: number) =>
    Promise.all([
      refreshQueryEntries(cache, { key: organizationsListPrefix }),
      refreshQueryEntries(cache, { key: getGetOrganizationMetadataQueryKey(id) }, "all"),
    ]);

  const refreshThread = (id: number, parent: number, assignees = false) =>
    Promise.all([
      refreshLists(parent),
      refreshQueryEntries(cache, { key: getGetThreadQueryKey(id) }, "all"),
      ...(assignees
        ? [
            refreshQueryEntries(cache, { key: getGetThreadAssigneesQueryKey(id, { page: 0 }).slice(0, -1) }),
            refreshDeadlineAccess(cache),
          ]
        : []),
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
        removeInfiniteQueryItems(
          cache,
          [userAssignedThreadsPrefix, threadPrefix],
          (item: ThreadResponseWithRole) => item.id === threadId,
        );

        for (const key of [
          getGetThreadQueryKey(threadId),
          getGetThreadAssigneesQueryKey(threadId, { page: 0 }).slice(0, -1),
        ]) {
          clearQueryEntries(cache, key);
        }

        if (scope.threadId === threadId || scope.deadline?.threadId === threadId) scope.exitScope("thread");
        return Promise.all([
          refreshLists(parent.organizationId),
          refreshParent(parent.organizationId),
          clearThreadDeadlines(cache, threadId),
        ]);
      },
    },
  });
  return { create, patch, remove, addAssignee, removeAssignee, role };
}
