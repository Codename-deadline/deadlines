<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@vicons/fa";
import { type FormInst, type FormRules, NButton, NForm, NFormItem, NIcon, NInput } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toCreateDeadlineRequest } from "@/api/adapters/deadline";
import EntityCreationDialogLayout from "@/components/home/common/dialogs/EntityCreationDialogLayout.vue";
import DynamicUserInvitationInput from "@/components/home/common/forms/DynamicUserInvitationInput.vue";
import Step from "@/components/home/common/stepper/Step.vue";
import { useDeadlineMutations } from "@/composables/useDeadlineMutations";
import { useEntityCreate } from "@/composables/useEntityCreate";
import { DEFAULT_DEADLINE_INVITATION_ROLE } from "@/constants/defaults";
import { MIN_DEADLINE_DURATION_MS } from "@/constants/forms";
import { HOUR_MS, MINUTE_MS } from "@/constants/time";
import { tFormError } from "@/locales/utils";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { useLocalizationStore } from "@/stores/LocalizationStore";
import { parsePositiveRouteId } from "@/utils/route";
import DeadlineDatePicker from "./DeadlineDatePicker.vue";

const route = useRoute();
const { t } = useI18n();
const currentScopeStore = useCurrentScopeStore();
const localizationStore = useLocalizationStore();

const thrId = currentScopeStore.thread?.id ?? parsePositiveRouteId(route.query.thrId) ?? 0;
if (!thrId) {
  emitter.emit("closeCreateEntityDialog");
}

type DeadlineFormModel = {
  title: string;
  description: string;
  due: number | null;
}

const formRef = ref<FormInst | null>(null);
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

const { create } = useDeadlineMutations(thrId);
const { formModel, formRules, invitationFormModel, validateFormData, handleCreation } = useEntityCreate<DeadlineFormModel>({
  scopeType: "deadline",
  formRef,
  initialFormModel: { title: "", description: "", due: Math.ceil((Date.now() + HOUR_MS) / MINUTE_MS) * MINUTE_MS },
  extraFormRules,
  isLoading: create.isLoading,
  create: (model, invitations) => {
    if (model.due === null) throw new TypeError("A deadline requires a due date");

    return create.mutateAsync({
      threadId: thrId,
      createDeadlineRequest: toCreateDeadlineRequest({ ...model, due: model.due, invitations }),
    });
  },
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
            :default-role="DEFAULT_DEADLINE_INVITATION_ROLE"
            :placeholder="t('scopes.deadline.no-assignees')"
            :organization-id="currentScopeStore.organization?.id ?? 0"
          />
        </n-form-item>
      </n-form>
      <div class="flex flex-1 justify-between">
        <n-button role="button" @click="prevStep">
          <n-icon>
            <ArrowLeft />
          </n-icon>
        </n-button>
        <n-button
          role="button"
          @click="handleCreation"
          type="info"
          :loading="create.isLoading.value"
          :disabled="create.isLoading.value"
        >
          {{ t("actions.create") }}
        </n-button>
      </div>
    </Step>
  </EntityCreationDialogLayout>
</template>
