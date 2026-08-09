<script setup lang="ts">
import { NTag } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { DeadlineState } from '@/types/state';

const { t } = useI18n();
const tagType: Record<DeadlineState, "info" | "error" | "default"> = {
  open: "default",
  overdue: "error",
  completed: "info",
};
defineProps<{
  state: DeadlineState
}>()
</script>

<template>
<n-tag :type="tagType[state]" round :bordered="false" size="small">
  {{ t(`scopes.deadline.state.${state}`) }}
</n-tag>
</template>
