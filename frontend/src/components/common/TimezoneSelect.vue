<script setup lang="ts">
import { NSelect } from "naive-ui";
import { computed } from "vue";
import { detectTimeZone, getSupportedTimeZones, normalizeTimeZone, UTC_TIME_ZONE } from "@/utils/timeZone";

const props = defineProps<{
  disabled?: boolean;
}>();
const model = defineModel<string>("value", { required: true });

const detectedTimeZone = detectTimeZone();
const supportedTimeZones = getSupportedTimeZones();

const options = computed(() => {
  const values = new Set([...supportedTimeZones, UTC_TIME_ZONE, detectedTimeZone]);
  if (model.value) values.add(normalizeTimeZone(model.value));
  return [...values].sort((left, right) => left.localeCompare(right)).map((value) => ({ label: value, value }));
});

if (model.value === "UTC") model.value = normalizeTimeZone(model.value);
</script>

<template>
  <n-select
    v-model:value="model"
    :disabled="props.disabled"
    :options="options"
    filterable
  />
</template>
