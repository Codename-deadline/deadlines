<script setup lang="ts">
import { clamp } from '@vueuse/core';
import { NStep, NSteps } from 'naive-ui';
import { computed, Fragment, ref, useSlots, type VNode } from 'vue';
import type { StepperStep } from '@/types/stepper';

const props = defineProps<{ value: StepperStep }>();

const currentStep = ref<StepperStep>(props.value);
const changeStep = (value: StepperStep) => {
  currentStep.value = clamp(value, 1, steps.value.length);
}
const nextStep = () => changeStep(currentStep.value + 1);
const prevStep = () => changeStep(currentStep.value - 1);
const isFirstStep = computed<boolean>(() => currentStep.value === 1);
const isLastStep = computed<boolean>(() => currentStep.value === steps.value.length);

const slots = useSlots();
const flatSteps = (nodes: VNode[]): VNode[] =>
  nodes.flatMap(node =>
    node.type === Fragment ? flatSteps(node.children as VNode[]) : node
  )

const steps = computed(() => {
  return flatSteps(slots.default?.() || []);
})
const activeStep = computed(() => {
  return steps.value.find(vnode => vnode.props?.value === currentStep.value);
});

Fragment
</script>

<template>
  <n-steps :current="currentStep">
    <n-step
      v-for="(vnode, index) in steps"
      :key="index"
      :title="vnode.props?.title"
    />
  </n-steps>

  <div class="mt-4">
    <component
      :is="activeStep"
      :next-step="nextStep"
      :prev-step="prevStep"
      :change-step="changeStep"
      :is-first-step="isFirstStep"
      :is-last-step="isLastStep"
    />
  </div>
</template>
