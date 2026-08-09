import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { User } from "@/api/schemas/user/common/User";
import type { PatchUserRequest } from "@/api/schemas/user/patch/PatchUserRequest";
import type { Language } from "@/types/Language";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);

  const isAvailable = computed(() => user.value !== null);

  function updateLanguage(language: Language) {
    if (!user.value) return;
    user.value.language = language;
  }

  function setUser(u: User) {
    user.value = u;
  }

  function updateProfile(profile: PatchUserRequest) {
    if (!user.value) return;
    Object.assign(user.value, profile);
  }

  function $reset() {
    user.value = null;
  }

  return { user, isAvailable, setUser, updateLanguage, updateProfile, $reset };
});
