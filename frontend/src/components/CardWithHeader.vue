<script setup lang="ts">
import { NCard } from 'naive-ui';
import { useI18n } from 'vue-i18n';

defineProps<{
  headerSelector: string
}>();

const { t } = useI18n();
</script>

<template>
<n-card class="card">
  <header class="mb-3 flex items-center justify-between gap-4">
    <h3 class="text-lg"> {{ t(headerSelector) }}</h3>
    <slot name="header" />
  </header>
  <section>
    <slot/>
  </section>
</n-card>
</template>
