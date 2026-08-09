<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import type { MentionOption } from 'naive-ui';
import { NMention } from 'naive-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '@/composables/useApi';
import type { SafeApiCall } from '@/types/api';

const props = defineProps<{
  usernamesFetcher: (startsWith: string) => Promise<SafeApiCall<string[]>>
}>()

const { t } = useI18n();
const { makeRequest } = useApi();

const options = ref<MentionOption[]>([]);
const loading = ref<boolean>(false);
const username = defineModel<string>();

const fetchUsers = async (value: string) => {
  if (value.length < 2) {
    options.value = [];
    return;
  }

  loading.value = true;
  const res = await makeRequest(() => props.usernamesFetcher(value));
  loading.value = false;

  if (!res.ok) {
    options.value = [];
    return;
  }

  options.value = res.data.map((username) => ({ label: username, value: username }));
};

const handleSearch = useDebounceFn(fetchUsers, 250);
</script>

<template>
  <n-mention
    v-model:value="username"
    @search="handleSearch"
    :options="options"
    :loading="loading"
    default-value="@"
    :placeholder="`@${t('scopes.common.mention.placeholder')}`"
  />
</template>
