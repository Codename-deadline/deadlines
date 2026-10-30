<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NForm, NFormItem, NInput, NPopconfirm, NSwitch, NTabPane, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { type DeadlineModel, toDeadlineRole, toPatchDeadlineRequest } from "@/api/adapters/deadline";
import type { MemberModel } from "@/api/adapters/user";
import type { UserScopeResponseRole as AnyRole } from "@/api/generated/models";
import EntityDialoglayout from "@/components/home/common/dialogs/EntityDialoglayout.vue";
import MembersTab from "@/components/home/common/dialogs/members/MembersTab.vue";
import UserInvitationInput from "@/components/home/common/forms/UserInvitationInput.vue";
import QueryError from "@/components/home/common/QueryError.vue";
import { useDeadlineMutations } from "@/composables/deadlines/useDeadlineMutations";
import { useDeadline, useDeadlineAssignees } from "@/composables/deadlines/useDeadlines";
import { useEntityEdit } from "@/composables/shared/useEntityEdit";
import { useRequestError } from "@/composables/shared/useRequestError";
import { useThread } from "@/composables/threads/useThreads";
import { MIN_DEADLINE_DURATION_MS } from "@/constants/forms";
import { MINUTE_MS } from "@/constants/time";
import { tEntityActionConfirmation, tEntityToastAction, tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { parsePositiveRouteId } from "@/utils/route";
import { normalizeUsername } from "@/utils/validation";
import DeadlineDatePicker from "./DeadlineDatePicker.vue";

const props = defineProps<{ entity: DeadlineModel }>();
const { t } = useI18n();
const message = useMessage();
const router = useRouter();
const displayError = useRequestError();
const scope = useCurrentScopeStore();
const localizationStore = useLocalizationStore();

const detail = useDeadline(() => props.entity.id);
const deadline = computed(() => detail.deadline.value ?? props.entity);
const mutations = useDeadlineMutations(() => props.entity.threadId);

const patchFormRef = ref<FormInst | null>(null);
const { patchFormModel, patchFormRules, handlePatch } = useEntityEdit({
  scopeType: "deadline",
  formRef: patchFormRef,
  initialFormModel: {
    title: props.entity.title,
    description: props.entity.description ?? "",
    due: props.entity.due as number | null,
    isCompleted: props.entity.isCompleted,
  },
  extraFormRules: {
    due: [
      { required: true, type: "number", renderMessage: () => tFormError(t, "due-date"), trigger: ["input", "blur"] },
      {
        validator: (_, value: number | null) => value === deadline.value.due || (value !== null && value >= Date.now() + MIN_DEADLINE_DURATION_MS),
        renderMessage: () => t("scopes.deadline.date-picker.minimum", { minutes: MIN_DEADLINE_DURATION_MS / MINUTE_MS }),
        trigger: ["change", "blur"],
      },
    ],
    isCompleted: [{ required: true, type: "boolean", renderMessage: () => tFormError(t, "is-completed"), trigger: ["input", "blur"] }],
  },
  isLoading: mutations.patch.isLoading,
  patch: (model) => mutations.patch.mutateAsync({
    deadlineId: props.entity.id,
    patchDeadlineRequest: toPatchDeadlineRequest({
      ...model,
      due: model.due === deadline.value.due ? undefined : model.due,
    }),
  }),
});

const handleDelete = async () => {
  if (mutations.remove.isLoading.value) return;

  const route = router.currentRoute.value;
  // scope's deadline id cannot be trusted, as it loades asynchronously and might be null (not yet loaded)
  const wasSelected = route.name === "Deadline" && parsePositiveRouteId(route.query.ddlId) === props.entity.id;
  const path = route.fullPath;

  try {
    await mutations.remove.mutateAsync({ deadlineId: props.entity.id });
    emitter.emit("closeEditEntityDialog");
    message.success(tEntityToastAction(t, "deadline", "deleted"));

    if (wasSelected && router.currentRoute.value.fullPath === path) {
      await router.push({ path: "/deadlines", query: { thrId: props.entity.threadId } });
    }
  } catch (error) {
    displayError(error);
  }
};

// This endpoint returns all assignees; it has no server pagination parameters.
const assignees = useDeadlineAssignees(() => props.entity.id);
const canManageMembers = computed(() => deadline.value.permissions.manageAssignees);
const handleRoleUpdate = async (member: MemberModel, role: AnyRole) => {
  if (member.role === role || mutations.role.isLoading.value) return;

  try {
    await mutations.role.mutateAsync({
      deadlineId: props.entity.id,
      changeRoleRequest: { subjectUsername: member.user.username, newRole: toDeadlineRole(role) },
    });
    message.success(t("scopes.toasts.role-assigned"));
  } catch (error) {
    displayError(error);
  }
};

const handleRemoveMember = async (member: MemberModel) => {
  if (mutations.removeAssignee.isLoading.value) return;

  try {
    await mutations.removeAssignee.mutateAsync({ deadlineId: props.entity.id, assigneeUsername: member.user.username });
    message.success(t("scopes.toasts.member-removed"));
  } catch (error) {
    displayError(error);
  }
};

const parentThread = useThread(() => props.entity.threadId);
const organizationId = computed(() => parentThread.thread.value?.organizationId ?? (
  scope.threadId === props.entity.threadId ? scope.organizationId : null
));

const invitationFormRef = ref<FormInst | null>(null);
const invitationFormModel = ref<{ username: string; role: AnyRole }>({ username: "", role: "DDL_ASSIGNEE" });
const invitationFormRules: FormRules = {
  username: [{
    validator: (_, value: string) => Boolean(normalizeUsername(value.trim())),
    renderMessage: () => tFormError(t, "username"),
    trigger: ["input", "blur"],
  }],
};

const handleInvitationSubmission = () => {
  if (mutations.addAssignee.isLoading.value) return;

  invitationFormRef.value?.validate(async (errors) => {
    if (errors) return;

    try {
      await mutations.addAssignee.mutateAsync({
        deadlineId: props.entity.id,
        addDeadlineAssigneeRequest: {
          username: normalizeUsername(invitationFormModel.value.username.trim()),
          role: toDeadlineRole(invitationFormModel.value.role),
        },
      });
      invitationFormModel.value.username = "";
      message.success(t("scopes.toasts.member-invited"));
    } catch (error) {
      displayError(error);
    }
  });
};
</script>

<template>
  <EntityDialoglayout
    scope-type="deadline"
    :title="deadline.title"
  >
    <n-tab-pane name="settings" :tab="t('scopes.common.form-sections.settings')" class="max-h-[80vh] overflow-y-auto">
      <QueryError :error="detail.error.value" :loading="detail.isLoading.value" @retry="detail.refetch()" />
      <n-form ref="patchFormRef" :model="patchFormModel" :rules="patchFormRules">
        <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
          <n-input
            v-model:value="patchFormModel.title"
            :disabled="!deadline.permissions.update"
            class="rounded-lg!"
          />
        </n-form-item>
        <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
          <n-input
            v-model:value="patchFormModel.description"
            :disabled="!deadline.permissions.update"
            class="rounded-lg!"
            type="textarea"
          />
        </n-form-item>
        <div class="flex-col sm:flex justify-around sm:gap-4">
          <n-form-item class="flex-2" :label="t('scopes.common.form-labels.due-date')" path="due">
            <deadline-date-picker
              v-model:value="patchFormModel.due"
              :disabled="!deadline.permissions.update"
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
              :disabled="!deadline.permissions.update"
              size="large"
            />
          </n-form-item>
        </div>
        <div class="
          grid grid-cols-3 px-4 mt-6
          landscape-mobile:mt-0 landscape-mobile:mb-4
        ">
          <n-popconfirm
            :disabled="!deadline.permissions.delete"
            @positive-click="handleDelete"
            class="rounded-lg!"
          >
            <template #trigger>
              <n-button
                role="button"
                :disabled="!deadline.permissions.delete"
                :loading="mutations.remove.isLoading.value"
                class="rounded-lg!"
                type="error"
              >
                {{ t("actions.delete") }}
              </n-button>
            </template>
            {{ tEntityActionConfirmation(t, "deadline", "delete") }}
          </n-popconfirm>
          <div></div>
          <n-button role="button" :disabled="!deadline.permissions.update" :loading="mutations.patch.isLoading.value" @click="handlePatch" class="rounded-lg!" type="info">
            {{ t("actions.save") }}
          </n-button>
        </div>
      </n-form>
    </n-tab-pane>
    <n-tab-pane name="members" :tab="t('scopes.common.members')">
      <MembersTab
        :members="assignees.members.value" :page="0" :total-pages="1"
        :loading="assignees.isLoading.value" :error="assignees.error.value"
        :is-saving="mutations.role.isLoading.value || mutations.removeAssignee.isLoading.value"
        :members-stats="deadline.stats.assignees"
        :can-manage-roles="canManageMembers"
        :my-role="deadline.globalRole ?? deadline.role ?? undefined"
        @update-role="handleRoleUpdate" @remove-member="handleRemoveMember" @retry="assignees.refetch()"
      />
    </n-tab-pane>
    <n-tab-pane
      v-if="canManageMembers"
      name="invites"
      :tab="t('scopes.common.form-sections.invitations')"
    >
      <n-form ref="invitationFormRef" :model="invitationFormModel" :rules="invitationFormRules">
        <n-form-item :label="t('scopes.common.form-labels.username')" path="username">
          <QueryError
            :error="parentThread.error.value"
            :loading="parentThread.isLoading.value"
            @retry="parentThread.refetch()"
          />
          <UserInvitationInput
            v-if="organizationId"
            :is-loading="mutations.addAssignee.isLoading.value"
            :show-invitation-button="true"
            :organization-id="organizationId ?? 0"
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
