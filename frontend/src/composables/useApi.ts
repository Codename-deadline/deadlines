import { useNotification } from "naive-ui";
import type { NotificationApiInjection } from "naive-ui/es/notification/src/NotificationProvider";
import { useI18n } from "vue-i18n";
import { isCancellation } from "@/api/errors";
import { parseZodError } from "@/api/utils";
import { useTokenStore } from "@/stores/TokenStore";
import type { ApiError, FormErrors, SafeApiCall } from "@/types/api";
import type { OperationResult } from "@/types/OperationResult";
import { displayApiError as DAE, displayFormErrors } from "@/utils";

export function useApi() {
  const { t, te } = useI18n();
  const notification = useNotification();

  const tSafe = (key: string, options?: Record<string, unknown>) => {
    return te(key) ? t(key, options ?? {}) : undefined;
  };

  const makeRequest = async <T>(
    request: () => Promise<SafeApiCall<T>>,
    displayValidationError: (
      t: any,
      notification: NotificationApiInjection,
      error: FormErrors,
    ) => void = displayFormErrors,
    displayApiError: (t: any, notification: NotificationApiInjection, error: ApiError) => void = DAE,
  ): Promise<OperationResult<T>> => {
    const session = useTokenStore().sessionSignal();

    const res = await request();
    if (session.aborted) return { ok: false };
    if (res.ok) return { ok: true, data: res.data };

    if (res.reason === "validation") {
      displayValidationError(t, notification, parseZodError(res.error));
      return { ok: false };
    }
    if (!isCancellation(res.error.error.cause)) {
      displayApiError(tSafe, notification, res.error);
    }
    return { ok: false };
  };

  return { makeRequest };
}
