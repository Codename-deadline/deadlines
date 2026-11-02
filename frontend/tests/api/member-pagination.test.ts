import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { effectScope, nextTick, ref, watch } from "vue";
import { getGetDeadlineAssigneesQueryKey } from "@/api/generated/endpoints/deadlines/deadlines";
import { getGetMembersQueryKey } from "@/api/generated/endpoints/organizations/organizations";
import { getGetThreadAssigneesQueryKey } from "@/api/generated/endpoints/threads/threads";
import { useMemberPagination } from "@/composables/shared/useMemberPagination";

const width = ref(1440);
const height = ref(1080);
vi.mock("@vueuse/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vueuse/core")>()),
  useWindowSize: () => ({ width, height }),
}));

const scope = () => {
  const scope = effectScope();
  const entityId = ref(1);
  const pagination = scope.run(() => useMemberPagination(entityId))!;
  return { ...pagination, entityId, scope };
};
let active: ReturnType<typeof scope>;

beforeEach(() => {
  vi.useFakeTimers();
  width.value = 1440;
  height.value = 1080;
});
afterEach(() => {
  active.scope.stop();
  vi.useRealTimers();
});

async function resize(w: number, h: number) {
  width.value = w;
  height.value = h;
  await nextTick();
  await vi.advanceTimersByTimeAsync(150);
  await nextTick();
}

test("resizing preserves the first item's position and publishes page and size together", async () => {
  active = scope();
  active.page.value = 3;
  const snapshots: unknown[] = [];
  const stop = watch(active.pagination, (value) => snapshots.push(value), { flush: "sync" });

  await resize(390, 844);
  expect(active.pagination.value).toEqual({ page: 6, size: 5 });
  await resize(844, 390);
  expect(active.pagination.value).toEqual({ page: 15, size: 2 });
  await resize(1440, 1080);
  expect(active.pagination.value).toEqual({ page: 3, size: 10 });
  expect(snapshots).toEqual([
    { page: 6, size: 5 },
    { page: 15, size: 2 },
    { page: 3, size: 10 },
  ]);
  stop();
});

test("initial phone orientation and short desktop windows determine page size", async () => {
  width.value = 844;
  height.value = 390;

  active = scope();
  expect(active.pageSize.value).toBe(2);
  await resize(960, 600);
  expect(active.pageSize.value).toBe(2);
  await resize(1440, 800);
  expect(active.pageSize.value).toBe(5);
  await resize(1440, 400);
  expect(active.pageSize.value).toBe(2);
});

test("resizing is debounced and remains correct when the requested size changes back", async () => {
  active = scope();
  active.page.value = 2;
  width.value = 390;
  height.value = 844;

  await nextTick();
  await vi.advanceTimersByTimeAsync(100);
  expect(active.pagination.value).toEqual({ page: 2, size: 10 });
  await resize(1440, 1080);
  expect(active.pagination.value).toEqual({ page: 2, size: 10 });
});

test("entity changes reset the page; resolved empty and shortened lists clamp it", () => {
  active = scope();
  active.page.value = 5;

  active.clampPage(3);
  expect(active.page.value).toBe(2);
  active.clampPage(0);
  expect(active.page.value).toBe(0);
  active.page.value = 2;
  active.entityId.value = 7;
  expect(active.pagination.value).toEqual({ page: 0, size: 10 });
});

describe.each([
  ["organizations", getGetMembersQueryKey],
  ["threads", getGetThreadAssigneesQueryKey],
  ["deadlines", getGetDeadlineAssigneesQueryKey],
] as const)("%s pagination cache", (_, key) => {
  test("separates page sizes and lets mutations invalidate every page and size", () => {
    active = scope();
    const desktop = key(1, { page: 2, size: 10 });
    const phone = key(1, { page: 2, size: 2 });

    expect(desktop).not.toEqual(phone);
    expect(desktop.slice(0, -1)).toEqual(phone.slice(0, -1));
    expect(desktop.slice(0, -1)).not.toEqual(key(2, { page: 2, size: 10 }).slice(0, -1));
  });
});
