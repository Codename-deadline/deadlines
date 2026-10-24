import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createAttachment } from "@/api/generated/endpoints/deadlines/deadlines";
import { deleteUser, getUser, patchUser } from "@/api/generated/endpoints/user/user";
import { apiRequest, refreshSession } from "@/api/transport";
import emitter from "@/plugins/emitter";
import { useTokenStore } from "@/stores/TokenStore";

function jwt(subject: string) {
  return `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: subject })).toString("base64url")}.c2lnbmF0dXJl`;
}
const oldTokens = { accessToken: jwt("old-access"), refreshToken: jwt("old-refresh") };
const newTokens = { accessToken: jwt("new-access"), refreshToken: jwt("new-refresh") };
const fetcher = vi.fn<typeof fetch>();

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  setActivePinia(createPinia());
  useTokenStore().updateTokens(oldTokens);
  fetcher.mockReset();
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  emitter.all.clear();
});

test("preserves request headers", async () => {
  fetcher.mockResolvedValue(Response.json({ username: "user" }));

  const result = await getUser({ headers: new Headers({ "X-Test": "yes" }) });
  const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers);

  expect(result).toEqual({ username: "user" });
  expect(headers.get("Authorization")).toBe(`Bearer ${oldTokens.accessToken}`);
  expect(headers.get("X-Test")).toBe("yes");
});

test("shares refresh between requests", async () => {
  const refresh = deferred<Response>();
  fetcher.mockImplementation(async (url, options) => {
    const token = new Headers(options?.headers).get("Authorization");
    if (String(url).endsWith("/refresh-token")) {
      return refresh.promise;
    }
    return token === `Bearer ${newTokens.accessToken}`
      ? Response.json({ username: "user" })
      : new Response(null, { status: 401 });
  });

  const first = getUser();
  const second = getUser();
  await vi.waitFor(() =>
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith("/refresh-token"))).toHaveLength(1),
  );
  refresh.resolve(Response.json(newTokens));
  const results = await Promise.all([first, second]);
  const refreshCalls = fetcher.mock.calls.filter(([url]) => String(url).endsWith("/refresh-token"));

  expect(results).toEqual([{ username: "user" }, { username: "user" }]);
  expect(refreshCalls).toHaveLength(1);
  expect(new Headers(refreshCalls[0]?.[1]?.headers).get("Authorization")).toBe(`Bearer ${oldTokens.refreshToken}`);
  expect(fetcher).toHaveBeenCalledTimes(5);
  expect(useTokenStore().accessToken).toBe(newTokens.accessToken);
  expect(useTokenStore().sessionVersion).toBe(1);
});

test("reuses refreshed tokens on late 401", async () => {
  const late = deferred<Response>();
  let calls = 0;
  fetcher.mockImplementation(async (url) => {
    if (String(url).endsWith("/refresh-token")) return Response.json(newTokens);
    if (++calls === 1) return late.promise;
    return new Response(null, { status: 204 });
  });

  const pending = getUser();
  await refreshSession();
  late.resolve(new Response(null, { status: 401 }));
  await pending;

  expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith("/refresh-token"))).toHaveLength(1);
});

test("refreshes missing access tokens", async () => {
  useTokenStore().invalidate({ access: true });
  fetcher.mockResolvedValueOnce(Response.json(newTokens)).mockResolvedValueOnce(Response.json({ id: 1 }));

  const result = await getUser();

  expect(result).toEqual({ id: 1 });
  expect(fetcher.mock.calls[0]?.[0]).toBe("/api/auth/refresh-token");
  expect(new Headers(fetcher.mock.calls[1]?.[1]?.headers).get("Authorization")).toBe(`Bearer ${newTokens.accessToken}`);
});

test("expires sessions on repeated 401", async () => {
  const expired = vi.fn();
  emitter.on("failedToRefreshToken", expired);
  fetcher
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(newTokens))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));

  const pending = getUser();

  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(expired).toHaveBeenCalledOnce();
  expect(useTokenStore().refreshToken).toBeNull();
});

