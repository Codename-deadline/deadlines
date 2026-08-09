<script setup lang="ts">
import { NTooltip } from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { msToReadable } from '@/utils/date';
import { getPopoverTrigger } from '@/utils/flags';

const props = defineProps<{
  time: number
  timeZone: string
  longFormat?: boolean
}>()

const { locale } = useI18n();
const normalizedTime = computed(() => msToReadable(props.time, locale.value, props.timeZone));
</script>

<template>
  <span v-if="longFormat"> {{ normalizedTime.long }} </span>
  <n-tooltip v-else placement="bottom" :trigger="getPopoverTrigger()">
    <template #trigger>
      <div class="cursor-help"> {{ normalizedTime.short }} </div>
    </template>
    <span> {{ normalizedTime.long }} </span>
  </n-tooltip>
</template>
