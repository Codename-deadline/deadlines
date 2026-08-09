<script setup lang="ts">
import { Download, Eye, Paperclip, Plus, TrashAlt } from '@vicons/fa';
import { NButton, NCard, NEmpty, NIcon, NPopconfirm, NTag, NTooltip } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { DeadlineAttachment } from '@/api/schemas/deadline-attachment/common/DeadlineAttachment';
import SkeletonGrid from '@/components/home/common/SkeletonGrid.vue';
import { formatBytes } from '@/utils/files';

defineProps<{
  canCreateAttachments: boolean;
  attachments: DeadlineAttachment[];
  loading?: boolean;
}>()
const emit = defineEmits<{
  create: [];
  edit: [attachment: DeadlineAttachment];
  download: [attachment: DeadlineAttachment];
  preview: [attachment: DeadlineAttachment];
  delete: [attachment: DeadlineAttachment];
}>();
const { t } = useI18n();
</script>

<template>
  <n-card class="card">
    <header class="flex justify-between">
      <h2 class="text-xl">{{ t("scopes.deadline.attachments") }}</h2>
      <n-tag class="rounded-lg!" size="small">{{ attachments.length }} {{ t("scopes.deadline.files") }}</n-tag>
    </header>
    <div class="flex justify-center my-3">
      <n-button
        v-if="canCreateAttachments"
        @click="emit('create')"
        class="w-full! sm:w-fit! rounded-lg!"
        role="button"
        type="info"
      >
        <template #icon>
          <NIcon>
            <plus/>
          </NIcon>
        </template>
        {{ t("actions.create") }}
      </n-button>
    </div>
    <div class="grid grid-cols-1">
      <SkeletonGrid :show="loading" :count="3" :card-height="68.4" />
      <div class="col-start-1 row-start-1 space-y-4">
        <button
          v-for="attachment in attachments"
          :key="attachment.id"
          type="button"
          class="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:cursor-pointer hover:bg-blue-100/50"
          @click="emit('edit', attachment)"
        >
          <div class="flex min-w-0 items-center">
            <n-icon :size="22" class="ml-2 mr-4 description">
              <paperclip/>
            </n-icon>
            <div class="min-w-0">
              <div class="truncate font-medium">{{ attachment.filename }}</div>
              <div class="description text-sm">{{ attachment.mimeType }} &bull; {{ formatBytes(attachment.sizeBytes) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <n-tooltip>
              <template #trigger>
                <n-button role="button" text @click.stop="emit('download', attachment)">
                  <template #icon>
                    <n-icon><download /></n-icon>
                  </template>
                </n-button>
              </template>
              {{ t("actions.download") }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button role="button" text @click.stop="emit('preview', attachment)">
                  <template #icon>
                    <n-icon><eye /></n-icon>
                  </template>
                </n-button>
              </template>
              {{ t("actions.preview") }}
            </n-tooltip>
            <n-popconfirm @positive-click="emit('delete', attachment)">
              <template #trigger>
                <n-button
                  v-if="attachment.permissions.delete"
                  @click.stop="() => undefined"
                  type="error"
                  role="button"
                  text
                >
                  <template #icon>
                    <n-icon><trash-alt /></n-icon>
                  </template>
                </n-button>
              </template>
              {{ t("actions.confirmation", { action: t("actions.to-confirm.delete-entity", { entity: t("scopes.deadline.attachment").toLowerCase() }) }) }}
            </n-popconfirm>
          </div>
        </button>
      </div>
    </div>
     <n-empty v-if="!loading && attachments.length === 0" :description="t('scopes.deadline.no-attachments')"/> 
  </n-card>
</template>
