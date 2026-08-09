<script setup lang="ts">
import { NButton } from "naive-ui";
import { useI18n } from "vue-i18n";
import emitter from "@/plugins/emitter";
import type { AuthMethod } from "@/types/api";
import AuthCard from "./AuthCard.vue";

const { t } = useI18n();
const emit = defineEmits<(e: "submit") => void>();
const props = defineProps<{
  buttonSelector: string;
  headerSelector: string;
  descriptionSelector: string;
  isSignIn: boolean;
  authMethod: AuthMethod;
}>();
</script>

<template>
  <auth-card
    @back="() => emitter.emit('resetAuthProgress')"
    :show-back-button="true"
    :header-selector="headerSelector"
    :description-selector="descriptionSelector"
  >
    <template v-slot:body>
      <slot/>
    </template>
    <template v-slot:footer>
      <div class="flex flex-col items-center">
        <n-button role="button" type="info" class="w-full! rounded-lg! mt-1!" @click="emit('submit')">{{ t(buttonSelector) }}</n-button>
        <small class="mt-5 text-gray-500">
          {{ t("auth.method") }}
          {{ t(`auth.methods.${authMethod.valueOf().toLowerCase()}`) }}
        </small>
      </div>
    </template>
  </auth-card>
</template>
