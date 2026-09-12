<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  scopeId: number;
  organizationTitle?: string;
  threadTitle?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <p class="space-x-1 text-muted">
    <span>{{ t("scopes.common.id") }}: {{ scopeId }}</span>
    <span v-if="organizationTitle || threadTitle">&bull;</span>
    <span v-if="organizationTitle">{{ organizationTitle }}</span>
    <span v-if="organizationTitle && threadTitle">&bull;</span>
    <span v-if="threadTitle">{{ threadTitle }}</span>
  </p>
</template>
