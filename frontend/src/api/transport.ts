import type { TokenPair } from "@/api/generated/models";
import emitter from "@/plugins/emitter";
import { useTokenStore } from "@/stores/TokenStore";
import { ApiRequestError } from "./errors";
import { HTTP_STATUS } from "./http-status";

const ATTEMPT_TIMEOUT_MS: number = 5_000;
const TOTAL_TIMEOUT_MS: number = 30_000;
const MAX_TRANSIENT_RETRIES: number = 1;
const RETRY_DELAY_MS: number = 500;
const REFRESH_REJECTION_STATUSES = new Set<number>([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN]);

type ApiPrefixedPath = string;
type ParseAs = "json" | "blob";
type RequestResult<T> = { data: T; response: Response };

function addApiVersionedPrefix(suffix: string): ApiPrefixedPath {
  return `/api${suffix}`;
}
const PUBLIC_AUTH_PATHS = new Set(
  ["/auth/register-otp", "/auth/otp", "/auth/otp/verify", "/auth/verify-password"].map(addApiVersionedPrefix),
);
// TODO: Consider changing to POST?
const NOT_IDEMPOTENT_GET_PATHS = new Set(["/auth/sign-out"].map(addApiVersionedPrefix));
const REFRESH_TOKEN_PATH: ApiPrefixedPath = addApiVersionedPrefix("/auth/refresh-token");

const refreshes = new WeakMap<AbortSignal, Promise<RequestResult<TokenPair>>>();

function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  return base && !path.startsWith(`${base}/`) ? `${base}${path}` : path;
}

/** Stop waiting on abort without cancelling the underlying operation (such as a shared refresh). */
function waitWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();

  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

async function send<T>(
  url: string,
  options: RequestInit,
  token: string | null,
  signal: AbortSignal,
  parseAs: ParseAs,
): Promise<RequestResult<T>> {
  const timeout = AbortSignal.timeout(ATTEMPT_TIMEOUT_MS);
  const attemptSignal = AbortSignal.any([signal, timeout]);

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    attemptSignal.throwIfAborted();

    const response = await waitWithAbort(fetch(url, { ...options, headers, signal: attemptSignal }), attemptSignal);
    let data: unknown;
    if (response.ok && parseAs === "blob") {
      data = await waitWithAbort(response.blob(), attemptSignal);
    } else {
      // `response.text()` is used to preserve the original body in case of `ValidationError`
      const text = await waitWithAbort(response.text(), attemptSignal);
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (cause) {
          if (response.ok) {
            throw ApiRequestError.validation("Invalid JSON response", { response, body: text, cause });
          }
          data = text;
        }
      }
    }

    attemptSignal.throwIfAborted();
    if (!response.ok) {
      throw ApiRequestError.http(response, { body: data });
    }
    return { data: data as T, response };
  } catch (cause) {
    if (signal.aborted) throw signal.reason;
    if (cause instanceof ApiRequestError) throw cause;
    if (timeout.aborted) {
      throw ApiRequestError.timeout(ATTEMPT_TIMEOUT_MS, cause);
    }
    throw ApiRequestError.network(cause);
  }
}

function expireSession(tokens: ReturnType<typeof useTokenStore>) {
  tokens.$reset();
  emitter.emit("failedToRefreshToken");
}

/**
 * Attempts to refresh the token pair using refresh token from the token store.
 * 1. Does nothing if there is already an inflight refresh request
 * 2. Never retries (makes <= 1 http requests)
 */
export function refreshSession(): Promise<RequestResult<TokenPair>> {
  const tokens = useTokenStore();
  const session = tokens.sessionSignal();
  const existing = refreshes.get(session);
  if (existing) return existing;

  const promise = (async () => {
    if (!tokens.refreshToken) {
      throw new ApiRequestError("HttpError", "No refresh token", {
        response: new Response(null, { status: HTTP_STATUS.UNAUTHORIZED }),
      });
    }
    try {
      const result = await send<TokenPair>(
        apiUrl("/api/auth/refresh-token"),
        { method: "POST" },
        tokens.refreshToken,
        session,
        "json",
      );

      session.throwIfAborted();
      tokens.updateTokens(result.data, false);
      return result;
    } catch (error) {
      if (
        !session.aborted &&
        error instanceof ApiRequestError &&
        error.status !== undefined &&
        REFRESH_REJECTION_STATUSES.has(error.status)
      ) {
        expireSession(tokens);
      }
      throw error;
    }
  })();

  refreshes.set(session, promise);
  promise.finally(() => refreshes.delete(session)).catch(() => {});
  return promise;
}

/** Both clients use this path; only safe reads retry, and a 401 is replayed at most once. */
export async function request<T>(
  path: string,
  options: RequestInit = {},
  parseAs: ParseAs = "json",
): Promise<RequestResult<T>> {
  const tokens = useTokenStore();

  const session = tokens.sessionSignal();
  const timeout = AbortSignal.timeout(TOTAL_TIMEOUT_MS);
  const signal = AbortSignal.any([session, timeout, ...(options.signal ? [options.signal] : [])]);

  const url: string = apiUrl(path);
  const fullPath: string = new URL(url, "http://localhost").pathname;
  const pathname: string = fullPath.substring(fullPath.lastIndexOf("/api/"));
  const isPublicAuth: boolean = PUBLIC_AUTH_PATHS.has(pathname);
  const isSafeRead =
    ["GET", "HEAD"].includes(options.method?.toUpperCase() ?? "GET") && !NOT_IDEMPOTENT_GET_PATHS.has(pathname);

  try {
    signal.throwIfAborted();

    if (pathname === REFRESH_TOKEN_PATH) {
      return (await waitWithAbort(refreshSession(), signal)) as RequestResult<T>;
    }

    let replayed = false;
    if (!isPublicAuth && !tokens.accessToken && tokens.refreshToken) {
      await waitWithAbort(refreshSession(), signal);
      replayed = true;
    }

    let retries = 0;
    while (true) {
      signal.throwIfAborted();

      const accessToken = isPublicAuth ? null : tokens.accessToken;
      try {
        return await send<T>(url, options, accessToken, signal, parseAs);
      } catch (error) {
        signal.throwIfAborted();

        if (!(error instanceof ApiRequestError)) throw error;
        if (error.status === HTTP_STATUS.UNAUTHORIZED && !isPublicAuth) {
          if (replayed || !tokens.refreshToken) {
            if (tokens.accessToken || tokens.refreshToken) expireSession(tokens);
            throw error;
          }
          // Another request might already have refreshed while this 401 was in flight.
          if (tokens.accessToken === accessToken) await waitWithAbort(refreshSession(), signal);
          replayed = true;
          continue;
        }
        if (!isSafeRead || !error.isTransient) throw error;
        if (retries >= MAX_TRANSIENT_RETRIES) throw error;
        retries++;
        await waitWithAbort(new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS)), signal);
      }
    }
  } catch (error) {
    if (session.aborted) throw session.reason;
    if (options.signal?.aborted) throw options.signal.reason;
    if (timeout.aborted) {
      throw ApiRequestError.timeout(TOTAL_TIMEOUT_MS, error);
    }
    throw error;
  }
}

/** Orval mutator: failed requests reject rather than becoming successful query data. */
export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  return (await request<T>(url, options)).data;
}
