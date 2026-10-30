<script setup lang="ts">
import { type FormInst, type FormRules, NForm, NFormItem, NInput } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePasswordVerification } from "@/composables/auth/useAuthentication";
import { useRequestError } from "@/composables/shared/useRequestError";
import { tFormError } from "@/locales/utils";
import type { AuthMethod } from "@/types/auth";
import BaseAuthForm from "../common/BaseAuthForm.vue";

const { t } = useI18n();
const { mutateAsync: verifyPassword, isLoading: isSubmitting } = usePasswordVerification();
const displayRequestError = useRequestError();

const props = defineProps<{
  requestId: string;
  authMethod: AuthMethod;
}>();

const passwordFormRef = ref<FormInst | null>(null);
const passwordFormRules: FormRules = {
  password: [
    { required: true, renderMessage: () => tFormError(t, "password"), trigger: ["input", "blur"] },
  ]
};
const passwordFormData = ref<{ password: string }>({
  password: "",
});

const submitAuthForm = () => {
  if (isSubmitting.value) return;
  passwordFormRef.value?.validate(async (errors) => {
    if (errors) return;

    try {
      await verifyPassword({
        completePasswordRequest: { id: props.requestId, password: passwordFormData.value.password },
      });
    } catch (error) {
      displayRequestError(error);
    }
  });
};
</script>

<template>
  <BaseAuthForm
    @submit="submitAuthForm"
    :is-loading="isSubmitting"
    :is-sign-in="true"
    :auth-method="authMethod"
    button-selector="auth.password.action"
    header-selector="auth.password.header"
    description-selector="auth.password.description"
  >
    <n-form ref="passwordFormRef" :model="passwordFormData" :rules="passwordFormRules" class="flex! justify-center!">
      <n-form-item :label="t('auth.password.fields.password')" path="password">
        <n-input
          v-model:value="passwordFormData.password"
          type="password"
        />
      </n-form-item>
    </n-form>
  </BaseAuthForm>
</template>
