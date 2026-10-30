<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NCard, NDivider, NForm, NFormItem, NInput, NUpload, NUploadDragger, type UploadFileInfo, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { AttachmentModel } from "@/api/adapters/attachment";
import QueryError from "@/components/home/common/QueryError.vue";
import UserAvatar from "@/components/home/common/UserAvatar.vue";
import PropertyValue from "@/components/PropertyValue.vue";
import { useAttachment, useAttachmentMutations } from "@/composables/useDeadlineAttachments";
import { useRequestError } from "@/composables/useRequestError";
import { tFormError } from "@/locales/utils";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { msToReadable } from "@/utils/date";
import { formatBytes } from "@/utils/files";

const props = defineProps<{ attachment: AttachmentModel }>();
const emit = defineEmits<{
  close: [];
}>();

const { t, locale } = useI18n();
const message = useMessage();
const localizationStore = useLocalizationStore();
const displayError = useRequestError();

const detail = useAttachment(() => props.attachment.id);
const attachment = computed(() => detail.attachment.value ?? props.attachment);
const mutations = useAttachmentMutations(() => props.attachment.attachedTo);
const isSubmitting = computed(() => mutations.patch.isLoading.value || mutations.replace.isLoading.value);

const formRef = ref<FormInst | null>(null);
const formModel = ref<{ filename: string; file: File | null }>({ filename: props.attachment.filename, file: null });
const uploadFileList = computed<UploadFileInfo[]>(() => {
  if (!formModel.value.file) return [];
  return [{ id: "attachment", name: formModel.value.file.name, status: "finished", file: formModel.value.file }];
});
const formRules: FormRules = {
  filename: [{ required: true, renderMessage: () => tFormError(t, "filename"), trigger: ["input", "blur"] }],
};

const handleFileListUpdate = (files: UploadFileInfo[]) => {
  formModel.value.file = files[0]?.file ?? null;
};

const handleSave = () => {
  if (isSubmitting.value) return;

  formRef.value?.validate(async (errors) => {
    if (errors) return;

    const attachmentId = props.attachment.id;
    const { filename, file } = formModel.value;

    try {
      if (filename !== attachment.value.filename) {
        await mutations.patch.mutateAsync({ attachmentId, patchFileMetadataRequest: { filename } });
      }

      if (file) {
        await mutations.replace.mutateAsync({ attachmentId, replaceAttachmentBody: { file } });
      }

      message.success(t("scopes.deadline.attachment-updated"));
      emit("close");
    } catch (error) {
      displayError(error);
    }
  });
};

const readOnlyOptions = computed(() => [
  { selector: "mime-type", data: attachment.value.mimeType },
  { selector: "file-size", data: formatBytes(attachment.value.sizeBytes) },
  {
    selector: "uploaded-at",
    data: msToReadable(attachment.value.uploadedAt, locale.value, localizationStore.timeZone).long,
  },
]);
</script>

<template>
  <n-card :title="t('scopes.deadline.edit-attachment')" closable @close="emit('close')">
    <QueryError :error="detail.error.value" :loading="detail.isLoading.value" @retry="detail.refetch()" />
    <n-form ref="formRef" :model="formModel" :rules="formRules">
      <n-form-item :label="t('scopes.common.form-labels.filename')" path="filename">
        <n-input
          v-model:value="formModel.filename"
          :disabled="!attachment.permissions.update"
          class="rounded-lg!"
        />
      </n-form-item>
      <n-form-item
        v-if="attachment.permissions.update"
        :label="t('scopes.common.form-labels.file')"
        path="file"
      >
        <n-upload :file-list="uploadFileList" :max="1" :default-upload="false" @update:file-list="handleFileListUpdate">
          <n-upload-dragger>
            <div class="py-6 text-center description">
              {{ t("scopes.deadline.drop-replacement-file") }}
            </div>
          </n-upload-dragger>
        </n-upload>
      </n-form-item>
      <div class="rounded-lg border border-gray-200 w-full p-4">
        <div class="w-full flex flex-col space-y-2">
          <property-value
            v-for="option in readOnlyOptions"
            :key="option.selector"
            :property-selector="`scopes.common.form-labels.${option.selector}`"
          >
            <b>{{ option.data }}</b>
          </property-value>
          <n-divider class="my-2!"/>
          <property-value property-selector="scopes.common.form-labels.uploaded-by">
            <user-avatar
              :user="attachment.uploadedBy ?? { fullName: t('scopes.common.deleted-user'), username: '' }"
              :show-username="attachment.uploadedBy !== null"
            />
          </property-value>
        </div>
      </div>
    </n-form>
    <div v-if="attachment.permissions.update" class="mt-4 flex justify-end">
      <n-button
        role="button"
        type="info"
        class="rounded-lg!"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        @click="handleSave"
      >
        {{ t("actions.save") }}
      </n-button>
    </div>
  </n-card>
</template>
