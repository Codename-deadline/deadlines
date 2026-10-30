<script setup lang="ts">
import { NForm, NFormItem, NInputOtp } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useOtpVerification } from "@/composables/useAuthentication";
import { useRequestError } from "@/composables/useRequestError";
import type { AuthMethod } from "@/types/auth";
import { isDigitOnlySequence } from "@/utils/validation";
import BaseAuthForm from "../common/BaseAuthForm.vue";

const { t } = useI18n();
const displayRequestError = useRequestError();

const props = defineProps<{
  otpId: string;
  authMethod: AuthMethod;
}>();
const emit = defineEmits<(e: "password-required", requestId: string) => void>();

const { mutateAsync: verifyOtp, isLoading: isSubmitting } = useOtpVerification((requestId) => {
  emit("password-required", requestId);
});
const otp = ref<string[]>([]);

const submitAuthForm = async () => {
  if (isSubmitting.value || otp.value.join("").length !== 6) return;

  try {
    await verifyOtp({ verifyOtpRequest: { id: props.otpId, code: otp.value.join("") } });
  } catch (error) {
    displayRequestError(error);
  }
};
</script>

<template>
  <BaseAuthForm
    @submit="submitAuthForm"
    :is-loading="isSubmitting"
    :is-disabled="otp.join('').length !== 6"
    :is-sign-in="true"
    :auth-method="authMethod"
    button-selector="auth.otp.action"
    header-selector="auth.otp.header"
    description-selector="auth.otp.description"
  >
    <n-form class="flex! justify-center!">
      <n-form-item :label="t('auth.otp.fields.otp')">
        <n-input-otp v-model:value="otp" :allow-input="isDigitOnlySequence" size="large"/>
      </n-form-item>
    </n-form>
  </BaseAuthForm>
</template>
