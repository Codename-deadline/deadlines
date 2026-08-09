<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthForm from "@/components/auth/AuthForm.vue";
import AuthSelection from "@/components/auth/AuthSelection.vue";
import AuthChannelCard from "@/components/auth/common/AuthChannelCard.vue";
import emitter from "@/plugins/emitter";
import { useUserStore } from "@/stores/UserStore";
import type { AuthMethod } from "@/types/api";

const selectedAuthChannel = ref<AuthMethod | null>(null);
const isSignUpSelected = ref<boolean>(false);
const wasBotPageViewed = ref<boolean>(false);

const authState = computed<"sign-in" | "sign-up" | "bot-page" | "form">(() => {
  if (!isSignUpSelected.value) {
    if (!selectedAuthChannel.value) return "sign-in";
    return "form";
  }

  if (!selectedAuthChannel.value) return "sign-up";
  if (!wasBotPageViewed.value) return "bot-page";

  return "form";
});

emitter.on("resetAuthProgress", () => {
  wasBotPageViewed.value = false;
  selectedAuthChannel.value = null;
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
if (route.path.includes("auth") && userStore.isAvailable) {
  router.push({ path: "/" });
}
</script>

<template>
  <div class="w-full h-lvh flex items-center justify-center">
    <AuthSelection
      v-if="authState === 'sign-in' || authState === 'sign-up'"
      v-model:is-sign-up="isSignUpSelected"
      @channel-selected="(value) => selectedAuthChannel = value"
    />
    <AuthChannelCard
      v-else-if="authState === 'bot-page' && selectedAuthChannel"
      :auth-channel="selectedAuthChannel"
      @close="wasBotPageViewed = true"
    />
    <AuthForm
      v-else-if="authState === 'form' && selectedAuthChannel"
      :method="selectedAuthChannel" 
      :is-sign-up="isSignUpSelected"
    />
  </div>
</template>
