<script setup lang="ts">
import { Cog } from '@vicons/fa';
import { NButton, NIcon } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { getAllDeadlineAssignees, patchDeadline } from '@/api/deadline';
import { deleteDeadlineAttachment, getAllDeadlineAttachments, getDeadlineAttachment } from '@/api/deadline-attachments';
import type { MemberWithRole } from '@/api/schemas/common/Member';
import type { DeadlineAttachment } from '@/api/schemas/deadline-attachment/common/DeadlineAttachment';
import GlobalHeader from '@/components/home/common/GlobalHeader.vue';
import EditDeadlineDialog from '@/components/home/deadlines/EditDeadlineDialog.vue';
import SubHeader from '@/components/SubHeader.vue';
import CreateDeadlineAttachmentDialog from '@/components/scopes/deadline/CreateDeadlineAttachmentDialog.vue';
import DeadlineAttachmentsCard from '@/components/scopes/deadline/cards/DeadlineAttachmentsCard.vue';
import DeadlineDescriptionCard from '@/components/scopes/deadline/cards/DeadlineDescriptionCard.vue';
import DeadlineDetailsCard from '@/components/scopes/deadline/cards/DeadlineDetailsCard.vue';
import EditDeadlineAttachmentDialog from '@/components/scopes/deadline/EditDeadlineAttachmentDialog.vue';
import { useApi } from '@/composables/useApi';
import { useLoading } from '@/composables/useLoading';
import emitter from '@/plugins/emitter';
import { useCurrentScopeStore } from '@/stores/CurrentScopeStore';
import { useUserStore } from '@/stores/UserStore';

const { makeRequest } = useApi();
const currentScopeStore = useCurrentScopeStore();
const userStore = useUserStore();

const { deadline } = storeToRefs(currentScopeStore);
const assignees = ref<MemberWithRole[]>([]);
const attachments = ref<DeadlineAttachment[]>([]);

const isEditingDeadline = ref<boolean>(false);
const isCreatingAttachment = ref<boolean>(false);
const attachmentToEdit = ref<DeadlineAttachment | null>(null);

const deadlineId = computed(() => deadline.value?.id ?? null);

const { isLoading: isLoadingAssignees, withLoading: withAssigneesLoading } = useLoading();
const fetchAssignees = async (ddlId: number) => {
  const res = await withAssigneesLoading(() => makeRequest(() => getAllDeadlineAssignees(ddlId)));
  if (!res.ok) return;
  assignees.value = res.data;
}

const { isLoading: isLoadingAttachments, withLoading: withAttachmentsLoading } = useLoading();
const fetchAttachments = async (ddlId: number) => {
  const res = await withAttachmentsLoading(() => makeRequest(() => getAllDeadlineAttachments(ddlId)));
  if (!res.ok) return;
  attachments.value = res.data;
}

const fetchAttachmentBlob = async (attachment: DeadlineAttachment, disposition: "attachment" | "inline") => {
  const res = await makeRequest(() => getDeadlineAttachment(attachment.id, disposition));
  return res.ok ? res.data : null;
};

const handleDownload = async (attachment: DeadlineAttachment) => {
  const blob = await fetchAttachmentBlob(attachment, "attachment");
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.filename;
  link.click();
  URL.revokeObjectURL(url);
};

const handlePreview = async (attachment: DeadlineAttachment) => {
  const blob = await fetchAttachmentBlob(attachment, "inline");
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};

const handleDeleteAttachment = async (attachment: DeadlineAttachment) => {
  const res = await makeRequest(() => deleteDeadlineAttachment(attachment.id));
  if (!res.ok) return;

  attachments.value = attachments.value.filter((item) => item.id !== attachment.id);
  if (deadline.value) {
    deadline.value.stats.attachments = Math.max(0, deadline.value.stats.attachments - 1);
  }
};

const handleAttachmentCreated = (attachmentId: number, filename: string, file: File) => {
  isCreatingAttachment.value = false;
  if (!deadlineId.value) return;

  attachments.value = [
    {
      id: attachmentId,
      filename,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedBy: {
        username: userStore.user?.username ?? "",
        fullName: userStore.user?.fullName ?? "",
      },
      attachedTo: deadlineId.value,
      uploadedAt: Date.now(),
      permissions: {
        update: true,
        delete: true
      }
    },
    ...attachments.value,
  ];
  if (deadline.value) {
    deadline.value.stats.attachments++;
  }
};

const { isLoading: isLoadingStatusChange, withLoading: withStatusLoading } = useLoading();
const handleDeadlineStatusChange = async (currentStatus: boolean) => {
  if (!deadlineId.value || !deadline.value) return;

  const res = await withStatusLoading(() =>
    makeRequest(() => patchDeadline(deadlineId.value!, {
      isCompleted: !currentStatus
    }))
  )
  if (!res.ok) return;

  deadline.value.isCompleted = !deadline.value.isCompleted;
}

const handleCloseEditEntityDialog = () => {
  isEditingDeadline.value = false;
};

emitter.on("closeEditEntityDialog", handleCloseEditEntityDialog);
onUnmounted(() => {
  emitter.off("closeEditEntityDialog", handleCloseEditEntityDialog);
});

onMounted(async () => {
  if (!deadlineId.value) return;

  await Promise.all([fetchAssignees(deadlineId.value), fetchAttachments(deadlineId.value)]);
})
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
      <section v-if="deadline" class="space-y-6 mt-4">
        <deadline-details-card
          @status-change="handleDeadlineStatusChange"
          :deadline="deadline"
          :assignees="assignees"
          :is-loading-assignees="isLoadingAssignees"
          :is-loading-status-change="isLoadingStatusChange"
        />
        <deadline-description-card :description="deadline?.description"/>
        <deadline-attachments-card
          :attachments="attachments"
          :loading="isLoadingAttachments"
          :can-create-attachments="deadline.permissions.manageAttachments"
          @create="isCreatingAttachment = true"
          @edit="attachmentToEdit = $event"
          @download="handleDownload"
          @preview="handlePreview"
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
        @click="isEditingDeadline = false; isCreatingAttachment = false; attachmentToEdit = null"
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
        @created="handleAttachmentCreated"
      />
      <edit-deadline-attachment-dialog
        v-if="attachmentToEdit"
        class="relative min-w-1/3! w-fit! h-fit! rounded-xl!"
        :attachment="attachmentToEdit"
        @close="attachmentToEdit = null"
      />
    </div>
  </Transition>
</template>
