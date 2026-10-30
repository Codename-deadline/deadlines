<script setup lang="ts">
import { Language as LanguageIcon } from "@vicons/fa";
import { NButton, NDropdown } from "naive-ui";
import type { DropdownMixedOption } from "naive-ui/es/dropdown/src/interface";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRequestError } from "@/composables/shared/useRequestError";
import { useCurrentUser, useUpdateCurrentUser } from "@/composables/users/useCurrentUser";
import { tLanguageOptions } from "@/locales/utils";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { Language } from "@/types/Language";

defineProps<{
  enableLabel?: boolean
}>()

const { t } = useI18n();
const { user } = useCurrentUser();
const { mutateAsync: updateUser, isLoading: isSaving } = useUpdateCurrentUser();
const displayRequestError = useRequestError();
const localizationStore = useLocalizationStore();


const languageOptions = computed<DropdownMixedOption[]>(() => tLanguageOptions(t));

const handleLanguageChange = async (key: string | number) => {
  if (key !== Language.ENGLISH && key !== Language.RUSSIAN) return;
  if (key === localizationStore.language || isSaving.value) return;

  try {
    if (user.value) await updateUser({ language: key });
    localizationStore.setLanguage(key);
  } catch (error) {
    displayRequestError(error);
  }
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
