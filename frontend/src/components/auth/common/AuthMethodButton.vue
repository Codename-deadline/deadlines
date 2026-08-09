<script setup lang="ts">
import { NButton } from "naive-ui";
import type { Component } from "vue";
import { useI18n } from "vue-i18n";
import type { AuthMethod } from "@/types/api";

const props = defineProps<{
  method: AuthMethod;
  icon: Component;
}>();

const model = defineModel<AuthMethod | null>();
const { t } = useI18n();

const updateMethod = () => {
  model.value = props.method;
};
</script>

<template>
  <n-button role="button" @click="updateMethod" type="info" size="large">
    <template #icon>
      <Icon>
        <component :is="icon"/>
      </Icon>
    </template>
    <span>{{ t(`auth.methods.${method.valueOf().toLowerCase()}`) }}</span>
  </n-button>
</template>
