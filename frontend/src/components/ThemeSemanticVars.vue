<script setup lang="ts">
import { useThemeVars } from "naive-ui";
import { computed } from "vue";

const themeVars = useThemeVars();
const semanticVars = computed(() => ({
  "--app-color-surface": themeVars.value.baseColor,
  "--app-color-border": themeVars.value.borderColor,
  "--app-color-muted": themeVars.value.textColor3,
  "--app-color-accent-hover": themeVars.value.infoColorHover,
  "--app-color-accent-active": themeVars.value.infoColorPressed,
  "--app-color-on-accent": themeVars.value.baseColor,
  "--app-color-status-info": themeVars.value.infoColor,
  "--app-color-status-success": themeVars.value.successColor,
  "--app-color-status-error": themeVars.value.errorColor,
}));
</script>

<template>
  <div class="contents" :style="semanticVars">
    <slot />
  </div>
</template>
