<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { type FormInst, type FormRules, NButton, NDivider, NForm, NFormItem, NInput, NPopconfirm, NTabPane, useMessage } from "naive-ui";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { type OrganizationListModel, toOrganizationRole } from "@/api/adapters/organization";
import type { MemberModel } from "@/api/adapters/user";
import type { UserScopeResponseRole as AnyRole } from "@/api/generated/models";
import EntityDialoglayout from "@/components/home/common/dialogs/EntityDialoglayout.vue";
import MembersTab from "@/components/home/common/dialogs/members/MembersTab.vue";
import UserInvitationInput from "@/components/home/common/forms/UserInvitationInput.vue";
import QueryError from "@/components/home/common/QueryError.vue";
import { useEntityEdit } from "@/composables/useEntityEdit";
import { useOrganizationMutations } from "@/composables/useOrganizationMutations";
import { useOrganization, useOrganizationMembers } from "@/composables/useOrganizations";
import { useRequestError } from "@/composables/useRequestError";
import { DEFAULT_MEMBERS_PAGE_SIZE } from "@/constants/defaults";
import { ORG_OWNER_ROLE } from "@/constants/roles";
import { tEntityActionConfirmation, tEntityToastAction, tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { normalizeUsername } from "@/utils/validation";
import ChangeOrganizationVisibilityDialog from "./ChangeOrganizationVisibilityDialog.vue";
import TransferOrganizationOwnershipDialog from "./TransferOrganizationOwnershipDialog.vue";

const props = defineProps<{ entity: OrganizationListModel }>();
const { t } = useI18n();
const message = useMessage();
const router = useRouter();
const displayError = useRequestError();
const mutations = useOrganizationMutations();
const scope = useCurrentScopeStore();
const detail = useOrganization(() => props.entity.id);

const { height } = useWindowSize();
const membersToLoad = height.value >= 550 ? DEFAULT_MEMBERS_PAGE_SIZE : 2;

const patchFormRef = ref<FormInst | null>(null);
const invitationFormRef = ref<FormInst | null>(null);

const activeView = ref<"edit" | "change-visibility" | "transfer-ownership">("edit");

const organization = computed(() => ({ ...props.entity, ...detail.organization.value }));
const isOrganizationPersonal = computed(() => organization.value.type === "PERSONAL");

const canManageMembers = computed(() => organization.value.permissions.manageRoles);
const canInvite = computed(() => organization.value.permissions.invite);

const memberPage = ref(0);
const membersQuery = useOrganizationMembers(() => props.entity.id, memberPage, membersToLoad);
// Reset current page to 0 on entity update
watch(() => props.entity.id, () => { memberPage.value = 0; });
// Ensure 0 < currentPage < totalPages (upperbound)
watch(membersQuery.totalPages, (pages) => {
  if (pages > 0 && memberPage.value >= pages) memberPage.value = pages - 1;
});

const { patchFormModel, patchFormRules, handlePatch } = useEntityEdit({
  scopeType: "organization",
  formRef: patchFormRef,
  initialFormModel: {
    title: props.entity.title,
    description: props.entity.description ?? ""
  },
  isLoading: mutations.patch.isLoading,
  patch: (model) => mutations.patch.mutateAsync({ organizationId: props.entity.id, patchOrganizationRequest: model }),
});

const invitationFormModel = ref<{ username: string; role: AnyRole }>({ username: "", role: "ORG_MEMBER" });
const invitationFormRules: FormRules = {
  username: [{ validator: (_, value: string) => Boolean(normalizeUsername(value)), renderMessage: () => tFormError(t, "username"), trigger: ["input", "blur"] }],
};
const handleInvitationSubmission = () => {
  if (mutations.invite.isLoading.value) return;
  invitationFormRef.value?.validate(async (errors) => {
    if (errors) return;
    try {
      await mutations.invite.mutateAsync({ organizationId: props.entity.id, memberInvitationRequest: {
        username: normalizeUsername(invitationFormModel.value.username), role: toOrganizationRole(invitationFormModel.value.role),
      } });
      invitationFormModel.value.username = "";
      message.success(t("scopes.toasts.member-invited"));
    } catch (error) { displayError(error); }
  });
};

const handleDelete = async () => {
  if (mutations.remove.isLoading.value) return;
  const wasCurrentScope = scope.organizationId === props.entity.id;
  try {
    await mutations.remove.mutateAsync({ organizationId: props.entity.id });

    emitter.emit("closeEditEntityDialog");
    message.success(tEntityToastAction(t, "organization", "deleted"));

    if (
      (wasCurrentScope && !scope.organizationId)
      || router.currentRoute.value.query.orgId === String(props.entity.id)
    ) {
      await router.push({ path: "/" });
    }
  } catch (error) {
    displayError(error);
  }
};
const handleRoleUpdate = async (member: MemberModel, role: AnyRole) => {
  if (member.role === role || mutations.role.isLoading.value)
    return;

  try {
    await mutations.role.mutateAsync({
      organizationId: props.entity.id,
      changeRoleRequest: {
        subjectUsername: member.user.username,
        newRole: toOrganizationRole(role),
      }
    });

    message.success(t("scopes.toasts.role-assigned"));
  } catch (error) {
    displayError(error);
  }
};
const handleRemoveMember = async (member: MemberModel) => {
  if (mutations.removeMember.isLoading.value) return;
  try {
    await mutations.removeMember.mutateAsync({
      organizationId: props.entity.id,
      memberUsername: member.user.username
    });

    message.success(t("scopes.toasts.member-removed"));
  } catch (error) {
    displayError(error);
  }
};
const handleOwnershipTransferred = () => emitter.emit("closeEditEntityDialog");
const handleVisibilityChanged = () => { activeView.value = "edit"; };
</script>

<template>
  <change-organization-visibility-dialog
    v-if="activeView === 'change-visibility'"
    class="max-w-lg"
    :entity="organization"
    @cancel="activeView = 'edit'"
    @changed="handleVisibilityChanged"
  />
  <transfer-organization-ownership-dialog
    v-else-if="activeView === 'transfer-ownership'"
    class="max-w-lg"
    :entity="organization"
    @cancel="activeView = 'edit'"
    @transferred="handleOwnershipTransferred"
  />
  <EntityDialoglayout
    v-else
    scope-type="organization"
    :title="organization.title"
    :users-to-load="membersToLoad"
  >
    <n-tab-pane name="settings" :tab="t('scopes.common.form-sections.settings')">
      <QueryError :error="detail.error.value" :loading="detail.isLoading.value" @retry="detail.refetch()" />
      <div class="landscape-mobile:flex">
        <n-form ref="patchFormRef" :model="patchFormModel" :rules="patchFormRules">
          <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
            <n-input
              :disabled="!organization.permissions.update"
              class="rounded-lg!"
              v-model:value="patchFormModel.title"
            />
          </n-form-item>
          <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
            <n-input
              :disabled="!organization.permissions.update"
              class="rounded-lg!"
              v-model:value="patchFormModel.description"
              type="textarea"
            />
          </n-form-item>
          <div>
            <n-button
              role="button"
              :disabled="!organization.permissions.update"
              :loading="mutations.patch.isLoading.value" @click="handlePatch"
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
              v-if="organization.permissions.update"
              role="button"
              @click="activeView = 'change-visibility'"
              class="rounded-lg!"
              type="error"
            >
              {{ t("scopes.organization.visibility.action") }}
            </n-button>
            <n-button
              v-if="!isOrganizationPersonal && organization.role === ORG_OWNER_ROLE"
              role="button"
              @click="activeView = 'transfer-ownership'"
              class="rounded-lg!"
              type="error"
            >
              {{ t("actions.transfer-org-ownership") }}
            </n-button>
            <n-popconfirm
              :disabled="!organization.permissions.delete"
              @positive-click="handleDelete"
              class="rounded-lg!"
            >
              <template #trigger>
                <n-button
                  :disabled="!organization.permissions.delete"
                  :loading="mutations.remove.isLoading.value"
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
        :members="membersQuery.members.value"
        :page="memberPage"
        :total-pages="membersQuery.totalPages.value"
        :loading="membersQuery.isLoading.value"
        :error="membersQuery.error.value"
        :is-saving="mutations.role.isLoading.value || mutations.removeMember.isLoading.value"
        @page-change="(page) => memberPage = page" @update-role="handleRoleUpdate" @remove-member="handleRemoveMember"
        @retry="membersQuery.refetch()"
        :members-stats="organization.stats.members"
        :can-manage-roles="canManageMembers"
        :my-role="entity.role"
      />
    </n-tab-pane>
    <n-tab-pane v-if="!isOrganizationPersonal && canInvite" name="invites" :tab="t('scopes.common.form-sections.invitations')">
      <n-form ref="invitationFormRef" :model="invitationFormModel" :rules="invitationFormRules">
        <n-form-item :label="t('scopes.common.form-labels.username')" path="username">
          <UserInvitationInput
            v-model:username="invitationFormModel.username"
            v-model:role="invitationFormModel.role"
            :show-invitation-button="true"
            :is-loading="mutations.invite.isLoading.value"
            @click="handleInvitationSubmission"
          />
        </n-form-item>
      </n-form>
    </n-tab-pane>
  </EntityDialoglayout>
</template>
