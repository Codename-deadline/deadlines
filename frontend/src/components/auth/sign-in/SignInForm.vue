<script setup lang="ts">
import { toRef } from "@vueuse/core";
import { type FormInst, type FormRules, NForm, NFormItem, NInput } from "naive-ui";
import { type Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import * as apiAuth from "@/api/auth";
import type { SignInRequest } from "@/api/schemas/auth/SignInRequest";
import BaseAuthForm from "@/components/auth/common/BaseAuthForm.vue";
import { useApi } from "@/composables/useApi";
import { tFormError, tFormLabel } from "@/locales/utils";
import type { AuthMethod } from "@/types/api";
import { displayApiError, displayFormErrors, redirectToOTP } from "@/utils";
import { isDigitOnlySequence, normalizeUsername } from "@/utils/validation";

const { t } = useI18n();
const router = useRouter();
const { makeRequest } = useApi();

const props = defineProps<{
  method: AuthMethod;
}>();
const authMethod: Ref<AuthMethod> = toRef(() => props.method);

const signInFormRef = ref<FormInst | null>(null);
const signInFormRules: FormRules = {
  identifier: [
    { required: true, renderMessage: () => tFormError(t, "identifier"), trigger: ["input", "blur"] },
    {
      required: true,
      validator: (_, value: string) => isDigitOnlySequence(value),
      renderMessage: () => t("errors.validation.reasons.format.digits-only", {
        field: tFormLabel(t, "identifier")
      }),
      trigger: ["input", "blur"]
    }
  ],
  username: [{ required: true, renderMessage: () => tFormError(t, "username"), trigger: ["input", "blur"] }],
};
const signInData = ref<SignInRequest>({
  identifier: "",
  channel: "",
  username: "",
});

const submitSignInForm = async () => {
  signInFormRef.value?.validate(async (errors) => {
    if (errors) return;
    signInData.value.username = normalizeUsername(signInData.value.username)
    signInData.value.channel = authMethod.value.valueOf();
  
    const response = await makeRequest(() => apiAuth.signIn(signInData.value), displayFormErrors, displayApiError);
    if (!response.ok) return;
  
    redirectToOTP(router, response.data.otpId, authMethod.value);
  })
};
</script>

<template>
  <BaseAuthForm
    @submit="submitSignInForm"
    :is-sign-in="true"
    :auth-method="authMethod"
    button-selector="auth.sign-in.action"
    header-selector="auth.sign-in.header"
    description-selector="auth.sign-in.description"
  >
    <n-form ref="signInFormRef" :model="signInData" :rules="signInFormRules">
      <div class="landscape-mobile:flex gap-6">
        <n-form-item class="flex-1" :label="t('auth.sign-in.fields.identifier.telegram')" path="identifier">
          <n-input v-model:value="signInData.identifier" :placeholder="t('auth.sign-in.fields.identifier.placeholder')"/>
        </n-form-item>
        <n-form-item class="flex-2" :label="t('auth.sign-in.fields.username.label')" path="username">
          <n-input v-model:value="signInData.username" type="text" :placeholder="t('auth.sign-in.fields.username.placeholder')"/>
        </n-form-item>
      </div>
    </n-form>
  </BaseAuthForm>
</template>
