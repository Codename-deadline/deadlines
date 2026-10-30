import { type EntryKey, useQueryCache } from "@pinia/colada";
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
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { clearDeadline, refreshDeadlineAttachmentAccess, removeDeadlineRows } from "./deadlineCache";
import { threadDeadlinesPrefix, userAssignedDeadlinesPrefix } from "./useDeadlines";
import { threadPrefix, userAssignedThreadsPrefix } from "./useThreads";

type ParentContext = { threadId: number };

export function useDeadlineMutations(threadId: MaybeRefOrGetter<number>) {
  const cache = useQueryCache();
  const scope = useCurrentScopeStore();
  const captureParent = (): ParentContext => ({ threadId: toValue(threadId) });

  const invalidate = (key: EntryKey, all = false) =>
    cache.invalidateQueries({ key }, all ? "all" : true).catch(() => {});

  const refreshLists = (id: number) =>
    Promise.all([invalidate(userAssignedDeadlinesPrefix), invalidate(threadDeadlinesPrefix(id))]);
  const refreshParent = (id: number) =>
    Promise.all([
      invalidate(getGetThreadQueryKey(id), true),
      invalidate(userAssignedThreadsPrefix),
      invalidate(threadPrefix),
    ]);
  const refreshDeadline = (id: number, parent: number, assignees = false) =>
    Promise.all([
      refreshLists(parent),
      invalidate(getGetDeadlineQueryKey(id), true),
      ...(assignees
        ? [invalidate(getGetDeadlineAssigneesQueryKey(id)), refreshDeadlineAttachmentAccess(cache, id)]
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
