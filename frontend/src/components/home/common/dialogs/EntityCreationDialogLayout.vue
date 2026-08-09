<script setup lang="ts">
import { NCard } from 'naive-ui';
import { capitalize, computed, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import Stepper from '@/components/home/common/stepper/Stepper.vue';
import { SCOPE_TYPE_KEY } from '@/constants/providerKeys';
import emitter from '@/plugins/emitter';
import type { ScopeType } from '@/types/scope';

const props = defineProps<{
  scopeType: ScopeType;
}>()
const { t } = useI18n();

const title = computed(() =>
  `${capitalize(t("actions.create"))} ${t(`scopes.${props.scopeType}.name`)}`
)

provide(SCOPE_TYPE_KEY, props.scopeType);
</script>

<template>
  <n-card :title="title" closable @close="emitter.emit('closeCreateEntityDialog')">
    <Stepper :value="1"><slot></slot></Stepper>
  </n-card>
</template>
