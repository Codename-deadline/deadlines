import { useNotification } from "naive-ui";
import { useI18n } from "vue-i18n";
import { requestErrorNotification } from "@/utils/requestError";

export function useRequestError() {
  const notification = useNotification();
  const { t, te } = useI18n();

  return (error: unknown) => {
    const options = requestErrorNotification(error, (key, params) => (te(key) ? t(key, params ?? {}) : undefined));
    if (options) notification.error(options);
  };
}
