import { defineStore } from "pinia";
import type {} from "pinia-plugin-persistedstate";
import { ref } from "vue";
import type { TokenPair } from "@/api/generated/models";

export const useTokenStore = defineStore(
  "tokens",
  () => {
    const accessToken = ref<string | null>(null);
    const refreshToken = ref<string | null>(null);
    const sessionVersion = ref<number>(0);

    let controller = new AbortController();

    function resetSession() {
      controller.abort(new DOMException("Session changed", "AbortError"));
      controller = new AbortController();
      sessionVersion.value++;
    }

    function updateTokens(tokenPair: TokenPair, newSession = true) {
      if (newSession) resetSession();
      accessToken.value = tokenPair.accessToken;
      refreshToken.value = tokenPair.refreshToken;
    }

    function invalidate({ access = false, refresh = false } = {}) {
      if (access) accessToken.value = null;
      if (refresh) refreshToken.value = null;
    }

    function $reset() {
      accessToken.value = null;
      refreshToken.value = null;
      resetSession();
    }

    return {
      accessToken,
      refreshToken,
      sessionVersion,
      sessionSignal: () => controller.signal,
      updateTokens,
      invalidate,
      $reset,
    };
  },
  {
    persist: {
      key: "token-store",
      // Test environment might not define localStorage
      storage: typeof localStorage === "undefined" ? undefined : localStorage,
      pick: ["accessToken", "refreshToken"],
    },
  },
);
