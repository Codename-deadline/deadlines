<script setup lang="ts">
import { type FormInst, type FormRules, NButton, NCard, NForm, NFormItem, NInput, NSelect, useMessage } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { PatchUserRequest } from "@/api/schemas/user/patch/PatchUserRequest";
import { patchUser } from "@/api/user";
import LanguageTooltip from "@/components/common/LanguageTooltip.vue";
import TimezoneSelect from "@/components/common/TimezoneSelect.vue";
import { useApi } from "@/composables/useApi";
import { useLoading } from "@/composables/useLoading";
import { tLanguageOptions } from "@/locales/utils";
import { useUserStore } from "@/stores/UserStore";
import { Language } from "@/types/Language";
import { normalizeUsername } from "@/utils/validation";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const message = useMessage();
const { makeRequest } = useApi();
const userStore = useUserStore();
const { isLoading: isSaving, withLoading } = useLoading();

type ProfileFormModel = PatchUserRequest & {
  fullName: string;
  username: string;
  language: Language;
  timeZone: string;
};

const formRef = ref<FormInst | null>(null);
const formModel = ref<ProfileFormModel>({
  fullName: userStore.user?.fullName ?? "",
  username: normalizeUsername(userStore.user?.username ?? ""),
  language: userStore.user?.language ?? Language.ENGLISH,
  timeZone: userStore.user?.timeZone ?? "",
});
const formRules: FormRules = {
  fullName: [
    {
      required: true,
      renderMessage: () => t("profile.form.validation.full-name-required"),
      trigger: ["input", "blur"],
    },
  ],
  username: [
    {
      required: true,
      renderMessage: () => t("profile.form.validation.username-required"),
      trigger: ["input", "blur"],
    },
  ],
  language: [
    { required: true, renderMessage: () => t("profile.form.validation.language-required"), trigger: ["change"] },
  ],
  timeZone: [
    { required: true, renderMessage: () => t("profile.form.validation.time-zone-required"), trigger: ["change"] },
  ],
};

const languageOptions = computed(() => tLanguageOptions(t));

const handleUsernameUpdate = (value: string) => {
  formModel.value.username = normalizeUsername(value);
};

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;

    const request: PatchUserRequest = {
      ...formModel.value,
      fullName: formModel.value.fullName?.trim(),
      username: formModel.value.username?.trim(),
    };
    const response = await withLoading(() => makeRequest(() => patchUser(request)));
    if (!response.ok) return;

    userStore.updateProfile(request);
    message.success(t("profile.form.updated"));
    emit("close");
  });
};
</script>

<template>
  <n-card :title="t('profile.form.title')" closable @close="emit('close')">
    <n-form ref="formRef" :model="formModel" :rules="formRules">
      <n-form-item :label="t('profile.form.full-name')" path="fullName">
        <n-input v-model:value="formModel.fullName" class="rounded-lg!" />
      </n-form-item>
      <n-form-item :label="t('profile.form.username')" path="username">
        <div class="flex w-full items-center gap-2">
          <span class="description text-lg">@</span>
          <n-input
            :value="formModel.username"
            class="rounded-lg!"
            @update:value="handleUsernameUpdate"
          />
        </div>
      </n-form-item>
      <n-form-item :label="t('profile.form.language')" path="language">
        <template #label>
          <div class="flex gap-1 items-center">
            <div>{{ t('profile.form.language') }}</div>
            <language-tooltip />
          </div>
        </template>
        <n-select v-model:value="formModel.language" :options="languageOptions" class="rounded-lg!" />
      </n-form-item>
      <n-form-item :label="t('profile.form.time-zone')" path="timeZone">
        <timezone-select v-model:value="formModel.timeZone" class="rounded-lg!" />
      </n-form-item>
    </n-form>
    <div class="mt-4 flex justify-end">
      <n-button role="button" type="info" class="rounded-lg!" :loading="isSaving" @click="handleSave">
        {{ t("actions.save") }}
      </n-button>
    </div>
  </n-card>
</template>
