<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NCard, NDivider, NForm, NFormItem, NInput, NUpload, NUploadDragger, type UploadFileInfo, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { patchDeadlineAttachmentMetadata, putDeadlineAttachment } from "@/api/deadline-attachments";
import type { DeadlineAttachment } from "@/api/schemas/deadline-attachment/common/DeadlineAttachment";
import UserAvatar from "@/components/home/common/UserAvatar.vue";
import PropertyValue from "@/components/PropertyValue.vue";
import { useApi } from "@/composables/useApi";
import { useLoading } from "@/composables/useLoading";
import { tFormError } from "@/locales/utils";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { msToReadable } from "@/utils/date";
import { formatBytes } from "@/utils/files";

const props = defineProps<{ attachment: DeadlineAttachment }>();
const emit = defineEmits<{
  close: [];
}>();

const { t, locale } = useI18n();
const message = useMessage();
const localizationStore = useLocalizationStore();
const { makeRequest } = useApi();
const { isLoading: isSubmitting, withLoading } = useLoading();

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
  formRef.value?.validate(async (errors) => {
    if (errors) return;

    const res = await withLoading(async () => {
      if (formModel.value.filename !== props.attachment.filename) {
        const patchRes = await makeRequest(() =>
          patchDeadlineAttachmentMetadata(props.attachment.id, { filename: formModel.value.filename }),
        );
        if (!patchRes.ok) return patchRes;
      }

      if (formModel.value.file) {
        const putRes = await makeRequest(() => putDeadlineAttachment(props.attachment.id, formModel.value.file!));
        if (!putRes.ok) return putRes;
      }

      return { ok: true, data: undefined };
    });
    if (!res.ok) return;

    const attachment = props.attachment;
    attachment.filename = formModel.value.filename;
    
    const file = formModel.value.file;
    if (file) {
      attachment.mimeType = file.type;
      attachment.sizeBytes = file.size;
      attachment.uploadedAt = Date.now();
    }
    message.success(t("scopes.deadline.attachment-updated"));

    emit("close");
  });
};

const readOnlyOptions = computed(() => [
  { selector: "mime-type", data: props.attachment.mimeType },
  { selector: "file-size", data: formatBytes(props.attachment.sizeBytes) },
  {
    selector: "uploaded-at",
    data: msToReadable(props.attachment.uploadedAt, locale.value, localizationStore.timeZone).long,
  },
]);
</script>

<template>
  <n-card :title="t('scopes.deadline.edit-attachment')" closable @close="emit('close')">
    <n-form ref="formRef" :model="formModel" :rules="formRules">
      <n-form-item :label="t('scopes.common.form-labels.filename')" path="filename">
        <n-input v-model:value="formModel.filename" class="rounded-lg!" />
      </n-form-item>
      <n-form-item :label="t('scopes.common.form-labels.file')" path="file">
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
    <div class="mt-4 flex justify-end">
      <n-button role="button" type="info" class="rounded-lg!" :loading="isSubmitting" @click="handleSave">
        {{ t("actions.save") }}
      </n-button>
    </div>
  </n-card>
</template>
