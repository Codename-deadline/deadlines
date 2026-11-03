import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { effectScope, nextTick, ref, watch } from "vue";
import { getGetDeadlineAssigneesQueryKey } from "@/api/generated/endpoints/deadlines/deadlines";
import { getGetMembersQueryKey } from "@/api/generated/endpoints/organizations/organizations";
import { getGetThreadAssigneesQueryKey } from "@/api/generated/endpoints/threads/threads";
import {
  DESKTOP_PAGE_SIZE,
  MOBILE_LANDSCAPE_PAGE_SIZE,
  MOBILE_PORTRAIT_PAGE_SIZE,
  useMemberPagination,
} from "@/composables/shared/useMemberPagination";

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

  const portrait = {
    page: Math.floor((3 * DESKTOP_PAGE_SIZE) / MOBILE_PORTRAIT_PAGE_SIZE),
    size: MOBILE_PORTRAIT_PAGE_SIZE,
  };
  const landscape = {
    page: Math.floor((portrait.page * portrait.size) / MOBILE_LANDSCAPE_PAGE_SIZE),
    size: MOBILE_LANDSCAPE_PAGE_SIZE,
  };
  const desktop = {
    page: Math.floor((landscape.page * landscape.size) / DESKTOP_PAGE_SIZE),
    size: DESKTOP_PAGE_SIZE,
  };

  await resize(390, 844);
  expect(active.pagination.value).toEqual(portrait);
  await resize(844, 390);
  expect(active.pagination.value).toEqual(landscape);
  await resize(1440, 1080);
  expect(active.pagination.value).toEqual(desktop);
  expect(snapshots).toEqual([
    ...(DESKTOP_PAGE_SIZE !== MOBILE_PORTRAIT_PAGE_SIZE ? [portrait] : []),
    ...(MOBILE_PORTRAIT_PAGE_SIZE !== MOBILE_LANDSCAPE_PAGE_SIZE ? [landscape] : []),
    ...(MOBILE_LANDSCAPE_PAGE_SIZE !== DESKTOP_PAGE_SIZE ? [desktop] : []),
  ]);
  stop();
});

test("initial phone orientation and short desktop windows determine page size", async () => {
  width.value = 844;
  height.value = 390;

  active = scope();
  expect(active.pageSize.value).toBe(MOBILE_LANDSCAPE_PAGE_SIZE);
  await resize(960, 600);
  expect(active.pageSize.value).toBe(MOBILE_LANDSCAPE_PAGE_SIZE);
  await resize(1440, 800);
  expect(active.pageSize.value).toBe(MOBILE_PORTRAIT_PAGE_SIZE);
  await resize(1440, 400);
  expect(active.pageSize.value).toBe(MOBILE_LANDSCAPE_PAGE_SIZE);
});

test("resizing is debounced and remains correct when the requested size changes back", async () => {
  active = scope();
  active.page.value = 2;
  width.value = 390;
  height.value = 844;

  await nextTick();
  await vi.advanceTimersByTimeAsync(100);
  expect(active.pagination.value).toEqual({ page: 2, size: DESKTOP_PAGE_SIZE });
  await resize(1440, 1080);
  expect(active.pagination.value).toEqual({ page: 2, size: DESKTOP_PAGE_SIZE });
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
  expect(active.pagination.value).toEqual({ page: 0, size: DESKTOP_PAGE_SIZE });
});

describe.each([
  ["organizations", getGetMembersQueryKey],
  ["threads", getGetThreadAssigneesQueryKey],
  ["deadlines", getGetDeadlineAssigneesQueryKey],
] as const)("%s pagination cache", (_, key) => {
  test("separates page sizes and lets mutations invalidate every page and size", () => {
    active = scope();
    const desktop = key(1, { page: 2, size: DESKTOP_PAGE_SIZE });
    const phone = key(1, { page: 2, size: MOBILE_LANDSCAPE_PAGE_SIZE });

    expect(desktop).not.toEqual(phone);
    expect(desktop.slice(0, -1)).toEqual(phone.slice(0, -1));
    expect(desktop.slice(0, -1)).not.toEqual(key(2, { page: 2, size: DESKTOP_PAGE_SIZE }).slice(0, -1));
  });
});
