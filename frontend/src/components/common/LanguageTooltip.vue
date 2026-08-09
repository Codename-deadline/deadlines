<script setup lang="ts">
import { CircleQuestionMark } from '@lucide/vue';
import { NTooltip } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import { getPopoverTrigger } from '@/utils/flags';

const { t } = useI18n();
</script>

<template>
  <n-tooltip placement="bottom" :trigger="getPopoverTrigger()">
    <template #trigger>
      <CircleQuestionMark :size="16"/>
    </template>
    <div class="wrap-break-word max-w-[60vw]">{{ t('auth.sign-up.fields.language.tooltip') }}</div>
  </n-tooltip>
</template>
