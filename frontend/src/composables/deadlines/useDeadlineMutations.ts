import { useQueryCache } from "@pinia/colada";
import { type MaybeRefOrGetter, toValue } from "vue";
import {
  getGetDeadlineAssigneesQueryKey,
  getGetDeadlineQueryKey,
  useAddDeadlineAssignee,
  useCreateDeadline,
  useDeleteDeadline,
  usePatchDeadline,
  useRemoveDeadlineAssignee,
} from "@/api/generated/endpoints/deadlines/deadlines";
import { useChangeDeadlineRole } from "@/api/generated/endpoints/roles/roles";
import { getGetThreadQueryKey } from "@/api/generated/endpoints/threads/threads";
import { refreshQueryEntries } from "@/composables/shared/queryCache";
import { threadPrefix, userAssignedThreadsPrefix } from "@/composables/threads/useThreads";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { clearDeadline, refreshDeadlineAttachmentAccess, removeDeadlineRows } from "./deadlineCache";
import { threadDeadlinesPrefix, userAssignedDeadlinesPrefix } from "./useDeadlines";

type ParentContext = { threadId: number };

export function useDeadlineMutations(threadId: MaybeRefOrGetter<number>) {
  const cache = useQueryCache();
  const scope = useCurrentScopeStore();
  const captureParent = (): ParentContext => ({ threadId: toValue(threadId) });

  const refreshLists = (id: number) =>
    Promise.all([
      refreshQueryEntries(cache, { key: userAssignedDeadlinesPrefix }),
      refreshQueryEntries(cache, { key: threadDeadlinesPrefix(id) }),
    ]);

  const refreshParent = (id: number) =>
    Promise.all([
      refreshQueryEntries(cache, { key: getGetThreadQueryKey(id) }, "all"),
      refreshQueryEntries(cache, { key: userAssignedThreadsPrefix }),
      refreshQueryEntries(cache, { key: threadPrefix }),
    ]);

  const refreshDeadline = (id: number, parent: number, assignees = false) =>
    Promise.all([
      refreshLists(parent),
      refreshQueryEntries(cache, { key: getGetDeadlineQueryKey(id) }, "all"),
      ...(assignees
        ? [
            refreshQueryEntries(cache, { key: getGetDeadlineAssigneesQueryKey(id) }),
            refreshDeadlineAttachmentAccess(cache, id),
          ]
        : []),
    ]);

  const create = useCreateDeadline({
    mutation: {
      onSuccess: (_, { threadId }) => Promise.all([refreshLists(threadId), refreshParent(threadId)]),
    },
  });

  const patch = usePatchDeadline<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { deadlineId }, parent) =>
        Promise.all([refreshDeadline(deadlineId, parent.threadId), refreshParent(parent.threadId)]),
    },
  });

  const addAssignee = useAddDeadlineAssignee<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { deadlineId }, parent) => refreshDeadline(deadlineId, parent.threadId, true),
    },
  });

  const removeAssignee = useRemoveDeadlineAssignee<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { deadlineId }, parent) => refreshDeadline(deadlineId, parent.threadId, true),
    },
  });

  const role = useChangeDeadlineRole<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { deadlineId }, parent) => refreshDeadline(deadlineId, parent.threadId, true),
    },
  });

  const remove = useDeleteDeadline<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { deadlineId }, parent) => {
        removeDeadlineRows(cache, (dto) => dto.id === deadlineId);
        clearDeadline(cache, deadlineId);

        if (scope.deadlineId === deadlineId) scope.exitScope("deadline");

        return Promise.all([refreshLists(parent.threadId), refreshParent(parent.threadId)]);
      },
    },
  });

  return { create, patch, remove, addAssignee, removeAssignee, role };
}
