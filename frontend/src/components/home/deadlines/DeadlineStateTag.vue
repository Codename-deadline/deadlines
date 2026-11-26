<script setup lang="ts">
import { NTag } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { EventState } from '@/types/state';

const { t } = useI18n();
const tagType: Record<EventState, "info" | "error" | "default"> = {
  open: "default",
  overdue: "error",
  completed: "info",
  upcoming: "info",
  occurred: "default",
};
defineProps<{
  state: EventState
}>()
</script>

<template>
<n-tag :type="tagType[state]" round :bordered="false" size="small">
  {{ t(`scopes.deadline.state.${state}`) }}
</n-tag>
</template>
