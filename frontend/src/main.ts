import { Icon, IconConfigProvider } from "@vicons/utils";
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persistedstate";
import { createApp } from "vue";
import "./styles.css";

import { createI18n } from "vue-i18n";
import { fallbackLocale, getTranslation, Locale } from "@/locales/locales";
import router from "@/router/router";
import App from "./App.vue";
import { useLocalizationStore } from "./stores/LocalizationStore";

export const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersist);

app.use(pinia);
app.use(router);

const localizationStore = useLocalizationStore();
const i18n = createI18n({
  legacy: false,
  locale: localizationStore.language.toLowerCase(),
  fallbackLocale: fallbackLocale,
  messages: {
    [Locale.EN]: getTranslation(Locale.EN),
    [Locale.RU]: getTranslation(Locale.RU),
  },
});
app.use(i18n);

app.component("Icon", Icon);
app.component("IconConfigProvider", IconConfigProvider);

router.isReady().then(() => app.mount("#app"));
