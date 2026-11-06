<script setup lang="ts">
import { ArrowLeft } from '@vicons/fa';
import { NButton, NIcon } from 'naive-ui';
import { useRouter } from 'vue-router';

const props = defineProps<{
  routeTo?: string;
  isName?: boolean;
  fallback?: string;
  fallbackIsName?: boolean;
}>();
const router = useRouter();

const redirect = () => {
  if (props.routeTo !== undefined) {
    return router.push(props.isName ? { name: props.routeTo } : { path: props.routeTo });
  }

  // Web history records an in-app predecessor, while direct visits have none.
  if (props.fallback !== undefined && !router.options.history.state.back) {
    return router.replace(
      props.fallbackIsName ? { name: props.fallback } : { path: props.fallback },
    );
  }

  router.back();
};
</script>

<template>
  <header class="flex justify-between">
    <n-button role="button" text @click="redirect()">
      <template #icon>
        <n-icon><arrow-left /></n-icon>
      </template>
      {{ $t("actions.back") }}
    </n-button>
    <slot/>
  </header>
</template>
