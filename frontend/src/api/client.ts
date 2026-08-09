import { createSafeFetch, type NormalizedError } from "@asouei/safe-fetch";
import { GeneralErrorSchema } from "@/api/common/GeneralError";
import { useTokenStore } from "@/stores/TokenStore";

const env = import.meta.env;

export const client = createSafeFetch({
  baseURL: env.VITE_API_BASE_URL,
  timeoutMs: 5000,
  totalTimeoutMs: 30000,
  retries: {
    retries: 2,
    baseDelayMs: 500,
  },
  interceptors: {
    onRequest: (url: RequestInfo, init: RequestInit & { url: string }) => {
      const store = useTokenStore();

      const headers = new Headers(init.headers);
      const token: string | null = store.accessToken ?? store.refreshToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      init.headers = headers;

      return { input: url, init };
    },
    onError: async (error: NormalizedError) => {
      if (error.name !== "HttpError" || error.status === 401) return;

      const parsed = GeneralErrorSchema.safeParse(error.body);
      if (parsed.success) {
        console.error(`[API]: Code: ${parsed.data.code}, details: ${parsed.data.detail ?? "none"}`);
      } else {
        console.error(`[API]: Status: ${error.status}, failed to parse: ${parsed.error}`);
      }
    },
  },
});
