<script setup lang="ts">
import { CheckCircle, CircleDot } from '@lucide/vue';
import { NButton, NIcon } from 'naive-ui';
import { useI18n } from 'vue-i18n';

defineProps<{
  isCompleted: boolean,
  isLoading?: boolean
}>()
const emit = defineEmits<{
  click: []
}>()

const { t } = useI18n();
</script>

<template>
<n-button
  @click="emit('click')"
  class="w-full! sm:w-fit! rounded-lg!"
  :type="isCompleted ? 'default' : 'info'"
  :loading="isLoading"
  :disabled="isLoading"
  role="button"
>
  <template #icon>
    <NIcon>
      <CheckCircle v-if="!isCompleted"/>
      <CircleDot v-else/>
    </NIcon>
  </template>
  {{ t(`actions.mark-as-${isCompleted ? 'incomplete' : 'done'}`) }}
</n-button>
</template>
