<script setup lang="ts">
import { NCard, NDivider } from 'naive-ui';
</script>

<template>
  <n-card class="min-w-0 rounded-xl! shadow-sm hover:shadow-lg hover:cursor-pointer">
    <header>
      <slot name="header"></slot>
    </header>
    <slot name="body"></slot>
    <n-divider v-if="$slots.footer" class="my-3!" />
    <footer class="flex space-x-3 description">
      <slot name="footer"></slot>
    </footer>
  </n-card>
</template>
