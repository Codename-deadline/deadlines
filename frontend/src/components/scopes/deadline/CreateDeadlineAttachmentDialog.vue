<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NCard, NForm, NFormItem, NInput, NUpload, NUploadDragger, type UploadFileInfo, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAttachmentMutations } from "@/composables/useDeadlineAttachments";
import { useRequestError } from "@/composables/useRequestError";
import { tFormError } from "@/locales/utils";

const props = defineProps<{
  ddlId: number;
}>();
const emit = defineEmits<{
  created: [];
  close: [];
}>();

const { t } = useI18n();
const message = useMessage();
const displayError = useRequestError();

const { create } = useAttachmentMutations(() => props.ddlId);
const isSubmitting = create.isLoading;

const formRef = ref<FormInst | null>(null);
const formModel = ref<{ filename: string; file: File | null }>({ filename: "", file: null });
const formRules: FormRules = {
  filename: [{ required: true, renderMessage: () => tFormError(t, "filename"), trigger: ["input", "blur"] }],
  file: [
    {
      required: true,
      validator: () => Boolean(formModel.value.file),
      renderMessage: () => tFormError(t, "file"),
      trigger: ["change"],
    },
  ],
};

const uploadFileList = computed<UploadFileInfo[]>(() => {
  if (!formModel.value.file) return [];

  return [{ id: "attachment", name: formModel.value.file.name, status: "finished", file: formModel.value.file }];
});

const handleFileListUpdate = (files: UploadFileInfo[]) => {
  const file = files[0]?.file ?? null;
  formModel.value.file = file;
  if (file && !formModel.value.filename) {
    formModel.value.filename = file.name;
  }
};

const handleCreate = () => {
  if (isSubmitting.value) return;

  formRef.value?.validate(async (errors) => {
    if (errors || !formModel.value.file) return;

    try {
      await create.mutateAsync({
        deadlineId: props.ddlId,
        createAttachmentBody: { meta: { filename: formModel.value.filename }, file: formModel.value.file },
      });
      message.success(t("scopes.deadline.attachment-created"));
      emit("created");
    } catch (error) {
      displayError(error);
    }
  });
};
</script>

<template>
  <n-card :title="t('scopes.deadline.create-attachment')" closable @close="emit('close')">
    <n-form ref="formRef" :model="formModel" :rules="formRules">
      <n-form-item :label="t('scopes.common.form-labels.filename')" path="filename">
        <n-input v-model:value="formModel.filename" class="rounded-lg!" />
      </n-form-item>
      <n-form-item :label="t('scopes.common.form-labels.file')" path="file">
        <n-upload
          :file-list="uploadFileList"
          :max="1"
          :default-upload="false"
          @update:file-list="handleFileListUpdate"
        >
          <n-upload-dragger>
            <div class="py-6 text-center description">
              {{ t("scopes.deadline.drop-file") }}
            </div>
          </n-upload-dragger>
        </n-upload>
      </n-form-item>
    </n-form>
    <div class="mt-4 flex justify-end">
      <n-button role="button" type="info" class="rounded-lg!" :loading="isSubmitting" :disabled="isSubmitting" @click="handleCreate">
        {{ t("actions.create") }}
      </n-button>
    </div>
  </n-card>
</template>
