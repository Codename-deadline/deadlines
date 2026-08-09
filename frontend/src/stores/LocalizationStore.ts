import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { Language } from "@/types/Language";
import { detectTimeZone } from "@/utils/timeZone";
import { useUserStore } from "./UserStore";

export const useLocalizationStore = defineStore(
  "localization",
  () => {
    const userStore = useUserStore();
    const localLanguage = ref<Language>(Language.ENGLISH);
    const language = computed(() => userStore.user?.language ?? localLanguage.value);
    const timeZone = computed(() => userStore.user?.timeZone ?? detectTimeZone());

    function setLanguage(newLanguage: Language) {
      localLanguage.value = newLanguage;
      userStore.updateLanguage(newLanguage);
    }

    return { localLanguage, language, timeZone, setLanguage };
  },
  {
    persist: {
      key: "language-store",
      storage: localStorage,
    },
  },
);
