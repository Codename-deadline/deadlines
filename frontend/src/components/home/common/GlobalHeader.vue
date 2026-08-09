<script lang="ts" setup>
import { User } from "@vicons/fa";
import { NButton } from "naive-ui";
import type { DropdownMixedOption } from "naive-ui/es/dropdown/src/interface";
import { useI18n } from "vue-i18n";
import LanguageDropdown from "@/components/common/LanguageDropdown.vue";
import { APP_NAME } from "@/constants/app";
import { Language } from "@/types/Language";

const { t } = useI18n();

const languageOptions: DropdownMixedOption[] = [];
Object.values(Language).forEach((languageUpperCase: string) => {
  languageOptions.push({
    label: t(`language.${languageUpperCase.toLowerCase()}`),
    key: languageUpperCase,
  });
});
</script>

<template>
  <header class="
    w-full border-b border-border-default bg-surface
    landscape-mobile:w-fit landscape-mobile:h-screen landscape-mobile:border-r landscape-mobile:border-b-0
    landscape-mobile:fixed landscape-mobile:top-0 landscape-mobile:left-0
  ">
    <div class="
      flex justify-between py-4 layout-dynamic-padding
      landscape-mobile:flex-col-reverse landscape-mobile:h-screen
    ">
      <router-link to="/">
        <h1 class="
          text-2xl
          landscape-mobile:[writing-mode:sideways-lr]
        ">{{ APP_NAME }}</h1>
      </router-link>
      <div class="
        flex items-center gap-4
        landscape-mobile:flex-col
      ">
        <LanguageDropdown />
        <RouterLink class="flex items-center" to="/profile">
          <n-button tag="div" text>
            <Icon size="20">
              <User/>
            </Icon>
          </n-button>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
