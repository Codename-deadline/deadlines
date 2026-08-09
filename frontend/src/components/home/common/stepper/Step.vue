<script setup lang="ts">
import type { StepperStep } from '@/types/stepper';

// Title is fetched by the parent `Stepper` component
defineProps<{
  title: string;
  value: StepperStep
  nextStep?: () => void
  prevStep?: () => void
  changeStep?: (value: StepperStep) => void
  isFirstStep?: boolean
  isLastStep?: boolean
}>()
</script>

<template>
  <slot
    :next-step="nextStep"
    :prev-step="prevStep"
    :change-step="changeStep"
    :is-first-step="isFirstStep"
    :is-last-step="isLastStep"
  />
</template>
