<script setup lang="ts">
import { NTag } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { AnyRole } from '@/api/common/AnyRole';
import { extractRoleFromString } from '@/locales/utils';
import type { ScopeType } from '@/types/scope';

defineProps<{
  scopeType: ScopeType
  scopeRole: AnyRole | null
}>();

const { t } = useI18n();
</script>

<template>
  <n-tag v-if="scopeRole" round :bordered="false" size="small">
    {{ t(extractRoleFromString(scopeType, scopeRole)) }}
  </n-tag>
</template>
