<script setup lang="ts">
import { Cog } from "@vicons/fa";
import { NButton, NIcon } from "naive-ui";
import { computed, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { AttachmentModel } from "@/api/adapters/attachment";
import GlobalHeader from "@/components/home/common/GlobalHeader.vue";
import QueryError from "@/components/home/common/QueryError.vue";
import EditDeadlineDialog from "@/components/home/deadlines/EditDeadlineDialog.vue";
import SubHeader from "@/components/SubHeader.vue";
import CreateDeadlineAttachmentDialog from "@/components/scopes/deadline/CreateDeadlineAttachmentDialog.vue";
import DeadlineAttachmentsCard from "@/components/scopes/deadline/cards/DeadlineAttachmentsCard.vue";
import DeadlineDescriptionCard from "@/components/scopes/deadline/cards/DeadlineDescriptionCard.vue";
import DeadlineDetailsCard from "@/components/scopes/deadline/cards/DeadlineDetailsCard.vue";
import EditDeadlineAttachmentDialog from "@/components/scopes/deadline/EditDeadlineAttachmentDialog.vue";
import { useAttachmentDownload, useAttachmentMutations, useDeadlineAttachments } from "@/composables/deadlines/useDeadlineAttachments";
import { useDeadlineMutations } from "@/composables/deadlines/useDeadlineMutations";
import { useDeadline, useDeadlineAssignees } from "@/composables/deadlines/useDeadlines";
import { useRequestError } from "@/composables/shared/useRequestError";
import { MINUTE_MS } from "@/constants/time";
import emitter from "@/plugins/emitter";
import { useTokenStore } from "@/stores/TokenStore";
import { parsePositiveRouteId } from "@/utils/route";

const route = useRoute();
const displayError = useRequestError();
const tokens = useTokenStore();

const deadlineId = computed(() => parsePositiveRouteId(route.query.ddlId) ?? 0);
const detail = useDeadline(deadlineId);
const deadline = detail.deadline;
const assignees = useDeadlineAssignees(deadlineId);
const attachments = useDeadlineAttachments(deadlineId);

const mutations = useDeadlineMutations(() => deadline.value?.threadId ?? 0);
const handleDeadlineStatusChange = async (currentStatus: boolean) => {
  if (!deadline.value || mutations.patch.isLoading.value) return;

  try {
    await mutations.patch.mutateAsync({ deadlineId: deadlineId.value, patchDeadlineRequest: { isCompleted: !currentStatus } });
  } catch (error) {
    displayError(error);
  }
};

const isEditingDeadline = ref<boolean>(false);
const handleCloseEditEntityDialog = () => { isEditingDeadline.value = false; };
emitter.on("closeEditEntityDialog", handleCloseEditEntityDialog);
onUnmounted(() => emitter.off("closeEditEntityDialog", handleCloseEditEntityDialog));

const isCreatingAttachment = ref<boolean>(false);
const attachmentToEditId = ref<number | null>(null);
const attachmentToEdit = computed(() => attachments.attachments.value.find((item) => item.id === attachmentToEditId.value));

const attachmentMutations = useAttachmentMutations(deadlineId);
const handleDeleteAttachment = async (attachment: AttachmentModel) => {
  if (attachmentMutations.remove.isLoading.value) return;

  try {
    await attachmentMutations.remove.mutateAsync({ attachmentId: attachment.id });
  } catch (error) {
    displayError(error);
  }
};

const download = useAttachmentDownload();
const lifetime = new AbortController();
onUnmounted(() => lifetime.abort());

const handleAttachmentFile = async (attachment: AttachmentModel, disposition: "attachment" | "inline") => {
  const signal = AbortSignal.any([tokens.sessionSignal(), lifetime.signal]);

  try {
    const blob = await download.mutateAsync({ attachmentId: attachment.id, disposition, signal });
    signal.throwIfAborted();

    const url = URL.createObjectURL(blob);
    if (disposition === "attachment") {
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.filename;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), MINUTE_MS);
    }
  } catch (error) {
    displayError(error);
  }
};
</script>

<template>
  <global-header/>
  <main class="
    my-8 flex justify-center
    landscape-mobile:ml-16
  ">
    <div class="w-9/10 sm:w-5/6 xl:w-2/3">
      <sub-header>
        <n-button v-if="deadline?.permissions.update" role="button" text @click="isEditingDeadline = true">
          <template #icon>
            <n-icon><cog /></n-icon>
          </template>
        </n-button>
      </sub-header>
      <QueryError :error="detail.error.value" :loading="detail.isLoading.value" @retry="detail.refetch()" />
      <section v-if="deadline" class="space-y-6 mt-4">
        <QueryError :error="assignees.error.value" :loading="assignees.isLoading.value" @retry="assignees.refetch()" />
        <deadline-details-card
          @status-change="handleDeadlineStatusChange"
          :deadline="deadline"
          :assignees="assignees.members.value"
          :is-loading-assignees="assignees.isLoading.value"
          :is-loading-status-change="mutations.patch.isLoading.value"
        />
        <deadline-description-card :description="deadline.description ?? undefined"/>
        <QueryError :error="attachments.error.value" :loading="attachments.isLoading.value" @retry="attachments.refetch()" />
        <deadline-attachments-card
          :attachments="attachments.attachments.value"
          :loading="attachments.isLoading.value"
          :can-create-attachments="deadline.permissions.manageAttachments"
          @create="isCreatingAttachment = true"
          @edit="attachmentToEditId = $event.id"
          @download="handleAttachmentFile($event, 'attachment')"
          @preview="handleAttachmentFile($event, 'inline')"
          @delete="handleDeleteAttachment"
        />
      </section>
    </div>
  </main>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100 backdrop-blur-sm"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="deadline && (isEditingDeadline || isCreatingAttachment || attachmentToEdit)"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/30 backdrop-blur-sm"
        @click="isEditingDeadline = false; isCreatingAttachment = false; attachmentToEditId = null"
      />
      <edit-deadline-dialog
        v-if="isEditingDeadline"
        class="relative min-w-1/3! w-fit! h-fit! rounded-xl!"
        :entity="deadline"
      />
      <create-deadline-attachment-dialog
        v-if="isCreatingAttachment && deadlineId"
        class="relative min-w-1/3! w-fit! h-fit! rounded-xl!"
        :ddl-id="deadlineId"
        @close="isCreatingAttachment = false"
        @created="isCreatingAttachment = false"
      />
      <edit-deadline-attachment-dialog
        v-if="attachmentToEdit"
        class="relative min-w-1/3! w-fit! h-fit! rounded-xl!"
        :attachment="attachmentToEdit"
        @close="attachmentToEditId = null"
      />
    </div>
  </Transition>
</template>
