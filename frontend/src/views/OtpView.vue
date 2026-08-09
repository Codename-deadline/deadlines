<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import OtpVerification from "@/components/auth/otp/OtpVerification.vue";
import PasswordVerification from "@/components/auth/otp/PasswordVerification.vue";
import emitter from "@/plugins/emitter";
import { useUserStore } from "@/stores/UserStore";
import { AuthMethod } from "@/types/api";

const route = useRoute();
const router = useRouter();

const otpId: string = route.query.id?.toString() || "";
const passwordRequestId = ref<string>("");

const authMethod: AuthMethod | undefined =
  AuthMethod[(route.query.method?.toString() || "") as keyof typeof AuthMethod];

if (!otpId || !authMethod) {
  router.push({ path: "/" });
}

emitter.on("resetAuthProgress", () => {
  router.push({ path: "/auth" });
});

const _updatePasswordRequestId = (requestId: string) => {
  passwordRequestId.value = requestId;
};

const userStore = useUserStore();
if (route.path.includes("auth") && userStore.isAvailable) {
  router.push({ path: "/" });
}
</script>

<template>
  <div class="w-full h-lvh flex items-center justify-center">
    <PasswordVerification v-if="passwordRequestId" :request-id="passwordRequestId" :auth-method="authMethod"/>
    <OtpVerification v-else @password-required="_updatePasswordRequestId" :otp-id="otpId" :auth-method="authMethod"/>
  </div>
</template>