test("does not repeat proactive refresh", async () => {
  useTokenStore().invalidate({ access: true });
  fetcher.mockResolvedValueOnce(Response.json(newTokens)).mockResolvedValueOnce(new Response(null, { status: 401 }));

  const pending = getUser();

  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(useTokenStore().refreshToken).toBeNull();
});

test.each([401, 403])("expires sessions on refresh %s", async (status) => {
  const expired = vi.fn();
  emitter.on("failedToRefreshToken", expired);
  fetcher
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status }));

  const pending = getUser();

  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(expired).toHaveBeenCalledOnce();
  expect(useTokenStore().accessToken).toBeNull();
});

test("preserves sessions on refresh failure", async () => {
  fetcher
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response("unavailable", { status: 503 }));

  const pending = getUser();

  await expect(pending).rejects.toMatchObject({ name: "HttpError", status: 503, body: "unavailable" });
  expect(useTokenStore().refreshToken).toBe(oldTokens.refreshToken);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test("rejects invalid refresh tokens", async () => {
  fetcher.mockResolvedValue(Response.json({ accessToken: "invalid", refreshToken: "invalid" }));

  const pending = refreshSession();

  await expect(pending).rejects.toMatchObject({ name: "ValidationError" });
  expect(useTokenStore().accessToken).toBe(oldTokens.accessToken);
});

test.each(["register-otp", "otp", "otp/verify", "verify-password"])(
  "skips refresh for public auth %s",
  async (path) => {
    fetcher.mockResolvedValue(Response.json({ code: "invalid.credentials" }, { status: 401 }));

    const pending = apiRequest(`/api/auth/${path}`, { method: "POST" });

    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).has("Authorization")).toBe(false);
    expect(useTokenStore().accessToken).toBe(oldTokens.accessToken);
  },
);

test("cancels refresh waiters independently", async () => {
  const refresh = deferred<Response>();
  fetcher.mockImplementation(async (url, options) => {
    if (String(url).endsWith("/refresh-token")) return refresh.promise;
    return new Headers(options?.headers).get("Authorization") === `Bearer ${newTokens.accessToken}`
      ? Response.json({ id: 1 })
      : new Response(null, { status: 401 });
  });
  const controller = new AbortController();

  const cancelled = getUser({ signal: controller.signal });
  const other = getUser();
  const rejection = expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
  await vi.waitFor(() =>
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith("/refresh-token"))).toHaveLength(1),
  );
  controller.abort();

  await rejection;

  refresh.resolve(Response.json(newTokens));

  await expect(other).resolves.toEqual({ id: 1 });
});

test("skips cancelled requests", async () => {
  const signal = AbortSignal.abort();

  const pending = getUser({ signal });

  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(fetcher).not.toHaveBeenCalled();
});

test("cancels response parsing", async () => {
  const body = deferred<string>();
  const response = Response.json({});
  vi.spyOn(response, "text").mockReturnValue(body.promise);
  fetcher.mockResolvedValue(response);
  const controller = new AbortController();

  const pending = getUser({ signal: controller.signal });
  const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  await vi.waitFor(() => expect(response.text).toHaveBeenCalledOnce());
  controller.abort();

  await rejected;
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  expect(fetcher).toHaveBeenCalledOnce();

  body.resolve("{}");
});

test("rejects in-flight responses after logout", async () => {
  const response = deferred<Response>();
  fetcher.mockReturnValue(response.promise);

  const pending = getUser();
  const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  useTokenStore().$reset();
  response.resolve(Response.json({ username: "previous-user" }));

  await rejected;
});

test("discards refresh from previous sessions", async () => {
  const response = deferred<Response>();
  fetcher.mockReturnValue(response.promise);

  const pending = refreshSession();
  const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  useTokenStore().updateTokens(newTokens);
  response.resolve(Response.json(oldTokens));

  await rejected;
  expect(useTokenStore().accessToken).toBe(newTokens.accessToken);
});

