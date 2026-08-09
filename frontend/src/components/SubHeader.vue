<script setup lang="ts">
import { ArrowLeft } from '@vicons/fa';
import { NButton, NIcon } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <header class="flex justify-between">
    <n-button role="button" text @click="router.back()">
      <template #icon>
        <n-icon><arrow-left /></n-icon>
      </template>
      {{ $t("actions.back") }}
    </n-button>
    <slot/>
  </header>
</template>
