import { type FormInst, type FormRules, useMessage } from "naive-ui";
import { type MaybeRefOrGetter, type Ref, ref, toValue } from "vue";
import { useI18n } from "vue-i18n";
import { tEntityToastAction, tFormError } from "@/locales/utils";
import type { ScopeType } from "@/types/scope";
import { useRequestError } from "./useRequestError";

/** Form behavior only. Mutations own server writes and cache synchronization. */
export function useEntityEdit<T extends { title: string }>(config: {
  scopeType: ScopeType;
  formRef: Ref<FormInst | null>;
  initialFormModel: T;
  extraFormRules?: FormRules;
  isLoading: MaybeRefOrGetter<boolean>;
  patch: (model: T) => Promise<unknown>;
}) {
  const { t } = useI18n();
  const message = useMessage();
  const displayError = useRequestError();

  const patchFormModel = ref(config.initialFormModel);
  const patchFormRules: FormRules = {
    title: [{ required: true, renderMessage: () => tFormError(t, "title"), trigger: ["input", "blur"] }],
    ...config.extraFormRules,
  };

  const handlePatch = () => {
    if (toValue(config.isLoading)) return;

    config.formRef.value?.validate(async (errors) => {
      if (errors) return;
      try {
        await config.patch(patchFormModel.value as T);
        message.success(tEntityToastAction(t, config.scopeType, "updated"));
      } catch (error) {
        displayError(error);
      }
    });
  };

  return { patchFormModel, patchFormRules, handlePatch };
}
