import { defineStore } from "pinia";
import { ref } from "vue";
import type { TokenPair } from "@/api/schemas/auth/common/TokenPair";
import type { JWT } from "@/api/schemas/common/JWT";

export const useTokenStore = defineStore(
  "tokens",
  () => {
    const accessToken = ref<JWT | null>(null);
    const refreshToken = ref<JWT | null>(null);

    function updateTokens(tokenPair: TokenPair) {
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
    }

    return { accessToken, refreshToken, updateTokens, invalidate, $reset };
  },
  {
    persist: {
      key: "token-store",
      storage: localStorage,
    },
  },
);
