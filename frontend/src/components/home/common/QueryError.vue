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
  <n-alert v-if="notification" type="error" :title="notification.title">
    <section class="space-y-3 flex flex-col justify-center">
      <div>{{ notification.content }}</div>
      <n-button
        class="ml-3"
        size="small"
        type="error"
        :loading="loading"
        :disabled="loading"
        @click="emit('retry')"
      >
        {{ t('actions.retry') }}
      </n-button>
    </section>
  </n-alert>
</template>
