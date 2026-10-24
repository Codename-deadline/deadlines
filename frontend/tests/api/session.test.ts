import { useQuery, useQueryCache } from "@pinia/colada";
import { createPinia, disposePinia, setActivePinia } from "pinia";
import { expect, onTestFinished, test, vi } from "vitest";
import { createApp, effectScope, nextTick } from "vue";
import { installApi } from "@/plugins/api";
import { useTokenStore } from "@/stores/TokenStore";

function setup() {
  const pinia = createPinia();

  const app = createApp({});
  app.use(pinia);
  setActivePinia(pinia);
  const stop = installApi(app, pinia);

  const tokens = useTokenStore(pinia);
  tokens.updateTokens({ accessToken: "access", refreshToken: "refresh" });
  onTestFinished(() => {
    stop();
    disposePinia(pinia);
  });

  return { app, tokens, cache: useQueryCache(pinia) };
}

test("logout cancels queries and clears cache", async () => {
  const { tokens, cache } = setup();
  const key = ["private", "user"];
  cache.setQueryData(key, { username: "previous-user" });
  const entry = cache.get(key);
  if (!entry) throw new Error("Missing seeded entry");
  let signal!: AbortSignal;
  let resolve!: (value: unknown) => void;
  const query = cache.ensure({
    key: ["in-flight"],
    query: (context) => {
      signal = context.signal;
      return new Promise((r) => {
        resolve = r;
      });
    },
  });
  const pending = cache.fetch(query).catch(() => {});

  tokens.$reset();

  expect(signal.aborted).toBe(true);
  expect(cache.getEntries()).toHaveLength(0);
  expect(entry.state.value.data).toBeUndefined();

  resolve({ username: "previous-user" });
  await pending;

  expect(cache.getEntries()).toHaveLength(0);
  expect(query.state.value.data).toBeUndefined();
});

test("refresh preserves session and cache", () => {
  const { tokens, cache } = setup();
  const version = tokens.sessionVersion;
  const signal = tokens.sessionSignal();
  cache.setQueryData(["user"], { id: 1 });

  tokens.updateTokens({ accessToken: "rotated", refreshToken: "rotated-refresh" }, false);

  expect(tokens.sessionVersion).toBe(version);
  expect(signal.aborted).toBe(false);
  expect(cache.getQueryData(["user"])).toEqual({ id: 1 });
});

test("login clears cache", () => {
  const { tokens, cache } = setup();
  cache.setQueryData(["user"], { id: 1 });

  tokens.updateTokens({ accessToken: "other-user", refreshToken: "other-refresh" });

  expect(cache.getEntries()).toHaveLength(0);
});

test("only public queries run signed out", async () => {
  const { app, tokens } = setup();
  tokens.$reset();
  const privateQuery = vi.fn().mockResolvedValue("private");
  const publicQuery = vi.fn().mockResolvedValue("public");
  const scope = effectScope();
  onTestFinished(() => scope.stop());

  scope.run(() =>
    app.runWithContext(() => {
      useQuery({ key: ["private"], query: privateQuery });
      useQuery({ key: ["public"], query: publicQuery, enabled: true });
    }),
  );
  await nextTick();

  expect(privateQuery).not.toHaveBeenCalled();
  expect(publicQuery).toHaveBeenCalledOnce();
});

test("logout clears observers without refetching", async () => {
  const { app, tokens, cache } = setup();
  const fetcher = vi.fn().mockResolvedValue({ id: 1 });
  const scope = effectScope();
  onTestFinished(() => scope.stop());

  const query = scope.run(() => app.runWithContext(() => useQuery({ key: ["active"], query: fetcher })));
  if (!query) throw new Error("Missing query");
  await vi.waitFor(() => expect(query.data.value).toEqual({ id: 1 }));

  tokens.$reset();
  await nextTick();

  expect(query.data.value).toBeUndefined();
  expect(cache.getQueryData(["active"])).toBeUndefined();
  expect(fetcher).toHaveBeenCalledOnce();
});
