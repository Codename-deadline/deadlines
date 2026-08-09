import { defineStore } from "pinia";
import { ref } from "vue";

export const useGlobalStateStore = defineStore("global-state", () => {
  const pendingReceivedInvitations = ref<number>(0);

  function resolveInvitation() {
    --pendingReceivedInvitations.value;
  }

  function $reset() {
    pendingReceivedInvitations.value = 0;
  }

  return { resolveInvitation, pendingReceivedInvitations, $reset };
});
