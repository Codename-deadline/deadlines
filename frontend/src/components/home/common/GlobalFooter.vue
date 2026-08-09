<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/home/common/NavBar.vue";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import type { MainSection } from "@/types/navigation";

const route = useRoute();
const router = useRouter();
const currentScopeStore = useCurrentScopeStore();

const redirectToSection = (section: MainSection) => {
  // Invalidate current context
  // As the general "section" button was pressed, therefore
  // removing an entity selection if it was present
  switch (section) {
    case "organizations":
    case "threads":
    case "deadlines":
      currentScopeStore.$reset();
      break;
    default:
      break;
  }
  
  router.push({ path: `/${section}` });
};
</script>

<template>
  <div class="
    w-screen fixed bottom-0 z-40
    landscape-mobile:bottom-auto landscape-mobile:right-0 landscape-mobile:w-fit landscape-mobile:h-screen
  ">
    <nav-bar :default-section="route.path.split('/')[1] as MainSection" @section-selected="redirectToSection"/>
  </div>
</template>
