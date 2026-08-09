<script setup lang="ts">
import { type FormInst, type FormRules, NForm, NFormItem, NInput } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import * as apiAuth from "@/api/auth";
import { useApi } from "@/composables/useApi";
import { tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import { useTokenStore } from "@/stores/TokenStore";
import type { AuthMethod } from "@/types/api";
import { displayApiError, displayFormErrors } from "@/utils";
import BaseAuthForm from "../common/BaseAuthForm.vue";

const { t } = useI18n();
const { makeRequest } = useApi();
const tokenStore = useTokenStore();

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

const submitAuthForm = async () => {
  passwordFormRef.value?.validate(async (errors) => {
    if (errors) return;
    const response = await makeRequest(
      () => apiAuth.verifyPassword({ id: props.requestId, password: passwordFormData.value.password }),
      displayFormErrors,
      displayApiError,
    );
    if (!response.ok) return;
  
    tokenStore.updateTokens(response.data);
    emitter.emit("signUpCompleted");
  })
};
</script>

<template>
  <BaseAuthForm
    @submit="submitAuthForm"
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
