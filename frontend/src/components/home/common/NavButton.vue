<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { NBadge } from "naive-ui";
import { type Component, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobalStateStore } from "@/stores/GlobalStateStore";
import type { MainSection } from "@/types/navigation";

const props = defineProps<{
  section: MainSection;
  textSelector: string;
  icon: Component;
  isActive: boolean;
}>();

const emit = defineEmits<(e: "click", id: MainSection) => void>();
const globalStateStore = useGlobalStateStore();

const { t } = useI18n();
const { width, height } = useWindowSize();
const iconSize = computed(() => {
  // 640 is tied to the "sm" query
  if (width.value < 640 || height.value < 720) return 32;
  return 20;
})

console.log(globalStateStore.pendingReceivedInvitations)
</script>

<template>
  <button
    type="button"
    @click="emit('click', section)"
    class="rounded-lg ease-out duration-200 hover:cursor-pointer p-2 hover:bg-accent-hover hover:text-on-accent"
    :class="{ 'bg-accent-active text-on-accent': isActive }"
  >
    <div class="flex flex-col items-center space-y-0.5">
      <n-badge
        :value="section === 'invitations' ? globalStateStore.pendingReceivedInvitations : 0"
      >
        <Icon :size="iconSize">
          <component :is="icon"/>
        </Icon>
      </n-badge>
      <span class="
        hidden sm:block capitalize
        landscape-mobile:hidden
      ">{{ t(textSelector) }}</span>
    </div>
  </button>
</template>
