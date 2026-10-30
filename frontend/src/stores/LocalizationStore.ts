import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useCurrentUser } from "@/composables/users/useCurrentUser";
import { Language } from "@/types/Language";
import { detectTimeZone } from "@/utils/timeZone";

export const useLocalizationStore = defineStore(
  "localization",
  () => {
    const { user } = useCurrentUser();
    const localLanguage = ref<Language>(Language.ENGLISH);
    const language = computed(() => user.value?.language ?? localLanguage.value);
    const timeZone = computed(() => user.value?.timeZone ?? detectTimeZone());

    function setLanguage(newLanguage: Language) {
      localLanguage.value = newLanguage;
    }

    return { localLanguage, language, timeZone, setLanguage };
  },
  {
    persist: {
      key: "language-store",
      storage: typeof localStorage === "undefined" ? undefined : localStorage,
    },
  },
);
