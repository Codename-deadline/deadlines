<script setup lang="ts">
import { NForm, NFormItem, NInputOtp } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import * as apiAuth from "@/api/auth";
import { useApi } from "@/composables/useApi";
import emitter from "@/plugins/emitter";
import { useTokenStore } from "@/stores/TokenStore";
import type { AuthMethod } from "@/types/api";
import { displayApiError, displayFormErrors } from "@/utils";
import { isDigitOnlySequence } from "@/utils/validation";
import BaseAuthForm from "../common/BaseAuthForm.vue";

const { t } = useI18n();
const { makeRequest } = useApi();
const tokenStore = useTokenStore();

const props = defineProps<{
  otpId: string;
  authMethod: AuthMethod;
}>();
const emit = defineEmits<(e: "password-required", requestId: string) => void>();

const otp = ref<string[]>([]);

const submitAuthForm = async () => {
  const otpCode: string = otp.value.join("");

  const response = await makeRequest(
    () => apiAuth.verifyOtp({ id: props.otpId, code: otpCode }),
    displayFormErrors,
    displayApiError,
  );
  if (!response.ok) return;

  if (response.data.passwordRequired) {
    // TODO: Show an error message
    if (!response.data.requestId) {
      // This will only happen if the server returns an invalid response
      console.error("Request id is missing");
      return;
    }
    console.log(response.data.requestId);
    emit("password-required", response.data.requestId);
  } else {
    const tokenPair = response.data.tokenPair;
    // TODO: Show an error message
    if (!tokenPair) {
      // This will only happen if the server returns an invalid response
      console.error("Token pair is missing");
      return;
    }
    tokenStore.updateTokens(tokenPair);
    emitter.emit("signUpCompleted");
  }
};
</script>

<template>
  <BaseAuthForm
    @submit="submitAuthForm"
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
