import type { EntryKey, useQueryCache } from "@pinia/colada";
import { getGetAttachmentMetadataQueryKey } from "@/api/generated/endpoints/attachments/attachments";
import {
  getGetDeadlineAssigneesQueryKey,
  getGetDeadlineAttachmentsMetadataQueryKey,
  getGetDeadlineQueryKey,
} from "@/api/generated/endpoints/deadlines/deadlines";
import type { AttachmentResponse, DeadlineResponseWithRole } from "@/api/generated/models";
import { clearQueryEntries, refreshQueryEntries, removeInfiniteQueryItems } from "@/composables/shared/queryCache";
import { deadlineListsPrefix, threadDeadlinesPrefix, userAssignedDeadlinesPrefix } from "./useDeadlines";

type QueryCache = ReturnType<typeof useQueryCache>;
const detailsPrefix = getGetDeadlineQueryKey(0).slice(0, -1);
const attachmentsPrefix = getGetAttachmentMetadataQueryKey(0).slice(0, -1);

export function removeDeadlineRows(cache: QueryCache, matches: (item: DeadlineResponseWithRole) => boolean) {
  removeInfiniteQueryItems(cache, [userAssignedDeadlinesPrefix, deadlineListsPrefix], matches);
}

export function clearDeadline(cache: QueryCache, id: number) {
  // Clear individual attachment metadata as well as the deadline-owned collection.
  const attachments = cache.getQueryData<AttachmentResponse[]>(getGetDeadlineAttachmentsMetadataQueryKey(id)) ?? [];
  const attachmentIds = new Set(attachments.map((attachment) => attachment.id));

  for (const entry of cache.getEntries({ key: attachmentsPrefix })) {
    const dto = entry.state.value.data as AttachmentResponse | undefined;
    if (dto?.attachedTo === id) attachmentIds.add(dto.id);
  }

  for (const attachmentId of attachmentIds) clearQueryEntries(cache, getGetAttachmentMetadataQueryKey(attachmentId));

  for (const key of [
    getGetDeadlineQueryKey(id),
    getGetDeadlineAssigneesQueryKey(id),
    getGetDeadlineAttachmentsMetadataQueryKey(id),
  ]) {
    clearQueryEntries(cache, key);
  }
}

export function clearThreadDeadlines(cache: QueryCache, threadId: number) {
  const ids = new Set<number>();

  for (const entry of cache.getEntries({ key: detailsPrefix })) {
    const dto = entry.state.value.data as DeadlineResponseWithRole | undefined;
    if (dto?.threadId === threadId) ids.add(dto.id);
  }

  removeDeadlineRows(cache, (dto) => {
    if (dto.threadId !== threadId) return false;
    ids.add(dto.id);
    return true;
  });

  for (const id of ids) clearDeadline(cache, id);
  clearQueryEntries(cache, threadDeadlinesPrefix(threadId));

  return refreshQueryEntries(cache, { key: userAssignedDeadlinesPrefix });
}

export function refreshDeadlineAttachmentAccess(cache: QueryCache, deadlineId: number) {
  const keys: EntryKey[] = [getGetDeadlineAttachmentsMetadataQueryKey(deadlineId)];

  for (const entry of cache.getEntries({ key: attachmentsPrefix })) {
    const dto = entry.state.value.data as AttachmentResponse | undefined;
    if (dto?.attachedTo === deadlineId) keys.push(entry.key);
  }

  return Promise.all(keys.map((key) => refreshQueryEntries(cache, { key }, "all")));
}

/** Parent roles can change inherited deadline and attachment permissions. */
export function refreshDeadlineAccess(cache: QueryCache) {
  const prefixes = [
    userAssignedDeadlinesPrefix,
    deadlineListsPrefix,
    detailsPrefix,
    getGetDeadlineAssigneesQueryKey(0).slice(0, -1),
    getGetDeadlineAttachmentsMetadataQueryKey(0).slice(0, -1),
    attachmentsPrefix,
  ];

  return Promise.all(prefixes.map((key) => refreshQueryEntries(cache, { key }, "all")));
}
