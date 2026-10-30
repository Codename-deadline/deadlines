import { useMutation, useQueryCache } from "@pinia/colada";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { toAttachment } from "@/api/adapters/attachment";
import { downloadAttachment } from "@/api/downloadAttachment";
import {
  getGetAttachmentMetadataQueryKey,
  useDeleteAttachment,
  useGetAttachmentMetadata,
  usePatchAttachmentMetadata,
  useReplaceAttachment,
} from "@/api/generated/endpoints/attachments/attachments";
import {
  getGetDeadlineAttachmentsMetadataQueryKey,
  getGetDeadlineQueryKey,
  useCreateAttachment,
  useGetDeadlineAttachmentsMetadata,
} from "@/api/generated/endpoints/deadlines/deadlines";
import type { AttachmentResponse } from "@/api/generated/models";
import { clearQueryEntries } from "./deadlineCache";
import { deadlineListsPrefix, userAssignedDeadlinesPrefix } from "./useDeadlines";
import { useDefaultQueryEnabled } from "./useDefaultQueryEnabled";

export function useDeadlineAttachments(deadlineId: MaybeRefOrGetter<number>) {
  const enabled = useDefaultQueryEnabled();
  const query = useGetDeadlineAttachmentsMetadata(deadlineId, () => ({
    query: { enabled: enabled() && toValue(deadlineId) > 0 },
  }));

  return { ...query, attachments: computed(() => query.data.value?.map(toAttachment) ?? []) };
}

export function useAttachment(attachmentId: MaybeRefOrGetter<number>) {
  const enabled = useDefaultQueryEnabled();
  const query = useGetAttachmentMetadata(attachmentId, () => ({
    query: { enabled: enabled() && toValue(attachmentId) > 0 },
  }));

  return { ...query, attachment: computed(() => (query.data.value ? toAttachment(query.data.value) : undefined)) };
}

type ParentContext = { deadlineId: number };

export function useAttachmentMutations(deadlineId: MaybeRefOrGetter<number>) {
  const cache = useQueryCache();
  const captureParent = (): ParentContext => ({ deadlineId: toValue(deadlineId) });

  const refresh = (id: number, attachmentId?: number) =>
    Promise.all([
      cache.invalidateQueries({ key: getGetDeadlineAttachmentsMetadataQueryKey(id) }).catch(() => {}),
      cache.invalidateQueries({ key: getGetDeadlineQueryKey(id) }, "all").catch(() => {}),
      cache.invalidateQueries({ key: userAssignedDeadlinesPrefix }).catch(() => {}),
      cache.invalidateQueries({ key: deadlineListsPrefix }).catch(() => {}),
      ...(attachmentId === undefined
        ? []
        : [cache.invalidateQueries({ key: getGetAttachmentMetadataQueryKey(attachmentId) }, "all").catch(() => {})]),
    ]);

  const create = useCreateAttachment({
    mutation: {
      onSuccess: (_, { deadlineId }) => refresh(deadlineId),
    },
  });

  const patch = usePatchAttachmentMetadata<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { attachmentId }, parent) => refresh(parent.deadlineId, attachmentId),
    },
  });

  const replace = useReplaceAttachment<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { attachmentId }, parent) => refresh(parent.deadlineId, attachmentId),
    },
  });

  const remove = useDeleteAttachment<Error, ParentContext>({
    mutation: {
      onMutate: captureParent,
      onSuccess: (_, { attachmentId }, parent) => {
        const key = getGetDeadlineAttachmentsMetadataQueryKey(parent.deadlineId);
        const list = cache.getQueryData<AttachmentResponse[]>(key);
        if (list)
          cache.setQueryData(
            key,
            list.filter((item) => item.id !== attachmentId),
          );

        clearQueryEntries(cache, getGetAttachmentMetadataQueryKey(attachmentId));

        return refresh(parent.deadlineId);
      },
    },
  });

  return { create, patch, replace, remove };
}

export function useAttachmentDownload() {
  return useMutation({
    mutation: ({
      attachmentId,
      disposition,
      signal,
    }: {
      attachmentId: number;
      disposition: "attachment" | "inline";
      signal: AbortSignal;
    }) => downloadAttachment(attachmentId, disposition, { signal }),
  });
}
