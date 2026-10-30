<script setup lang="ts">
import { NTabPane, NTabs } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import GlobalFooter from "@/components/home/common/GlobalFooter.vue";
import GlobalHeader from "@/components/home/common/GlobalHeader.vue";
import QueryError from "@/components/home/common/QueryError.vue";
import SectionHeader from "@/components/home/common/SectionHeader.vue";
import InvitationList from "@/components/home/invitations/InvitationList.vue";
import { usePendingInvitationCount } from "@/composables/useInvitations";

const { t } = useI18n();
const pendingInvitations = usePendingInvitationCount();

const activeTab = ref<"received" | "sent">("received");
</script>

<template>
  <section class="landscape-mobile:flex landscape-mobile:justify-center">
    <global-header />
    <div class="
      mt-4 sm:mt-8 layout-dynamic-padding
      landscape-mobile:w-8/10
    ">
      <section-header
        :section="'invitation'"
        :show-create-button="false"
        button-action="create"
      />
      <n-tabs v-model:value="activeTab" class="mt-3">
        <!-- https://github.com/tusen-ai/naive-ui/issues/8197 -->
        <n-tab-pane name="received">
          <template #tab>{{ t('scopes.invitation.received') }}</template>
        </n-tab-pane>
        <n-tab-pane name="sent">
          <template #tab>{{ t('scopes.invitation.sent') }}</template>
        </n-tab-pane>
      </n-tabs>
      <div class="mt-3 mb-4">
        <QueryError :error="pendingInvitations.error.value" :loading="pendingInvitations.isLoading.value" @retry="pendingInvitations.refetch()" />
        <InvitationList :key="activeTab" :variant="activeTab" />
      </div>
    </div>
    <global-footer />
  </section>
</template>
