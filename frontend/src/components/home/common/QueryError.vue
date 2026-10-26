<script setup lang="ts">
import { NAlert, NButton } from "naive-ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { requestErrorNotification } from "@/utils/requestError";

const props = defineProps<{ error: unknown; loading?: boolean }>();
const emit = defineEmits<{ retry: [] }>();
const { t, te } = useI18n();
const notification = computed(() => props.error ? requestErrorNotification(props.error, (key, params) => te(key) ? t(key, params ?? {}) : undefined) : undefined);
</script>

<template>
  <n-alert v-if="notification" type="error" :title="notification.title" class="my-3">
    {{ notification.content }}
    <n-button class="ml-3" size="small" :loading="loading" @click="emit('retry')">{{ t('actions.retry') }}</n-button>
  </n-alert>
</template>