test("retries safe reads", async () => {
  fetcher.mockRejectedValueOnce(new TypeError("offline")).mockResolvedValueOnce(Response.json({ id: 1 }));

  const result = await getUser();

  expect(result).toEqual({ id: 1 });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test("does not retry writes", async () => {
  fetcher.mockRejectedValue(new TypeError("offline"));

  const pending = patchUser({ fullName: "User" });

  await expect(pending).rejects.toMatchObject({
    name: "NetworkError",
  });
  expect(fetcher).toHaveBeenCalledOnce();
});

test.each(["network", 429, 503] as const)("limits retries for %s", async (failure) => {
  vi.useFakeTimers();
  if (failure === "network") {
    fetcher.mockRejectedValue(new TypeError("offline"));
  } else {
    fetcher.mockImplementation(async () => new Response("unavailable", { status: failure }));
  }

  const pending = getUser();
  const rejected = expect(pending).rejects.toMatchObject(
    failure === "network" ? { name: "NetworkError" } : { name: "HttpError", status: failure },
  );
  await vi.advanceTimersByTimeAsync(0);

  expect(fetcher).toHaveBeenCalledOnce();

  await vi.advanceTimersByTimeAsync(499);

  expect(fetcher).toHaveBeenCalledOnce();

  await vi.advanceTimersByTimeAsync(1);

  await rejected;
  expect(fetcher).toHaveBeenCalledTimes(2);

  await vi.advanceTimersByTimeAsync(500);

  expect(fetcher).toHaveBeenCalledTimes(2);
});

test.each([
  { format: "JSON", status: 422, body: { code: "invalid", violations: [{ field: "title" }] } },
  { format: "text", status: 403, body: "forbidden" },
])("preserves $format HTTP errors", async ({ status, body }) => {
  const response = typeof body === "string" ? new Response(body, { status }) : Response.json(body, { status });
  fetcher.mockResolvedValue(response);

  const pending = apiRequest("/api/test");

  await expect(pending).rejects.toMatchObject({ name: "HttpError", status, body, response });
  expect(fetcher).toHaveBeenCalledOnce();
});

test("rejects invalid JSON", async () => {
  fetcher.mockResolvedValueOnce(new Response("not JSON"));

  const pending = apiRequest("/api/test");

  await expect(pending).rejects.toMatchObject({ name: "ValidationError" });
});

test("accepts empty responses", async () => {
  fetcher.mockImplementation(async () => new Response(null, { status: 204 }));

  const result = await deleteUser();

  expect(result).toBeUndefined();
});

test("preserves multipart uploads", async () => {
  fetcher.mockResolvedValueOnce(Response.json({ id: 42 }));
  const bytes = new Uint8Array([0, 1, 127, 255]);

  await createAttachment(1, { meta: { filename: "file.bin" }, file: new Blob([bytes]) });
  const options = fetcher.mock.calls[0]?.[1];
  const form = options?.body;
  if (!(form instanceof FormData)) throw new Error("Expected multipart body");
  const meta = form.get("meta");
  const file = form.get("file");
  if (!(meta instanceof Blob) || !(file instanceof Blob)) throw new Error("Expected binary form parts");
  const metadata = JSON.parse(await meta.text());
  const uploaded = new Uint8Array(await file.arrayBuffer());

  expect(new Headers(options?.headers).has("Content-Type")).toBe(false);
  expect(meta.type).toBe("application/json");
  expect(metadata).toEqual({ filename: "file.bin" });
  expect(uploaded).toEqual(bytes);
});

test("cancels retry waits", async () => {
  const controller = new AbortController();
  fetcher.mockResolvedValue(new Response(null, { status: 503 }));

  const pending = getUser({ signal: controller.signal });
  const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  controller.abort();

  await rejected;
  expect(fetcher).toHaveBeenCalledOnce();
});
