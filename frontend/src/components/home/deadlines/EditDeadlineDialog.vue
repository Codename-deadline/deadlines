<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NForm, NFormItem, NInput, NPopconfirm, NSwitch, NTabPane } from "naive-ui";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { addDeadlineAssignee, deleteDeadline, getAllDeadlineAssignees, patchDeadline, removeDeadlineAssignee } from "@/api/deadline";
import { getOrganizationMembersWithUsernameStartingWith } from "@/api/organization";
import { changeDeadlineAssigneeRole } from "@/api/roles";
import type { DeadlineWithRole } from "@/api/schemas/deadline/common/Deadline";
import { getThread } from "@/api/thread";
import EntityDialoglayout from "@/components/home/common/dialogs/EntityDialoglayout.vue";
import MembersTab from "@/components/home/common/dialogs/members/MembersTab.vue";
import UserInvitationInput from "@/components/home/common/forms/UserInvitationInput.vue";
import { useApi } from "@/composables/useApi";
import { useEntityEdit } from "@/composables/useEntityEdit";
import { MIN_DEADLINE_DURATION_MS } from "@/constants/forms";
import { tEntityActionConfirmation, tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { msToIso } from "@/utils/date";
import DeadlineDatePicker from "./DeadlineDatePicker.vue";

const props = defineProps<{
  entity: DeadlineWithRole;
}>();

if (!props.entity.globalRole) {
  emitter.emit("closeEditEntityDialog");
}

const { t } = useI18n();
const { makeRequest } = useApi();
const currentScopeStore = useCurrentScopeStore();
const localizationStore = useLocalizationStore();
const organizationId = ref<number | null>(
  currentScopeStore.thread?.id === props.entity.threadId
    ? currentScopeStore.thread.organizationId
    : null,
);

onMounted(async () => {
  if (organizationId.value) return;

  const response = await makeRequest(() => getThread(props.entity.threadId));
  if (!response.ok) return;
  organizationId.value = response.data.organizationId;
});

const extraFormRules: FormRules = {
  due: [
    { required: true, type: "number", renderMessage: () => tFormError(t, "due-date"), trigger: ["input", "blur"] },
    {
      validator: (_, value: number | null) =>
        value === props.entity.due || (value !== null && value >= Date.now() + MIN_DEADLINE_DURATION_MS),
      renderMessage: () => t("scopes.deadline.date-picker.minimum", { minutes: MIN_DEADLINE_DURATION_MS / 60000 }),
      trigger: ["change", "blur"],
    },
  ],
  isCompleted: [
    {
      required: true,
      type: "boolean",
      renderMessage: () => tFormError(t, "is-completed"),
      trigger: ["input", "blur"],
    },
  ],
};
const patchFormRef = ref<FormInst | null>(null);
const invitationFormRef = ref<FormInst | null>(null);

type DeadlineEditFormModel = {
  title: string;
  description: string;
  due: number | null;
  isCompleted: boolean;
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
} = useEntityEdit<DeadlineEditFormModel>({
  scopeType: "deadline",
  listType: "deadlines",
  entity: props.entity,
  patchFormRef,
  invitationFormRef,
  managePermissionKey: "manageAssignees",
  invitePermissionKey: "manageAssignees",
  memberStatKey: "assignees",
  defaultInvitationRole: "DDL_ASSIGNEE",
  initialFormModel: {
    title: props.entity.title,
    description: props.entity.description ?? "",
    due: props.entity.due,
    isCompleted: props.entity.isCompleted
  },
  extraFormRules,
  transformPatchData: (data) => ({
    ...data,
    due: data.due === props.entity.due ? undefined : msToIso(data.due!),
  }),
  syncFields: ["due", "isCompleted"],
  apiCalls: {
    patch: patchDeadline,
    delete: deleteDeadline,
    invite: addDeadlineAssignee,
    fetchMembers: (ddlId: number, _, __) => getAllDeadlineAssignees(ddlId),
    changeRole: changeDeadlineAssigneeRole,
    removeMember: removeDeadlineAssignee,
  },
});
</script>

<template>
  <EntityDialoglayout
    scope-type="deadline"
    :title="entity.title"
    :users-to-load="membersToLoad"
  >
    <n-tab-pane name="settings" :tab="t('scopes.common.form-sections.settings')" class="max-h-[80vh] overflow-y-auto">
      <n-form ref="patchFormRef" :model="patchFormModel" :rules="patchFormRules">
        <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
          <n-input
            v-model:value="patchFormModel.title"
            :disabled="!entity.permissions.update"
            class="rounded-lg!"
          />
        </n-form-item>
        <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
          <n-input
            v-model:value="patchFormModel.description"
            :disabled="!entity.permissions.update"
            class="rounded-lg!"
            type="textarea"
          />
        </n-form-item>
        <div class="flex-col sm:flex justify-around sm:gap-4">
          <n-form-item class="flex-2" :label="t('scopes.common.form-labels.due-date')" path="due">
            <deadline-date-picker
              v-model:value="patchFormModel.due"
              :disabled="!entity.permissions.update"
              :time-zone="localizationStore.timeZone"
            />
          </n-form-item>
          <n-form-item
            :label="t('scopes.common.form-labels.is-completed')"
            path="isCompleted"
            class="flex-1"
          >
            <n-switch
              class="long-switch w-full"
              v-model:value="patchFormModel.isCompleted"
              :disabled="!entity.permissions.update"
              size="large"
            />
          </n-form-item>
        </div>
        <div class="
          grid grid-cols-3 px-4 mt-6
          landscape-mobile:mt-0 landscape-mobile:mb-4
        ">
          <n-popconfirm
            :disabled="!entity.permissions.delete"
            @positive-click="handleDelete"
            class="rounded-lg!"
          >
            <template #trigger>
              <n-button
                role="button"
                :disabled="!entity.permissions.delete"
                class="rounded-lg!"
                type="error"
              >
                {{ t("actions.delete") }}
              </n-button>
            </template>
            {{ tEntityActionConfirmation(t, "deadline", "delete") }}
          </n-popconfirm>
          <div></div>
          <n-button role="button" @click="handlePatch" class="rounded-lg!" type="info">
            {{ t("actions.save") }}
          </n-button>
        </div>
      </n-form>
    </n-tab-pane>
    <n-tab-pane name="members" :tab="t('scopes.common.members')">
      <MembersTab
        :fetcher="handleFetchMembers"
        :update-member-role="handleRoleUpdate"
        :remove-member="handleRemoveMember"
        :members-stats="entity.stats.assignees"
        :can-manage-roles="canManageMembers"
        :my-role="myRoles.global ?? ''"
      />
    </n-tab-pane>
    <n-tab-pane
      v-if="canInvite && organizationId"
      name="invites"
      :tab="t('scopes.common.form-sections.invitations')"
    >
      <n-form ref="invitationFormRef" :model="invitationFormModel" :rules="invitationFormRules">
        <n-form-item :label="t('scopes.common.form-labels.username')" path="username">
          <UserInvitationInput
            :show-invitation-button="true"
            :usernames-fetcher="(usernamePrefix) => getOrganizationMembersWithUsernameStartingWith(organizationId!, usernamePrefix)"
            v-model:username="invitationFormModel.username"
            v-model:role="invitationFormModel.role"
            @click="handleInvitationSubmission"
          />
        </n-form-item>
      </n-form>
    </n-tab-pane>
  </EntityDialoglayout>
</template>

<style>
.long-switch > .n-switch__rail {
  width: 100%
}
</style>
