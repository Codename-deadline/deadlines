import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AuthMethod } from "@/types/api";

export const useAuthStateStore = defineStore("auth-state", () => {
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

  const $patch = (data: { isSignUp?: boolean; authChannel?: AuthMethod; wasBotPageClosed?: boolean } = {}) => {
    if (data.isSignUp) isSignUpSelected.value = data.isSignUp;
    if (data.authChannel) selectedAuthChannel.value = data.authChannel;
    if (data.wasBotPageClosed) wasBotPageViewed.value = data.wasBotPageClosed;
  };

  const $reset = () => {
    wasBotPageViewed.value = false;
    selectedAuthChannel.value = null;
  };

  return {
    selectedAuthChannel,
    isSignUpSelected,
    wasBotPageViewed,
    authState,
    $patch,
    $reset,
  };
});
