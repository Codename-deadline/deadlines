<script setup lang="ts">
import { ArrowLeft, CalendarAlt } from "@vicons/fa";
import { NButton, NCard } from "naive-ui";
import { useI18n } from "vue-i18n";
import LanguageDropdown from "@/components/common/LanguageDropdown.vue";
import { APP_NAME } from "@/constants/app";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    headerSelector?: string;
    descriptionSelector?: string;
    showBackButton?: boolean;
  }>(),
  {
    headerSelector: "",
    descriptionSelector: "",
    showBackButton: false,
  },
);

const emit = defineEmits<(e: "back") => void>();
</script>

<template>
  <n-card class="max-w-[95vw] sm:max-w-4/5 md:max-w-3/5 lg:max-w-3/10 rounded-xl! shadow-lg! md:p-2 border!">
    <header class="flex flex-col items-center justify-center space-y-4">
      <div class="w-full flex justify-between" :class="{ 'justify-end!': !showBackButton }">
        <n-button v-if="showBackButton" role="button" text @click="emit('back')">
          <template #icon>
            <Icon>
              <ArrowLeft/>
            </Icon>
          </template>
          {{ t("actions.back") }}
        </n-button>
        <LanguageDropdown :enable-label="true"/>
      </div>
      <Icon size="48" class="
        hidden! md:block! mb-0!
        landscape-mobile:hidden!
      ">
        <CalendarAlt/>
      </Icon>
      <div class="flex flex-col items-center justify-center space-y-4">
        <h1 class="text-center mt-2 max-md:text-3xl">
          {{ headerSelector ? t(headerSelector) : APP_NAME }}
        </h1>
        <div v-if="descriptionSelector" class="mb-6 text-center description">
          {{ t(descriptionSelector) }}
        </div>
      </div>
    </header>
    <section class="card__body">
      <slot name="body"></slot>
    </section>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </n-card>
</template>
