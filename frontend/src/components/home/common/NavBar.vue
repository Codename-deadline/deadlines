<script setup lang="ts">
import { ClockRegular, Envelope, Tasks, Users } from "@vicons/fa";
import { ref } from "vue";
import type { MainSection, NavigationButtonConfig } from "@/types/navigation";
import NavButton from "./NavButton.vue";

const props = withDefaults(
  defineProps<{
    defaultSection?: MainSection;
  }>(),
  {
    defaultSection: "organizations",
  },
);
const emit = defineEmits<(e: "section-selected", section: MainSection) => void>();

const buttons: NavigationButtonConfig[] = [
  {
    section: "organizations",
    icon: Users,
  },
  {
    section: "threads",
    icon: Tasks,
  },
  {
    section: "deadlines",
    icon: ClockRegular,
  },
  {
    section: "invitations",
    icon: Envelope,
  },
];
const currentSection = ref<MainSection>(props.defaultSection);

const updateCurrentSection = (section: MainSection) => {
  currentSection.value = section;
  emit("section-selected", section);
};
</script>

<template>
  <nav class="
    w-full border-t border-border-default bg-surface flex justify-center py-2
    landscape-mobile:w-fit landscape-mobile:h-full
  ">
    <div class="
      w-full grid grid-flow-col px-2 gap-2 sm:w-3/4 sm:gap-4 md:w-2/3 lg:w-1/2 md:gap-6 xl:gap-8
      landscape-mobile:w-fit landscape-mobile:h-full landscape-mobile:grid-flow-row
    ">
      <nav-button
        v-for="button in buttons"
        :key="button.section"
        @click="updateCurrentSection"
        :text-selector="`navigation.buttons.${button.section.toLowerCase()}`"
        :icon="button.icon"
        :section="button.section"
        :is-active="currentSection === button.section"
        role="button"
      />
    </div>
  </nav>
</template>
