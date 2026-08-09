<script setup lang="ts">
import { NTabPane, NTabs } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { getPendingInvitations, getSentInvitations } from "@/api/invitation";
import GlobalFooter from "@/components/home/common/GlobalFooter.vue";
import GlobalHeader from "@/components/home/common/GlobalHeader.vue";
import SectionHeader from "@/components/home/common/SectionHeader.vue";
import InvitationList from "@/components/home/invitations/InvitationList.vue";

const { t } = useI18n();
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
        <n-tab-pane name="received" :tab="t('scopes.invitation.received')" />
        <n-tab-pane name="sent" :tab="t('scopes.invitation.sent')" />
      </n-tabs>
      <div class="mt-3 mb-4">
        <InvitationList
          v-show="activeTab === 'received'"
          :fetcher="getPendingInvitations"
          :reset="true"
          variant="received"
        />
        <InvitationList
          v-show="activeTab === 'sent'"
          :fetcher="getSentInvitations"
          :reset="true"
          variant="sent"
        />
      </div>
    </div>
    <global-footer />
  </section>
</template>
