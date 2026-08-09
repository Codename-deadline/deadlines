<script setup lang="ts">
import { NDivider } from 'naive-ui';
import { useI18n } from 'vue-i18n';

defineProps<{
  propertySelector: string;
  addDivider?: boolean;
}>();

const { t } = useI18n()
</script>

<template>
  <div class="w-full flex justify-between items-center">
    <span class="description">{{ t(propertySelector) }}</span>
    <span>
      <slot />
    </span>
  </div>
  <n-divider v-if="addDivider" class="mb-2! mt-1!" />
</template>
