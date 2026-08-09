<script setup lang="ts">
import { toRef } from "@vueuse/core";
import { type FormInst, type FormRules, NForm, NFormItem, NInput, NSelect } from "naive-ui";
import { computed, type Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import * as apiAuth from "@/api/auth";
import type { SignUpRequest } from "@/api/schemas/auth/SignUpRequest";
import BaseAuthForm from "@/components/auth/common/BaseAuthForm.vue";
import LanguageTooltip from "@/components/common/LanguageTooltip.vue";
import TimezoneSelect from "@/components/common/TimezoneSelect.vue";
import { useApi } from "@/composables/useApi";
import { tFormError, tFormLabel, tLanguageOptions } from "@/locales/utils";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import type { AuthMethod } from "@/types/api";
import { displayApiError, displayFormErrors, redirectToOTP } from "@/utils";
import { isDigitOnlySequence } from "@/utils/validation";

const router = useRouter();
const { t } = useI18n();
const localizationStore = useLocalizationStore();
const { makeRequest } = useApi();

const props = defineProps<{
  method: AuthMethod;
}>();
const authMethod: Ref<AuthMethod> = toRef(() => props.method);

const signUpFormRef = ref<FormInst | null>(null);
const signUpFormRules: FormRules = {
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
  fullName: [{ required: true, renderMessage: () => tFormError(t, "full-name"), trigger: ["input", "blur"] }],
  language: [{ required: true, renderMessage: () => tFormError(t, "language"), trigger: ["input", "blur"] }],
  timeZone: [{ required: true, renderMessage: () => tFormError(t, "time-zone"), trigger: ["change"] }],
};
const signUpFormData = ref<SignUpRequest>({
  identifier: "",
  channel: "",
  username: "",
  fullName: "",
  language: localizationStore.language,
  timeZone: localizationStore.timeZone,
});

const languageOptions = computed(() => tLanguageOptions(t));

const submitSignUpForm = async () => {
  signUpFormRef.value?.validate(async (errors) => {
    if (errors) return;
    signUpFormData.value.channel = authMethod.value.toUpperCase();
  
    const response = await makeRequest(() => apiAuth.signUp(signUpFormData.value), displayFormErrors, displayApiError);
    if (!response.ok) return;
  
    redirectToOTP(router, response.data.otpId, authMethod.value);
  })
};
</script>

<template>
  <BaseAuthForm
    @submit="submitSignUpForm"
    :is-sign-in="false"
    :auth-method="authMethod"
    button-selector="auth.sign-up.action"
    header-selector="auth.sign-up.header"
    description-selector="auth.sign-up.description"
  >
    <n-form ref="signUpFormRef" :model="signUpFormData" :rules="signUpFormRules">
      <div class="landscape-mobile:flex gap-6">
        <div class="flex-1">
          <n-form-item :label="t(`auth.sign-up.fields.identifier.${authMethod.toLowerCase()}`)" path="identifier">
            <n-input v-model:value="signUpFormData.identifier" :placeholder="t('auth.sign-up.fields.identifier.placeholder')"/>
          </n-form-item>
          <n-form-item :label="t('auth.sign-up.fields.username.label')" path="username">
            <n-input v-model:value="signUpFormData.username" type="text" :placeholder="t('auth.sign-up.fields.username.placeholder')"/>
          </n-form-item>
          <n-form-item :label="t('auth.sign-up.fields.fullName.label')" path="fullName">
            <n-input v-model:value="signUpFormData.fullName" type="text" :placeholder="t('auth.sign-up.fields.fullName.placeholder')"/>
          </n-form-item>
        </div>
        <div class="flex-1">
          <n-form-item path="language">
            <template #label>
              <div class="flex gap-1 items-center">
                <div>{{ t('auth.sign-up.fields.language.label') }}</div>
                <language-tooltip />
              </div>
            </template>
            <n-select v-model:value="signUpFormData.language" :options="languageOptions"/>
          </n-form-item>
          <n-form-item :label="t('auth.sign-up.fields.time-zone')" path="timeZone">
            <timezone-select v-model:value="signUpFormData.timeZone" />
          </n-form-item>
        </div>
      </div>
    </n-form>
  </BaseAuthForm>
</template>
