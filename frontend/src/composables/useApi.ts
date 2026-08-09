import { useNotification } from "naive-ui";
import type { NotificationApiInjection } from "naive-ui/es/notification/src/NotificationProvider";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { refreshToken as apiAuthRefreshToken } from "@/api/auth";
import { parseZodError } from "@/api/utils";
import emitter from "@/plugins/emitter";
import { useTokenStore } from "@/stores/TokenStore";
import type { ApiError, FormErrors, SafeApiCall } from "@/types/api";
import type { OperationResult } from "@/types/OperationResult";
import { displayApiError as DAE, displayFormErrors } from "@/utils";

export function useApi() {
  const { t, te } = useI18n();
  const notification = useNotification();
  const route = useRoute();
  const tokenStore = useTokenStore();

  const tSafe = (key: string, options?: Record<string, unknown>) => {
    return te(key) ? t(key, options ?? {}) : undefined;
  };

  const shouldRefresh = (status?: number): boolean => {
    // 401 during sign-in/sign-up is returned for invalid credentials
    return status !== undefined && status === 401 && !route.path.includes("auth");
  };

  const refreshToken = async (): Promise<boolean> => {
    tokenStore.invalidate({ access: true });
    const refreshToken: string | null = tokenStore.refreshToken;
    if (!refreshToken) return false;

    const res = await apiAuthRefreshToken();
    if (!res.ok) {
      if (res.reason === "api" && res.error.error.name === "HttpError") {
        tokenStore.invalidate({ refresh: true });
      }
      return false;
    }

    tokenStore.updateTokens(res.data);
    return true;
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
    const res = await request();
    if (res.ok) return { ok: true, data: res.data };

    if (res.reason === "validation") {
      displayValidationError(t, notification, parseZodError(res.error));
      return { ok: false };
    }
    if (!shouldRefresh(res.error.response?.status)) {
      displayApiError(tSafe, notification, res.error);
      return { ok: false };
    }

    const success = await refreshToken();
    if (!success) {
      emitter.emit("failedToRefreshToken");
      return { ok: false };
    }

    // Try again with the new token
    return await makeRequest(request, displayValidationError, displayApiError);
  };

  return { makeRequest, refreshToken };
}
