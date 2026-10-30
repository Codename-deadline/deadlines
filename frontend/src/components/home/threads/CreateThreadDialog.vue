<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@vicons/fa";
import { type FormInst, NButton, NForm, NFormItem, NIcon, NInput } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toCreateThreadRequest } from "@/api/adapters/thread";
import EntityCreationDialogLayout from "@/components/home/common/dialogs/EntityCreationDialogLayout.vue";
import DynamicUserInvitationInput from "@/components/home/common/forms/DynamicUserInvitationInput.vue";
import Step from "@/components/home/common/stepper/Step.vue";
import { useEntityCreate } from "@/composables/shared/useEntityCreate";
import { useThreadMutations } from "@/composables/threads/useThreadMutations";
import emitter from "@/plugins/emitter";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";
import { parsePositiveRouteId } from "@/utils/route";

const route = useRoute();
const currentScopeStore = useCurrentScopeStore();
const { t } = useI18n();

const organizationId = parsePositiveRouteId(route.query.orgId) ?? currentScopeStore.organizationId ?? 0;
if (!organizationId) {
  emitter.emit("closeCreateEntityDialog");
}

const formRef = ref<FormInst | null>(null);
const defaultInvitationRole = "THR_ASSIGNEE";
const { create } = useThreadMutations(organizationId);
const { formModel, formRules, invitationFormModel, validateFormData, handleCreation } = useEntityCreate({
  scopeType: "thread",
  formRef,
  initialFormModel: { title: "", description: "" },
  isLoading: create.isLoading,
  create: (model, invitations) => create.mutateAsync({
    organizationId,
    createThreadRequest: toCreateThreadRequest({ ...model, invitations })
  }),
});
</script>

<template>
  <EntityCreationDialogLayout scope-type="thread">
    <Step :title="t('scopes.common.form-sections.details')" :value="1" v-slot="{ nextStep }">
      <n-form ref="formRef" :model="formModel" :rules="formRules">
        <n-form-item :label="t('scopes.common.form-labels.title')" path="title">
          <n-input v-model:value="formModel.title" />
        </n-form-item>
        <n-form-item :label="t('scopes.common.form-labels.description')" path="description">
          <n-input v-model:value="formModel.description" type="textarea" />
        </n-form-item>
      </n-form>
      <div class="flex flex-1 justify-end">
        <n-button role="button" @click="() => validateFormData(nextStep!)">
          <template #icon>
            <n-icon>
              <ArrowRight />
            </n-icon>
          </template>
        </n-button>
      </div>
    </Step>
    <Step :title="t('scopes.common.form-sections.invitations')" :value="2" v-slot="{ prevStep }">
      <n-form ref="invitationFormRef" :model="invitationFormModel">
        <n-form-item :label="t('scopes.common.form-labels.invitations')" path="username">
          <DynamicUserInvitationInput
            v-model="invitationFormModel"
            :default-role="defaultInvitationRole"
            :placeholder="t('scopes.thread.no-assignees')"
            :organization-id="organizationId"
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
