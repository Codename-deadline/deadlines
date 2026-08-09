<script setup lang="ts">
import { TrashAlt, UserFriends } from "@vicons/fa";
import { NButton, NIconWrapper, NTooltip } from 'naive-ui';
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { OrganizationInvitation } from '@/api/schemas/organization/invitation/Invitation';
import { useInvitationActions } from '@/composables/useInvitationActions';
import { useGlobalStateStore } from "@/stores/GlobalStateStore";
import { getRelativeTimeString } from '@/utils/date';
import { getPopoverTrigger } from '@/utils/flags';
import EntityCard from "../common/EntityCard.vue";
import RoleTag from '../common/RoleTag.vue';

const props = defineProps<{
  invitation: OrganizationInvitation;
  variant: "received" | "sent";
}>();

const { t, locale } = useI18n();
const { accept, decline, revoke } = useInvitationActions(props.variant);
const globalStateStore = useGlobalStateStore();

const handleReceivedInvitationAction = async (action: 'accept' | 'decline', invitationId: number) => {
  switch (action) {
    case "accept":
      await accept(invitationId);
      break;
    case "decline":
      await decline(invitationId);
      break;
  }
  globalStateStore.resolveInvitation();
}

const createdAtRelative = computed(() => getRelativeTimeString(props.invitation.createdAt, locale.value));
</script>

<template>
<entity-card>
  <template #body>
    <div class="flex space-x-3">
      <span>
        <n-icon-wrapper color="" :size="48" :border-radius="16">
          <Icon color="white" size="24">
            <UserFriends/>
          </Icon>
        </n-icon-wrapper>
      </span>
      <span class="w-full flex flex-col">
        <div>
          <h3>{{ invitation.organization.title }}</h3>
          <span class="description flex flex-col sm:flex-row">
            <n-tooltip placement="bottom" :trigger="getPopoverTrigger()">
              <template #trigger>
                <div v-if="variant === 'received'" class="cursor-help"> {{ `@${invitation.invitedBy.username}` }} </div>
                <div v-else class="cursor-help"> {{ `@${invitation.invitedUser.username}` }} </div>
              </template>
              <span v-if="variant === 'received'">
                {{ t("scopes.invitation.invited-by") }} {{ invitation.invitedBy.fullName ?? t("scopes.common.name-not-provided") }}
              </span>
              <span v-else>
                {{ invitation.invitedUser.fullName ?? t("scopes.common.name-not-provided") }}
              </span>
            </n-tooltip>
            <span class="hidden sm:block mx-1">&bull;</span>
            <span>{{ createdAtRelative }}</span>
          </span>
          <role-tag class="my-1" scope-type="organization" :scope-role="invitation.role" />
        </div>
        <div class="flex w-full space-x-2! mt-3">
          <template v-if="variant === 'received'">
            <n-button
              type="info"
              class="flex-1 rounded-lg!"
              role="button"
              size="medium"
              @click.stop="handleReceivedInvitationAction('accept', invitation.id)"
            >
              {{ t("actions.accept") }}
            </n-button>
            <n-button
              type="error"
              class="flex-1 rounded-lg!"
              role="button"
              size="medium"
              @click.stop="handleReceivedInvitationAction('decline', invitation.id)"
            >
              {{ t("actions.decline") }}
            </n-button>
          </template>
          <n-button
            v-else
            type="error"
            class="flex-1 rounded-lg!"
            role="button"
            size="medium"
            @click.stop="revoke(invitation.id)"
          >
            <template #icon>
              <TrashAlt />
            </template>
            {{ t("actions.revoke") }}
          </n-button>
        </div>
      </span>
    </div>
  </template>
</entity-card>
</template>
