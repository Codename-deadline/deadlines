<script setup lang="ts">
import {
    darkTheme,
    dateEnUS,
    dateRuRU,
    enUS,
    type GlobalThemeOverrides,
    NConfigProvider,
    NGlobalStyle,
    NMessageProvider,
    NNotificationProvider,
    ruRU,
    useOsTheme,
} from "naive-ui";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import CurrentScopeResolver from "./components/CurrentScopeResolver.vue";
import ThemeSemanticVars from "./components/ThemeSemanticVars.vue";
import GlobalEventHandler from "./GlobalEventHandler.vue";
import { useLocalizationStore } from "./stores/LocalizationStore";
import { useUserStore } from "./stores/UserStore";
import { Language } from "./types/Language";

const userStore = useUserStore();
const localizationStore = useLocalizationStore();
const { locale } = useI18n();

const themeOverridesLight: GlobalThemeOverrides = {
  common: {
    bodyColor: "#F4F8FD",
  },
};
const darkThemeOverrides: GlobalThemeOverrides = {};
const osTheme = useOsTheme();
const isDark = computed(() => osTheme.value === "dark");
const theme = computed(() => (isDark.value ? darkTheme : null));
const themeOverrides = computed(() => (isDark.value ? darkThemeOverrides : themeOverridesLight));

const currentLocale = computed(() => (localizationStore.language === Language.RUSSIAN ? ruRU : enUS));
const currentDateLocale = computed(() => (localizationStore.language === Language.RUSSIAN ? dateRuRU : dateEnUS));
watch(
  () => localizationStore.language,
  (newLanguage: Language) => {
    const localeName = newLanguage.toLowerCase();
    locale.value = localeName;
    document.documentElement.lang = localeName;
  },
  { immediate: true },
);

const route = useRoute();
const router = useRouter();
if (route.path.includes("auth") && userStore.isAvailable) {
  router.push({ path: "/" });
}

</script>

<template>
  <n-config-provider
    :theme="theme"
    :theme-overrides="themeOverrides"
    :locale="currentLocale"
    :date-locale="currentDateLocale"
  >
    <n-global-style/>
    <theme-semantic-vars>
      <n-notification-provider :max="3">
        <n-message-provider>
          <CurrentScopeResolver />
          <GlobalEventHandler />
        </n-message-provider>
      </n-notification-provider>
    </theme-semantic-vars>
  </n-config-provider>
</template>
