<script setup lang="ts">
import { Language as LanguageIcon } from "@vicons/fa";
import { NButton, NDropdown } from "naive-ui";
import type { DropdownMixedOption } from "naive-ui/es/dropdown/src/interface";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { LanguageSchema } from "@/api/schemas/common/LanguageSchema";
import { patchUser } from "@/api/user";
import { useApi } from "@/composables/useApi";
import { useLoading } from "@/composables/useLoading";
import { tLanguageOptions } from "@/locales/utils";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { useUserStore } from "@/stores/UserStore";

defineProps<{
  enableLabel?: boolean
}>()

const { t } = useI18n();
const userStore = useUserStore();
const { makeRequest } = useApi();
const { isLoading: isSaving, withLoading } = useLoading();
const localizationStore = useLocalizationStore();


const languageOptions = computed<DropdownMixedOption[]>(() => tLanguageOptions(t));

const handleLanguageChange = async (key: string | number) => {
  const parsedLanguage = LanguageSchema.safeParse(key);
  if (!parsedLanguage.success || parsedLanguage.data === localizationStore.language || isSaving.value) return;

  const previousLanguage = localizationStore.language;
  localizationStore.setLanguage(parsedLanguage.data);

  if (!userStore.isAvailable) return;
  const response = await withLoading(() => makeRequest(() => patchUser({ language: parsedLanguage.data })));
  if (!response.ok) localizationStore.setLanguage(previousLanguage);
};
</script>

<template>
  <n-dropdown
    trigger="click"
    placement="bottom"
    :options="languageOptions"
    @select="handleLanguageChange"
  >
    <n-button
      text
      :loading="isSaving"
      :aria-label="t('actions.change-language')" 
      :title="t('actions.change-language')" 
    >
      <Icon size="32">
        <LanguageIcon />
      </Icon>
      <div v-if="enableLabel" class="ml-2">{{ t(`language.${localizationStore.language.toLowerCase()}`) }}</div>
    </n-button>
  </n-dropdown>
</template>
