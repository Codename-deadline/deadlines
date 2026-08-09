<script setup lang="ts">
import { type FormInst, type FormRules, NAlert, NButton, NCard, NForm, NFormItem, NInput, useMessage } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { changePassword } from "@/api/auth";
import type { ChangePasswordRequest } from "@/api/schemas/auth/ChangePasswordRequest";
import { useApi } from "@/composables/useApi";
import { useLoading } from "@/composables/useLoading";
import { tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const message = useMessage();
const { makeRequest } = useApi();
const { isLoading: isSaving, withLoading } = useLoading();

const formRef = ref<FormInst | null>(null);
const formModel = ref<ChangePasswordRequest>({
  newPassword: "",
  oldPassword: ""
});
const formRules: FormRules = {
  newPassword: [
    { required: true, renderMessage: () => tFormError(t, "new-password"), trigger: ["input", "blur"] },
    {
      validator: (_, value: string) => {
        return value !== formModel.value.oldPassword;
      },
      renderMessage: () => t("profile.password.validation.password-match"),
      trigger: ["input", "blur"]
    }
  ]
};

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;

    const response = await withLoading(() => makeRequest(() => changePassword({
      newPassword: formModel.value.newPassword,
      oldPassword: !formModel.value.oldPassword?.trim() ? null : formModel.value.oldPassword
    })));
    if (!response.ok) return;

    message.success(t("profile.password.updated"));
    emitter.emit("signOut");
  });
};
</script>

<template>
  <n-card :title="t('profile.password.title')" closable @close="emit('close')">
    <n-alert type="warning" :bordered="false" class="mb-4">
      {{ t("profile.password.warning") }}
    </n-alert>
    <n-form ref="formRef" :model="formModel" :rules="formRules">
      <n-form-item :label="t('profile.password.old')" path="oldPassword">
        <n-input
          v-model:value="formModel.oldPassword"
          class="rounded-lg!"
          type="password"
        />
      </n-form-item>
      <n-form-item :label="t('profile.password.new')" path="newPassword">
        <n-input
          v-model:value="formModel.newPassword"
          class="rounded-lg!"
          type="password"
        />
      </n-form-item>
    </n-form>
    <div class="mt-4 flex justify-end">
      <n-button role="button" type="info" class="rounded-lg!" :loading="isSaving" @click="handleSave">
        {{ t("actions.change-password") }}
      </n-button>
    </div>
  </n-card>
</template>
