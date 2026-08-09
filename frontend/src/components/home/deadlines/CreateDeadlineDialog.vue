<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@vicons/fa";
import { type FormInst, type FormRules, NButton, NForm, NFormItem, NIcon, NInput } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { createDeadline } from "@/api/deadline";
import { getOrganizationMembersWithUsernameStartingWith } from "@/api/organization";
import type { DeadlineWithRole } from "@/api/schemas/deadline/common/Deadline";
import type { DeadlineRole } from "@/api/schemas/deadline/common/DeadlineRole";
import type { CreateDeadlineResponse } from "@/api/schemas/deadline/create/CreateDeadlineResponse";
import EntityCreationDialogLayout from "@/components/home/common/dialogs/EntityCreationDialogLayout.vue";
import DynamicUserInvitationInput from "@/components/home/common/forms/DynamicUserInvitationInput.vue";
import Step from "@/components/home/common/stepper/Step.vue";
import { useEntityCreate } from "@/composables/useEntityCreate";
import { MIN_DEADLINE_DURATION_MS } from "@/constants/forms";
import { tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { msToIso } from "@/utils/date";
import { parsePositiveRouteId } from "@/utils/route";
import DeadlineDatePicker from "./DeadlineDatePicker.vue";

const route = useRoute();
const currentScopeStore = useCurrentScopeStore();
const localizationStore = useLocalizationStore();

const thrId = currentScopeStore.thread?.id ?? parsePositiveRouteId(route.query.thrId) ?? 0;
if (!thrId) {
  emitter.emit("closeCreateEntityDialog");
}

const { t } = useI18n();
const ONE_HOUR: number = 3600000 // 60 * 60 * 1000

type DeadlineFormModel = {
  title: string;
  description: string;
  due: number | null;
}

const formRef = ref<FormInst | null>(null);
const invitationFormRef = ref<FormInst | null>(null);

const defaultInvitationRole: DeadlineRole = "DDL_ASSIGNEE"
const extraFormRules: FormRules = {
  due: [
    { required: true, type: "number", renderMessage: () => tFormError(t, "due-date"), trigger: ["input", "blur"] },
    {
      validator: (_, value: number | null) => value !== null && value >= Date.now() + MIN_DEADLINE_DURATION_MS,
      renderMessage: () => t("scopes.deadline.date-picker.minimum", { minutes: MIN_DEADLINE_DURATION_MS / 60000 }),
      trigger: ["change", "blur"],
    },
  ],
};
const { formModel, formRules, invitationFormModel, validateFormData, handleCreation } = useEntityCreate<
  DeadlineFormModel,
  DeadlineWithRole,
  CreateDeadlineResponse
>({
  scopeType: "deadline",
  listType: "deadlines",
  defaultInvitationRole,
  invitationPlaceholder: t("scopes.deadline.no-assignees"),
  formRef,
  invitationFormRef,
  initialFormModel: { title: "", description: "", due: Math.ceil((Date.now() + ONE_HOUR) / 60000) * 60000 },
  extraFormRules,
  createApiCall: async (formData, invitations) =>
    createDeadline(thrId, {
      title: formData.title,
      description: formData.description,
      due: msToIso(formData.due!),
      invitations: invitations,
    }),
  buildEntity: (response, formData) => ({
    id: response.deadlineId,
    title: formData.title,
    description: formData.description,
    due: formData.due!,
    threadId: thrId,
    createdAt: Date.now(),
    isCompleted: false,
    stats: {
      assignees: response.assignees,
      attachments: 0,
    },
    permissions: {
      update: true,
      delete: true,
      manageAssignees: true,
      manageAttachments: true
    },
    role: null,
    globalRole: response.globalRole
  }),
});
</script>

<template>
  <EntityCreationDialogLayout scope-type="deadline">
    <Step :title="t('scopes.common.form-sections.details')" :value="1" v-slot="{ nextStep }">
      <div class="
        overflow-y-auto
        landscape-mobile:max-h-[65vh]
      ">
        <n-form ref="formRef" :model="formModel" :rules="formRules">
          <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
            <n-input v-model:value="formModel.title" />
          </n-form-item>
          <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
            <n-input v-model:value="formModel.description" type="textarea" />
          </n-form-item>
          <div class="flex justify-center">
            <n-form-item :label="t('scopes.common.form-labels.due-date')" path="due">
              <deadline-date-picker
                v-model:value="formModel.due"
                :time-zone="localizationStore.timeZone"
              />
            </n-form-item>
          </div>
        </n-form>
        <div class="
          flex flex-1 justify-end
          landscape-mobile:ml-4 landscape-mobile:items-end
        ">
          <n-button role="button" @click="() => validateFormData(nextStep!)">
            <template #icon>
              <n-icon>
                <ArrowRight />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </Step>
    <Step :title="t('scopes.common.form-sections.invitations')" :value="2" v-slot="{ prevStep }">
      <n-form ref="invitationFormRef" :model="invitationFormModel">
        <n-form-item :label="t('scopes.common.form-labels.invitations')" path="username">
          <DynamicUserInvitationInput
            v-model="invitationFormModel"
            :default-role="defaultInvitationRole"
            :placeholder="t('scopes.deadline.no-assignees')"
            :usernames-fetcher="(usernamePrefix) => getOrganizationMembersWithUsernameStartingWith(currentScopeStore.organization!.id, usernamePrefix)"
          />
        </n-form-item>
      </n-form>
      <div class="flex flex-1 justify-between">
        <n-button role="button" @click="prevStep">
          <n-icon>
            <ArrowLeft />
          </n-icon>
        </n-button>
        <n-button role="button" @click="handleCreation" type="info">
          {{ t("actions.create") }}
        </n-button>
      </div>
    </Step>
  </EntityCreationDialogLayout>
</template>
