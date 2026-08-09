<script setup lang="ts">
import { type FormInst, NButton, NDivider, NForm, NFormItem, NInput, NPopconfirm, NTabPane } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  deleteOrganization,
  getOrganizationMembers,
  inviteMemberToOrganization,
  patchOrganization,
  removeOrganizationMember,
} from "@/api/organization";
import { changeOrganizationMemberRole } from "@/api/roles";
import type { OrganizationWithStatsAndRole } from "@/api/schemas/organization/common/Organization";
import type { OrganizationType } from "@/api/schemas/organization/common/OrganizationType";
import { getUsersWithUsernameStartingWith } from "@/api/user";
import EntityDialoglayout from "@/components/home/common/dialogs/EntityDialoglayout.vue";
import MembersTab from "@/components/home/common/dialogs/members/MembersTab.vue";
import UserInvitationInput from "@/components/home/common/forms/UserInvitationInput.vue";
import { useEntityEdit } from "@/composables/useEntityEdit";
import { ORG_ADMIN_ROLE, ORG_OWNER_ROLE } from "@/constants/roles";
import { tEntityActionConfirmation } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import ChangeOrganizationVisibilityDialog from "./ChangeOrganizationVisibilityDialog.vue";
import TransferOrganizationOwnershipDialog from "./TransferOrganizationOwnershipDialog.vue";

const props = defineProps<{
  entity: OrganizationWithStatsAndRole;
}>();

const { t } = useI18n();

const patchFormRef = ref<FormInst | null>(null);
const invitationFormRef = ref<FormInst | null>(null);
const activeView = ref<"edit" | "change-visibility" | "transfer-ownership">("edit");
const isOrganizationPersonal = computed<boolean>(() => props.entity.type === 'PERSONAL');

const handleOwnershipTransferred = () => {
  props.entity.role = ORG_ADMIN_ROLE;
  props.entity.permissions.update = false;
  props.entity.permissions.delete = false;
  emitter.emit("closeEditEntityDialog");
};

const handleVisibilityChanged = (type: OrganizationType) => {
  props.entity.type = type;
  activeView.value = "edit";
};

const {
  patchFormModel,
  patchFormRules,
  handlePatch,
  handleDelete,
  invitationFormModel,
  invitationFormRules,
  handleInvitationSubmission,
  handleFetchMembers,
  handleRoleUpdate,
  handleRemoveMember,
  canManageMembers,
  canInvite,
  myRoles,
  membersToLoad,
} = useEntityEdit({
  scopeType: "organization",
  listType: "organizations",
  entity: props.entity,
  patchFormRef,
  invitationFormRef,
  managePermissionKey: "manageRoles",
  invitePermissionKey: "invite",
  memberStatKey: "members",
  defaultInvitationRole: "ORG_MEMBER",
  initialFormModel: {
    title: props.entity.title,
    description: props.entity.description
  },
  apiCalls: {
    patch: patchOrganization,
    delete: deleteOrganization,
    invite: inviteMemberToOrganization,
    fetchMembers: getOrganizationMembers,
    changeRole: changeOrganizationMemberRole,
    removeMember: removeOrganizationMember,
  },
});
</script>

<template>
  <change-organization-visibility-dialog
    v-if="activeView === 'change-visibility'"
    class="max-w-lg"
    :entity="entity"
    @cancel="activeView = 'edit'"
    @changed="handleVisibilityChanged"
  />
  <transfer-organization-ownership-dialog
    v-else-if="activeView === 'transfer-ownership'"
    class="max-w-lg"
    :entity="entity"
    @cancel="activeView = 'edit'"
    @transferred="handleOwnershipTransferred"
  />
  <EntityDialoglayout
    v-else
    scope-type="organization"
    :title="entity.title"
    :users-to-load="membersToLoad"
  >
    <n-tab-pane name="settings" :tab="t('scopes.common.form-sections.settings')">
      <div class="landscape-mobile:flex">
        <n-form ref="patchFormRef" :model="patchFormModel" :rules="patchFormRules">
          <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
            <n-input
              :disabled="!entity.permissions.update"
              class="rounded-lg!"
              v-model:value="patchFormModel.title"
            />
          </n-form-item>
          <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
            <n-input
              :disabled="!entity.permissions.update"
              class="rounded-lg!"
              v-model:value="patchFormModel.description"
              type="textarea"
            />
          </n-form-item>
          <div>
            <n-button
              role="button"
              :disabled="!entity.permissions.update"
              @click="handlePatch"
              class="rounded-lg! w-full!"
              type="info"
            >
              {{ t("actions.save") }}
            </n-button>
          </div>
        </n-form>
        <n-divider class="landscape-mobile:hidden!"/>
        <n-divider vertical class="hidden! landscape-mobile:block! landscape-mobile:h-auto!"
/>
        <section>
          <h3 class="text-lg">{{ t('actions.header') }}</h3>
          <div class="flex flex-col mt-2 space-y-3!">
            <n-button
              v-if="entity.permissions.update"
              role="button"
              @click="activeView = 'change-visibility'"
              class="rounded-lg!"
              type="error"
            >
              {{ t("scopes.organization.visibility.action") }}
            </n-button>
            <n-button
              v-if="!isOrganizationPersonal && entity.role === ORG_OWNER_ROLE"
              role="button"
              @click="activeView = 'transfer-ownership'"
              class="rounded-lg!"
              type="error"
            >
              {{ t("actions.transfer-org-ownership") }}
            </n-button>
            <n-popconfirm
              :disabled="!entity.permissions.delete"
              @positive-click="handleDelete"
              class="rounded-lg!"
            >
              <template #trigger>
                <n-button
                  :disabled="!entity.permissions.delete"
                  class="rounded-lg!"
                  type="error"
                >
                  {{ t("actions.delete") }}
                </n-button>
              </template>
              {{ tEntityActionConfirmation(t, "organization", "delete") }}
            </n-popconfirm>
          </div>
        </section>
      </div>
    </n-tab-pane>
    <n-tab-pane v-if="!isOrganizationPersonal" name="members" :tab="t('scopes.common.members')">
      <MembersTab
        :fetcher="handleFetchMembers"
        :update-member-role="handleRoleUpdate"
        :remove-member="handleRemoveMember"
        :members-stats="entity.stats.members"
        :can-manage-roles="canManageMembers"
        :my-role="myRoles.global ?? ''"
      />
    </n-tab-pane>
    <n-tab-pane v-if="!isOrganizationPersonal && canInvite" name="invites" :tab="t('scopes.common.form-sections.invitations')">
      <n-form ref="invitationFormRef" :model="invitationFormModel" :rules="invitationFormRules">
        <n-form-item :label="t('scopes.common.form-labels.username')" path="username">
          <UserInvitationInput
            v-model:username="invitationFormModel.username"
            v-model:role="invitationFormModel.role"
            :show-invitation-button="true"
            :usernames-fetcher="getUsersWithUsernameStartingWith"
            @click="handleInvitationSubmission"
          />
        </n-form-item>
      </n-form>
    </n-tab-pane>
  </EntityDialoglayout>
</template>
