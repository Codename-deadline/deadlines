<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { NMention } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useUsernameHints } from "@/composables/useUsernameHints";
import { normalizeUsername } from "@/utils/validation";
import QueryError from "../QueryError.vue";

const props = defineProps<{ organizationId?: number }>();
const { t } = useI18n();
const username = defineModel<string>();
const search = ref("");
const { usernames, error, isLoading: loading, retry } = useUsernameHints(search, () => props.organizationId);
const options = computed(() => usernames.value.map((value) => ({ label: value, value })));
const updateSearch = useDebounceFn((value: string) => { search.value = normalizeUsername(value); }, 250);
const handleSearch = (value: string) => {
  search.value = "";
  void updateSearch(value);
};
</script>

<template>
  <div class="flex-1">
  <n-mention
    v-model:value="username"
    @search="handleSearch"
    :options="options"
    :loading="loading"
    default-value="@"
    :placeholder="`@${t('scopes.common.mention.placeholder')}`"
  />
  <QueryError :error="error" :loading="loading" @retry="retry" />
  </div>
</template>
